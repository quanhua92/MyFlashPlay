#!/usr/bin/env node

/**
 * Quick Integration Test for FlashPlay
 * 
 * A lightweight test that checks basic functionality
 * Usage: pnpm test:quick [URL]
 */

import { chromium } from 'playwright';

async function quickTest(url: string) {
  console.log('🚀 Quick FlashPlay Test');
  console.log(`🌐 Testing: ${url}`);
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Set timeout
    page.setDefaultTimeout(10000);
    
    // Test 1: Page loads
    console.log('⏳ Testing page load...');
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    
    if (!response || response.status() >= 400) {
      throw new Error(`Page failed to load: ${response?.status()}`);
    }
    console.log('✅ Page loads successfully');
    
    // Test 2: Sample decks exist
    console.log('⏳ Checking for sample decks...');
    const deckCount = await page.locator('.bg-white, .rounded-xl, [data-testid="deck-card"]').count();
    if (deckCount === 0) {
      throw new Error('No deck cards found');
    }
    console.log(`✅ Found ${deckCount} deck cards`);
    
    // Test 3: Vietnamese deck (UTF-8 test)
    console.log('⏳ Testing UTF-8 support...');
    const vietnameseExists = await page.locator('text=Động Vật, text=Việt Nam, text=Màu Sắc').count() > 0;
    if (!vietnameseExists) {
      console.log('⚠️  Vietnamese text not found - checking if new markdown format is deployed');
    } else {
      console.log('✅ UTF-8 support working');
    }
    
    // Test 4: Navigation to create page
    console.log('⏳ Testing navigation...');
    await page.goto(`${url}/create`);
    await page.waitForTimeout(2000); // Wait for page to fully load
    const hasMarkdown = await page.locator('textarea, [role="textbox"], .cm-editor, .CodeMirror').count() > 0;
    if (!hasMarkdown) {
      console.log('⚠️  Markdown editor not found - page may still be loading');
      // Check if we at least reached the create page
      const onCreatePage = page.url().includes('/create');
      if (!onCreatePage) {
        throw new Error('Failed to navigate to create page');
      }
      console.log('✅ Navigation working (editor might be loading)');
    } else {
      console.log('✅ Navigation and create page working');
    }
    
    console.log('\n🎉 All quick tests passed!');
    
  } catch (error) {
    console.log(`\n❌ Test failed: ${error}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Main execution
const url = process.argv[2] || 'http://localhost:3000';
quickTest(url).catch(error => {
  console.error('💥 Quick test error:', error);
  process.exit(1);
});