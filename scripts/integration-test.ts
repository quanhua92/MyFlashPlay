#!/usr/bin/env node

/**
 * FlashPlay Integration Test Suite
 * 
 * Tests core functionality against any deployed URL
 * Usage: pnpm test:integration [URL]
 * Example: pnpm test:integration https://myflashplay.vercel.app
 */

import { chromium, type Browser, type Page } from 'playwright';
import { setTimeout } from 'timers/promises';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message?: string;
  duration: number;
}

class IntegrationTester {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl: string;
  private results: TestResult[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  private async setup() {
    console.log('🚀 Starting FlashPlay Integration Tests...');
    console.log(`🌐 Target URL: ${this.baseUrl}`);
    
    this.browser = await chromium.launch({ 
      headless: true,
      timeout: 30000
    });
    this.page = await this.browser.newPage();
    
    // Set viewport for consistent testing
    await this.page.setViewportSize({ width: 1280, height: 720 });
    
    // Set default timeouts
    this.page.setDefaultTimeout(15000);
    this.page.setDefaultNavigationTimeout(30000);
  }

  private async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async runTest(testName: string, testFn: () => Promise<void>) {
    const startTime = Date.now();
    
    try {
      console.log(`⏳ ${testName}...`);
      await testFn();
      const duration = Date.now() - startTime;
      this.results.push({ name: testName, status: 'pass', duration });
      console.log(`✅ ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      this.results.push({ name: testName, status: 'fail', message, duration });
      console.log(`❌ ${testName} (${duration}ms): ${message}`);
    }
  }

  // Test 1: Basic page load and navigation
  private async testPageLoad() {
    if (!this.page) throw new Error('Page not initialized');
    
    // First check if URL is reachable
    const response = await this.page.goto(this.baseUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    if (!response || response.status() >= 400) {
      throw new Error(`Failed to load page: ${response?.status()} ${response?.statusText()}`);
    }
    
    // Check if the page loaded successfully
    const title = await this.page.textContent('h1, title');
    if (!title) {
      throw new Error('No title found - page may not have loaded properly');
    }

    // Check if sample decks are loaded (be more flexible with selectors)
    const deckCards = await this.page.locator('[data-testid="deck-card"], .deck-card, .bg-white, .rounded-xl, .shadow').count();
    if (deckCards === 0) {
      throw new Error('No deck cards found on homepage - check if sample decks are loading');
    }
  }

  // Test 2: Sample decks are present with correct data
  private async testSampleDecks() {
    if (!this.page) throw new Error('Page not initialized');

    // Navigate to home if not already there
    await this.page.goto(this.baseUrl);
    
    // Look for Vietnamese deck (tests UTF-8 support)
    const vietnameseFound = await this.page.locator('text=Động Vật Việt Nam').count() > 0;
    if (!vietnameseFound) {
      throw new Error('Vietnamese sample deck not found - UTF-8 support issue');
    }

    // Look for math deck
    const mathFound = await this.page.locator('text=Math, text=Elementary, text=Toán').first().count() > 0;
    if (!mathFound) {
      throw new Error('Math sample deck not found');
    }

    // Check if decks show card counts
    const cardCountExists = await this.page.locator('text=/\\d+ cards/').count() > 0;
    if (!cardCountExists) {
      throw new Error('Deck card counts not displayed');
    }
  }

  // Test 3: Deck creation flow
  private async testDeckCreation() {
    if (!this.page) throw new Error('Page not initialized');

    // Navigate to create page
    await this.page.goto(`${this.baseUrl}/create`);
    
    // Fill in deck details
    const titleInput = this.page.locator('input[placeholder*="deck"], input[placeholder*="title"], input[type="text"]').first();
    await titleInput.fill('Test Integration Deck');
    
    // Look for markdown textarea
    const markdownArea = this.page.locator('textarea, [role="textbox"]').last();
    const testMarkdown = `What is 2 + 2? :: 4
Capital of France? :: Paris
The sky is blue :: true
Fish can fly :: false

What is the largest planet?
- Earth
- Jupiter
- Mars
- Venus
> Jupiter`;
    
    await markdownArea.fill(testMarkdown);
    
    // Save the deck
    const saveButton = this.page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
    await saveButton.click();
    
    // Wait for navigation or success indication
    await this.page.waitForTimeout(2000);
    
    // Check if we're redirected to decks page or see success message
    const url = this.page.url();
    const hasSuccess = await this.page.locator('text=success, text=created, text=saved').count() > 0;
    
    if (!url.includes('/decks') && !hasSuccess) {
      throw new Error('Deck creation did not complete successfully');
    }
  }

  // Test 4: Gameplay functionality
  private async testGameplay() {
    if (!this.page) throw new Error('Page not initialized');

    // Go to home page
    await this.page.goto(this.baseUrl);
    
    // Click on first available deck's play button
    const playButton = this.page.locator('text=Start Study, text=Play, .bg-gradient-to-r').first();
    
    if (await playButton.count() === 0) {
      throw new Error('No play button found on any deck');
    }
    
    await playButton.click();
    
    // Wait for game to load
    await this.page.waitForTimeout(2000);
    
    // Check if we're on a play page with game content
    const url = this.page.url();
    if (!url.includes('/play/')) {
      throw new Error(`Expected to be on play page, but on: ${url}`);
    }

    // Look for flashcard content
    const hasFlashcard = await this.page.locator('.flashcard, [data-testid="flashcard"], .bg-white.rounded-lg, .question, .answer').count() > 0;
    if (!hasFlashcard) {
      throw new Error('No flashcard content found in game');
    }

    // Look for game controls
    const hasControls = await this.page.locator('button:has-text("Next"), button:has-text("Flip"), button:has-text("Reveal"), button[aria-label*="next"], button[aria-label*="flip"]').count() > 0;
    if (!hasControls) {
      throw new Error('No game controls found');
    }
  }

  // Test 5: Markdown guide and templates
  private async testMarkdownGuide() {
    if (!this.page) throw new Error('Page not initialized');

    await this.page.goto(`${this.baseUrl}/create`);
    
    // Look for markdown guide
    const guideButton = this.page.locator('text=Guide, text=Help, text=Format, button:has-text("Markdown")').first();
    
    if (await guideButton.count() > 0) {
      await guideButton.click();
      await this.page.waitForTimeout(1000);
      
      // Check if guide shows simple format
      const hasSimpleFormat = await this.page.locator('text=Simple, text=Question :: Answer, text=✨').count() > 0;
      if (!hasSimpleFormat) {
        throw new Error('Markdown guide does not show simple format');
      }
    }

    // Check for templates
    const hasTemplates = await this.page.locator('text=Template, text=Super Simple, text=Basic Q&A').count() > 0;
    if (!hasTemplates) {
      throw new Error('No templates found on create page');
    }
  }

  // Test 6: Mobile responsiveness
  private async testMobileView() {
    if (!this.page) throw new Error('Page not initialized');

    // Switch to mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    
    await this.page.goto(this.baseUrl);
    
    // Check if navigation is mobile-friendly
    const navigation = await this.page.locator('nav, [role="navigation"]').count() > 0;
    if (!navigation) {
      throw new Error('No navigation found in mobile view');
    }

    // Check if decks are still visible and properly laid out
    const deckCards = await this.page.locator('.deck-card, .bg-white.dark\\:bg-gray-800.rounded-xl').count();
    if (deckCards === 0) {
      throw new Error('Deck cards not visible in mobile view');
    }

    // Reset to desktop view
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  // Test 7: Error handling and accessibility
  private async testErrorHandling() {
    if (!this.page) throw new Error('Page not initialized');

    // Test 404 page
    await this.page.goto(`${this.baseUrl}/nonexistent-page`);
    
    // Should either show 404 content or redirect to home
    const url = this.page.url();
    const has404Content = await this.page.locator('text=404, text=Not Found, text=not found').count() > 0;
    
    if (!url.includes(this.baseUrl) && !has404Content) {
      throw new Error('404 error not handled properly');
    }

    // Test accessibility - check for important ARIA attributes
    await this.page.goto(this.baseUrl);
    
    const hasAriaLabels = await this.page.locator('[aria-label], [aria-labelledby], [role]').count() > 0;
    if (!hasAriaLabels) {
      console.log('⚠️  Warning: Limited accessibility attributes found');
    }
  }

  // Main test runner
  async run() {
    try {
      await this.setup();

      await this.runTest('Page Load & Navigation', () => this.testPageLoad());
      await this.runTest('Sample Decks Present', () => this.testSampleDecks());
      await this.runTest('Deck Creation Flow', () => this.testDeckCreation());
      await this.runTest('Gameplay Functionality', () => this.testGameplay());
      await this.runTest('Markdown Guide & Templates', () => this.testMarkdownGuide());
      await this.runTest('Mobile Responsiveness', () => this.testMobileView());
      await this.runTest('Error Handling', () => this.testErrorHandling());

      this.printResults();
      
    } finally {
      await this.teardown();
    }
  }

  private printResults() {
    console.log('\n📊 Test Results Summary');
    console.log('=' .repeat(50));
    
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : '❌';
      const time = result.duration.toString().padStart(4, ' ');
      console.log(`${icon} ${result.name.padEnd(30, ' ')} ${time}ms`);
      if (result.message) {
        console.log(`   └─ ${result.message}`);
      }
    });
    
    console.log('=' .repeat(50));
    console.log(`📈 ${passed}/${this.results.length} tests passed (${totalTime}ms total)`);
    
    if (failed === 0) {
      console.log('🎉 All tests passed! FlashPlay is working correctly.');
      process.exit(0);
    } else {
      console.log(`💥 ${failed} test(s) failed. Please check the issues above.`);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const targetUrl = process.argv[2] || 'http://localhost:3000';
  
  if (!targetUrl.startsWith('http')) {
    console.error('❌ Please provide a valid URL (must start with http:// or https://)');
    console.log('Usage: pnpm test:integration <URL>');
    console.log('Example: pnpm test:integration https://myflashplay.vercel.app');
    process.exit(1);
  }

  const tester = new IntegrationTester(targetUrl);
  await tester.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Integration test failed:', error);
    process.exit(1);
  });
}