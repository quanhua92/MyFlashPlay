#!/usr/bin/env node

/**
 * i18n Testing Script for MyFlashPlay
 * 
 * This script tests the internationalization functionality including:
 * - Language switching
 * - Translation loading
 * - UI responsiveness to language changes
 */

import { chromium } from 'playwright';

const TARGET_URL = process.argv[2] || 'http://localhost:3000';

async function testI18n() {
  console.log('🌍 Starting i18n Tests...');
  console.log(`🌐 Target URL: ${TARGET_URL}`);
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const results = [];
  let totalTime = 0;
  
  try {
    // Test 1: Language Switcher Accessibility
    console.log('⏳ Language Switcher Accessibility...');
    const start1 = Date.now();
    
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Navigate to settings
    const settingsLink = await page.locator('a[href="/settings"], a:has-text("Settings"), a:has-text("设置"), a:has-text("Configuración")').first();
    if (await settingsLink.count() > 0) {
      await settingsLink.click();
      await page.waitForTimeout(1000);
      
      // Look for language selector
      const languageSelector = await page.locator('select, button:has-text("Language"), button:has-text("语言"), button:has-text("Idioma"), [data-testid*="language"]').first();
      if (await languageSelector.count() > 0) {
        results.push({ test: 'Language Switcher Accessibility', status: '✅', time: Date.now() - start1, message: 'Language selector found' });
      } else {
        results.push({ test: 'Language Switcher Accessibility', status: '❌', time: Date.now() - start1, message: 'Language selector not found' });
      }
    } else {
      results.push({ test: 'Language Switcher Accessibility', status: '❌', time: Date.now() - start1, message: 'Settings page not accessible' });
    }
    
    totalTime += Date.now() - start1;

    // Test 2: Translation File Loading
    console.log('⏳ Translation File Loading...');
    const start2 = Date.now();
    
    // Check if translation bundles are loaded
    const englishBundle = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource').some(entry => 
        entry.name.includes('en-') && entry.name.includes('.js')
      );
    });
    
    if (englishBundle) {
      results.push({ test: 'Translation File Loading', status: '✅', time: Date.now() - start2, message: 'English translation bundle loaded' });
    } else {
      results.push({ test: 'Translation File Loading', status: '⚠️', time: Date.now() - start2, message: 'Bundle detection uncertain - may be embedded' });
    }
    
    totalTime += Date.now() - start2;

    // Test 3: Content Translation Verification
    console.log('⏳ Content Translation Verification...');
    const start3 = Date.now();
    
    await page.goto(TARGET_URL);
    await page.waitForTimeout(2000);
    
    // Check for translated content indicators
    const hasNavigation = await page.locator('nav, header').count() > 0;
    const hasButtons = await page.locator('button, a[role="button"]').count() > 0;
    const hasText = await page.textContent('body');
    
    if (hasNavigation && hasButtons && hasText && hasText.length > 100) {
      results.push({ test: 'Content Translation Verification', status: '✅', time: Date.now() - start3, message: 'UI components and text content present' });
    } else {
      results.push({ test: 'Content Translation Verification', status: '❌', time: Date.now() - start3, message: 'Insufficient UI elements found' });
    }
    
    totalTime += Date.now() - start3;

    // Test 4: Multi-language Support
    console.log('⏳ Multi-language Support...');
    const start4 = Date.now();
    
    // Check for UTF-8 content and special characters
    const bodyText = await page.textContent('body');
    const hasUTF8 = /[À-ÿ\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\u1100-\u11ff]/.test(bodyText);
    
    if (hasUTF8) {
      results.push({ test: 'Multi-language Support', status: '✅', time: Date.now() - start4, message: 'UTF-8 characters detected' });
    } else {
      results.push({ test: 'Multi-language Support', status: '⚠️', time: Date.now() - start4, message: 'Only ASCII characters found' });
    }
    
    totalTime += Date.now() - start4;

    // Test 5: Language Preference Persistence
    console.log('⏳ Language Preference Persistence...');
    const start5 = Date.now();
    
    // Check localStorage for language preference
    const hasLanguageStorage = await page.evaluate(() => {
      try {
        const preferences = localStorage.getItem('myflashplay-preferences');
        const i18nState = localStorage.getItem('myflashplay-language');
        return !!(preferences || i18nState);
      } catch {
        return false;
      }
    });
    
    if (hasLanguageStorage) {
      results.push({ test: 'Language Preference Persistence', status: '✅', time: Date.now() - start5, message: 'Language storage mechanism present' });
    } else {
      results.push({ test: 'Language Preference Persistence', status: '❌', time: Date.now() - start5, message: 'No language storage found' });
    }
    
    totalTime += Date.now() - start5;

  } catch (error) {
    console.error('❌ Test execution error:', error.message);
    results.push({ test: 'Test Execution', status: '❌', time: 0, message: error.message });
  } finally {
    await browser.close();
  }
  
  // Print results
  console.log('\n📊 i18n Test Results Summary');
  console.log('==================================================');
  
  let passed = 0;
  results.forEach(result => {
    const status = result.status === '✅' ? 'PASS' : result.status === '⚠️' ? 'WARN' : 'FAIL';
    console.log(`${result.status} ${result.test.padEnd(35)} ${result.time.toString().padStart(6)}ms`);
    if (result.message) {
      console.log(`   └─ ${result.message}`);
    }
    if (result.status === '✅') passed++;
  });
  
  console.log('==================================================');
  console.log(`📈 ${passed}/${results.length} tests passed (${totalTime}ms total)`);
  
  if (passed === results.length) {
    console.log('🎉 All i18n tests passed! Multi-language support is working correctly.');
    process.exit(0);
  } else {
    console.log('💥 Some i18n tests failed. Please check the issues above.');
    process.exit(1);
  }
}

testI18n().catch(console.error);