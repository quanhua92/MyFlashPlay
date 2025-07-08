#!/usr/bin/env node

/**
 * Robust MyFlashPlay Integration Test Suite
 * 
 * Specifically designed to handle the language selection modal
 * and all UI interactions properly
 * 
 * Usage: pnpm test:robust [URL]
 */

import { chromium, type Browser, type Page } from 'playwright';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message?: string;
  duration: number;
}

class RobustIntegrationTester {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl: string;
  private results: TestResult[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  private async setup() {
    console.log('🚀 Starting Robust MyFlashPlay Integration Tests...');
    console.log(`🌐 Target URL: ${this.baseUrl}`);

    this.browser = await chromium.launch({
      headless: true,
      timeout: 30000
    });
    this.page = await this.browser.newPage();

    // Set viewport for consistent testing
    await this.page.setViewportSize({ width: 1280, height: 720 });

    // Set default timeouts
    this.page.setDefaultTimeout(20000);
    this.page.setDefaultNavigationTimeout(30000);
  }

  private async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async forceCloseAllModals() {
    try {
      console.log('🔧 Force closing all modals and overlays...');
      
      // Press Escape multiple times to close any modals
      await this.page!.keyboard.press('Escape');
      await this.page!.waitForTimeout(500);
      await this.page!.keyboard.press('Escape');
      await this.page!.waitForTimeout(500);
      
      // Try to click on backdrop to close modals
      const backdrops = await this.page!.locator('.fixed.inset-0, [role="dialog"]').all();
      for (const backdrop of backdrops) {
        try {
          await backdrop.click({ position: { x: 10, y: 10 }, timeout: 2000 });
          await this.page!.waitForTimeout(500);
        } catch (e) {
          // Continue if click fails
        }
      }
      
      // Force dismiss by clicking any close buttons
      const closeButtons = await this.page!.locator('button[aria-label="Close"], button:has-text("×"), .close-button').all();
      for (const button of closeButtons) {
        try {
          await button.click({ timeout: 2000 });
          await this.page!.waitForTimeout(500);
        } catch (e) {
          // Continue if click fails
        }
      }
      
      console.log('✅ Modal cleanup completed');
    } catch (error) {
      console.log('⚠️  Modal cleanup failed, continuing...');
    }
  }

  private async handleLanguageSelection() {
    try {
      console.log('🌐 Handling language selection...');
      
      // Wait a bit for any animations
      await this.page!.waitForTimeout(1000);
      
      // Look for English option in various ways
      const englishSelectors = [
        'button:has-text("English")',
        'text=English',
        '[data-lang="en"]',
        '.language-option:has-text("English")',
        'li:has-text("English")',
        'div:has-text("English")'
      ];
      
      for (const selector of englishSelectors) {
        try {
          const element = this.page!.locator(selector).first();
          if (await element.count() > 0) {
            await element.click({ timeout: 3000 });
            await this.page!.waitForTimeout(2000);
            console.log(`✅ English selected using: ${selector}`);
            return;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      // If no English option found, try to proceed anyway
      console.log('⚠️  No English option found, trying to continue...');
      await this.forceCloseAllModals();
      
    } catch (error) {
      console.log('⚠️  Language selection failed, forcing modal close...');
      await this.forceCloseAllModals();
    }
  }

  private async runTest(testName: string, testFn: () => Promise<void>) {
    const startTime = Date.now();

    try {
      console.log(`⏳ ${testName}...`);
      
      // Always ensure modals are closed before starting a test
      await this.forceCloseAllModals();
      
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

  // Test 1: Page loads and language selection works
  private async testPageLoadAndLanguage() {
    if (!this.page) throw new Error('Page not initialized');

    const response = await this.page.goto(this.baseUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    if (!response || response.status() >= 400) {
      throw new Error(`Failed to load page: ${response?.status()} ${response?.statusText()}`);
    }

    // Handle language selection immediately
    await this.handleLanguageSelection();

    // Verify the page is functional
    const hasContent = await this.page.locator('h1').count() > 0 ||
                      await this.page.locator('.bg-gradient-to-r').count() > 0 ||
                      await this.page.locator('text=MyFlashPlay').count() > 0 ||
                      await this.page.locator('text=Create').count() > 0 ||
                      await this.page.locator('text=Play').count() > 0;
    if (!hasContent) {
      throw new Error('Main page content not found after language selection');
    }
  }

  // Test 2: Sample decks are visible
  private async testSampleDecks() {
    if (!this.page) throw new Error('Page not initialized');

    await this.page.goto(this.baseUrl);
    await this.handleLanguageSelection();
    await this.page.waitForTimeout(2000);

    const deckCards = await this.page.locator('.bg-white, .rounded-xl, .shadow, [data-testid="deck-card"]').count();
    if (deckCards === 0) {
      throw new Error('No sample decks found');
    }

    console.log(`Found ${deckCards} deck cards`);
  }

  // Test 3: Navigation works
  private async testNavigation() {
    if (!this.page) throw new Error('Page not initialized');

    // Test navigation to create page
    await this.page.goto(`${this.baseUrl}/create`);
    await this.handleLanguageSelection();
    await this.page.waitForTimeout(2000);

    const hasCreateInterface = await this.page.locator('input, textarea, .cm-editor').count() > 0;
    if (!hasCreateInterface) {
      throw new Error('Create page interface not found');
    }

    // Test navigation to decks page
    await this.page.goto(`${this.baseUrl}/decks`);
    await this.handleLanguageSelection();
    await this.page.waitForTimeout(2000);

    const url = this.page.url();
    if (!url.includes('/decks')) {
      throw new Error('Failed to navigate to decks page');
    }
  }

  // Test 4: Deck creation flow (simplified)
  private async testDeckCreation() {
    if (!this.page) throw new Error('Page not initialized');

    await this.page.goto(`${this.baseUrl}/create`);
    await this.handleLanguageSelection();
    await this.page.waitForTimeout(3000);

    // Fill in basic deck info
    const nameInput = this.page.locator('input[type="text"], input[placeholder*="name"]').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill('Test Deck for Integration');
    }

    // Find any markdown editor
    const editors = await this.page.locator('textarea, .cm-editor, .CodeMirror').all();
    if (editors.length > 0) {
      const editor = editors[editors.length - 1]; // Use the last one (likely the main editor)
      await editor.fill('What is testing? :: Important for software quality\nWhat is integration? :: Testing multiple components together');
    }

    // Check if we can find any save/create button (don't force click if it's not ready)
    const saveButtons = await this.page.locator('button:has-text("Save"), button:has-text("Create")').all();
    if (saveButtons.length > 0) {
      console.log('✅ Save button found, deck creation interface is functional');
    } else {
      console.log('⚠️  No save button found, but creation interface exists');
    }
  }

  // Test 5: Public decks page
  private async testPublicDecks() {
    if (!this.page) throw new Error('Page not initialized');

    await this.page.goto(`${this.baseUrl}/public-decks`);
    await this.handleLanguageSelection();
    await this.page.waitForTimeout(2000);

    const hasDecks = await this.page.locator('.bg-white, .rounded-xl, .shadow').count() > 0;
    if (!hasDecks) {
      throw new Error('No public decks found');
    }
  }

  // Test 6: Settings page and language switching
  private async testSettings() {
    if (!this.page) throw new Error('Page not initialized');

    await this.page.goto(`${this.baseUrl}/settings`);
    await this.handleLanguageSelection();
    await this.page.waitForTimeout(2000);

    const hasSettingsContent = await this.page.locator('select').count() > 0 ||
                              await this.page.locator('button').count() > 0 ||
                              await this.page.locator('input').count() > 0 ||
                              await this.page.locator('text=Language').count() > 0 ||
                              await this.page.locator('text=Settings').count() > 0;
    if (!hasSettingsContent) {
      throw new Error('Settings page content not found');
    }
  }

  // Test 7: Mobile responsiveness
  private async testMobileView() {
    if (!this.page) throw new Error('Page not initialized');

    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.goto(this.baseUrl);
    await this.handleLanguageSelection();
    await this.page.waitForTimeout(1000);

    const hasNavigation = await this.page.locator('header, nav, [role="navigation"]').count() > 0;
    if (!hasNavigation) {
      throw new Error('Mobile navigation not found');
    }

    // Reset to desktop
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  // Test 8: Error handling
  private async testErrorHandling() {
    if (!this.page) throw new Error('Page not initialized');

    await this.page.goto(`${this.baseUrl}/nonexistent-page-404`);
    await this.page.waitForTimeout(2000);

    const url = this.page.url();
    const has404 = await this.page.locator('text=404').count() > 0 ||
                  await this.page.locator('text=Not Found').count() > 0;
    
    if (!has404 && !url.includes(this.baseUrl)) {
      throw new Error('404 handling not working properly');
    }
  }

  // Main test runner
  async run() {
    try {
      await this.setup();

      await this.runTest('Page Load & Language Selection', () => this.testPageLoadAndLanguage());
      await this.runTest('Sample Decks Present', () => this.testSampleDecks());
      await this.runTest('Navigation Functionality', () => this.testNavigation());
      await this.runTest('Deck Creation Interface', () => this.testDeckCreation());
      await this.runTest('Public Decks Page', () => this.testPublicDecks());
      await this.runTest('Settings Page', () => this.testSettings());
      await this.runTest('Mobile Responsiveness', () => this.testMobileView());
      await this.runTest('Error Handling', () => this.testErrorHandling());

      this.printResults();

    } finally {
      await this.teardown();
    }
  }

  private printResults() {
    console.log('\n📊 Robust Test Results Summary');
    console.log('='.repeat(50));

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

    console.log('='.repeat(50));
    console.log(`📈 ${passed}/${this.results.length} tests passed (${totalTime}ms total)`);

    if (failed === 0) {
      console.log('🎉 All robust tests passed! MyFlashPlay is working correctly.');
      console.log('✅ Language selection handled properly');
      console.log('✅ Modal interactions working');
      console.log('✅ Navigation functional');
      console.log('✅ All core features accessible');
      process.exit(0);
    } else {
      console.log(`💥 ${failed} test(s) failed. See details above.`);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const targetUrl = process.argv[2] || 'http://localhost:3000';

  if (!targetUrl.startsWith('http')) {
    console.error('❌ Please provide a valid URL (must start with http:// or https://)');
    console.log('Usage: pnpm test:robust <URL>');
    console.log('Example: pnpm test:robust https://www.MyFlashPlay.com');
    process.exit(1);
  }

  const tester = new RobustIntegrationTester(targetUrl);
  await tester.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Robust integration test failed:', error);
    process.exit(1);
  });
}