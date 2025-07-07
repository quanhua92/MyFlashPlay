#!/usr/bin/env node

/**
 * Translation Validation Script
 * 
 * This script validates that all translation files have the same keys
 * as the English baseline and reports any missing or extra keys.
 * 
 * Usage: node scripts/validate-translations.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');
const ENGLISH_FILE = path.join(LOCALES_DIR, 'en.ts');

// Helper function to get nested object paths
function getObjectPaths(obj, prefix = '') {
  const paths = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      paths.push(...getObjectPaths(value, currentPath));
    } else {
      paths.push(currentPath);
    }
  }
  
  return paths;
}

// Dynamic import for ES modules (Node.js compatibility)
async function validateTranslations() {
  try {
    console.log('🔍 Validating translation files...\n');

    // Get all translation files
    const files = fs.readdirSync(LOCALES_DIR)
      .filter(file => file.endsWith('.ts') && file !== 'en.ts')
      .map(file => path.join(LOCALES_DIR, file));

    if (files.length === 0) {
      console.log('ℹ️  No translation files found to validate.');
      return;
    }

    // Load English baseline
    const englishModule = await import(ENGLISH_FILE);
    const englishTranslations = englishModule.default;
    const englishKeys = getObjectPaths(englishTranslations).sort();

    console.log(`📋 English baseline has ${englishKeys.length} translation keys`);
    console.log(`🌍 Validating ${files.length} translation files...\n`);

    let allValid = true;

    for (const file of files) {
      const fileName = path.basename(file, '.ts');
      
      try {
        const module = await import(file);
        const translations = module.default;
        const keys = getObjectPaths(translations).sort();

        const missingKeys = englishKeys.filter(key => !keys.includes(key));
        const extraKeys = keys.filter(key => !englishKeys.includes(key));

        if (missingKeys.length === 0 && extraKeys.length === 0) {
          console.log(`✅ ${fileName}: All ${keys.length} keys present`);
        } else {
          allValid = false;
          console.log(`❌ ${fileName}: Issues found`);
          
          if (missingKeys.length > 0) {
            console.log(`   Missing keys (${missingKeys.length}):`);
            missingKeys.forEach(key => console.log(`     - ${key}`));
          }
          
          if (extraKeys.length > 0) {
            console.log(`   Extra keys (${extraKeys.length}):`);
            extraKeys.forEach(key => console.log(`     + ${key}`));
          }
        }
      } catch (error) {
        allValid = false;
        console.log(`❌ ${fileName}: Error loading file - ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    
    if (allValid) {
      console.log('🎉 All translation files are valid!');
      process.exit(0);
    } else {
      console.log('⚠️  Some translation files have issues. Please fix them before proceeding.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

validateTranslations();