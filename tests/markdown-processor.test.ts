#!/usr/bin/env ts-node

import { markdownProcessor } from '../src/utils/markdown';
import { sampleMarkdownDecks } from '../src/data/sample-decks';

// Test configuration
const VERBOSE = process.env.VERBOSE === 'true';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.cyan);
  console.log('='.repeat(60));
}

function logTest(name: string, passed: boolean, details?: string) {
  const status = passed ? '✓' : '✗';
  const color = passed ? colors.green : colors.red;
  log(`${status} ${name}`, color);
  if (details && (VERBOSE || !passed)) {
    console.log(`  ${details}`);
  }
}

// Test cases
async function runTests() {
  logSection('MyFlashPlay Markdown Processor Test Suite');
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Test 1: Simple Q&A format
  logSection('Test 1: Simple Question & Answer');
  {
    const markdown = `
What is 2 + 2? :: 4
Capital of France? :: Paris
The sun is a star :: true
Fish can fly :: false
    `.trim();
    
    const result = markdownProcessor.parse(markdown);
    
    totalTests++;
    const passed = result.cards.length === 4 && result.errors.length === 0;
    if (passed) passedTests++;
    
    logTest('Parse simple Q&A', passed, 
      `Found ${result.cards.length} cards, ${result.errors.length} errors`);
    
    if (VERBOSE) {
      result.cards.forEach((card, i) => {
        console.log(`  Card ${i + 1}: ${card.type} - "${card.front}" → "${card.back}"`);
      });
    }
  }
  
  // Test 2: Multiple choice format
  logSection('Test 2: Multiple Choice Questions');
  {
    const markdown = `
What is the largest planet?
- Earth
- Jupiter
- Mars
- Venus
> Jupiter

Which number is bigger?
- 5
- 10
- 3
- 7
> 10
    `.trim();
    
    const result = markdownProcessor.parse(markdown);
    
    totalTests++;
    const passed = result.cards.length === 2 && 
                   result.cards.every(c => c.type === 'multiple-choice');
    if (passed) passedTests++;
    
    logTest('Parse multiple choice', passed,
      `Found ${result.cards.length} cards, all multiple-choice: ${result.cards.every(c => c.type === 'multiple-choice')}`);
    
    if (VERBOSE) {
      result.cards.forEach((card, i) => {
        console.log(`  Card ${i + 1}: ${card.options?.length} options, correct: "${card.back}"`);
      });
    }
  }
  
  // Test 3: Categories and subcategories
  logSection('Test 3: Categories and Organization');
  {
    const markdown = `
# Math

## Addition

2 + 2 :: 4
3 + 5 :: 8

## Subtraction

10 - 5 :: 5
8 - 3 :: 5

# Science

The sun is a star :: true
Water freezes at 0°C :: true
    `.trim();
    
    const result = markdownProcessor.parse(markdown);
    
    totalTests++;
    const mathCards = result.cards.filter(c => c.category === 'Math');
    const scienceCards = result.cards.filter(c => c.category === 'Science');
    const passed = mathCards.length === 4 && scienceCards.length === 2;
    if (passed) passedTests++;
    
    logTest('Parse with categories', passed,
      `Math: ${mathCards.length} cards, Science: ${scienceCards.length} cards`);
  }
  
  // Test 4: Vietnamese sample decks
  logSection('Test 4: Vietnamese Language Support');
  {
    for (const sampleDeck of sampleMarkdownDecks.filter(d => d.id.includes('vietnamese'))) {
      const result = markdownProcessor.parse(sampleDeck.markdown);
      
      totalTests++;
      const passed = result.cards.length > 0 && result.errors.length === 0;
      if (passed) passedTests++;
      
      logTest(`Parse ${sampleDeck.name}`, passed,
        `Found ${result.cards.length} cards, ${result.errors.length} errors`);
      
      if (VERBOSE && result.cards.length > 0) {
        console.log(`  First card: "${result.cards[0].front}" → "${result.cards[0].back}"`);
        console.log(`  Card types: ${result.stats.cardsByType}`);
      }
    }
  }
  
  // Test 5: Metadata and comments
  logSection('Test 5: Metadata and Comments');
  {
    const markdown = `
What is 2 + 2? :: 4
<!-- Hint: Basic addition -->
<!-- Explanation: Two plus two equals four -->
<!-- Difficulty: easy -->
<!-- Tags: math, addition -->
    `.trim();
    
    const result = markdownProcessor.parse(markdown);
    
    totalTests++;
    const card = result.cards[0];
    const hasMetadata = card?.metadata.hint && card?.metadata.explanation;
    const passed = result.cards.length === 1 && hasMetadata;
    if (passed) passedTests++;
    
    logTest('Parse metadata', passed,
      hasMetadata ? 'Metadata found' : 'Metadata missing');
    
    if (VERBOSE && card) {
      console.log(`  Hint: ${card.metadata.hint}`);
      console.log(`  Explanation: ${card.metadata.explanation}`);
      console.log(`  Difficulty: ${card.metadata.difficulty}`);
      console.log(`  Tags: ${card.metadata.tags?.join(', ')}`);
    }
  }
  
  // Test 6: Error handling
  logSection('Test 6: Error Handling');
  {
    const invalidMarkdown = `
Question without answer ::
:: Answer without question
Multiple choice without options
Multiple choice without correct
- Option 1
- Option 2
    `.trim();
    
    const result = markdownProcessor.parse(invalidMarkdown);
    
    totalTests++;
    const passed = result.errors.length > 0 || result.warnings.length > 0;
    if (passed) passedTests++;
    
    logTest('Detect invalid formats', passed,
      `${result.errors.length} errors, ${result.warnings.length} warnings`);
    
    if (VERBOSE) {
      result.errors.forEach(err => {
        console.log(`  Error: Line ${err.line} - ${err.message}`);
      });
    }
  }
  
  // Test 7: Export functionality
  logSection('Test 7: Export Functionality');
  {
    const cards = markdownProcessor.parse(`
What is 2 + 2? :: 4
Capital of France? :: Paris
    `.trim()).cards;
    
    const exported = markdownProcessor.export(cards);
    const reImported = markdownProcessor.parse(exported);
    
    totalTests++;
    const passed = reImported.cards.length === cards.length;
    if (passed) passedTests++;
    
    logTest('Export and re-import', passed,
      `Original: ${cards.length} cards, Re-imported: ${reImported.cards.length} cards`);
  }
  
  // Test 8: Performance test
  logSection('Test 8: Performance Test');
  {
    // Generate large markdown
    const lines: string[] = [];
    for (let i = 1; i <= 1000; i++) {
      lines.push(`Question ${i} :: Answer ${i}`);
    }
    const largeMarkdown = lines.join('\n');
    
    const startTime = performance.now();
    const result = markdownProcessor.parse(largeMarkdown);
    const endTime = performance.now();
    
    totalTests++;
    const parseTime = endTime - startTime;
    const passed = result.cards.length === 1000 && parseTime < 1000; // Should parse in under 1 second
    if (passed) passedTests++;
    
    logTest('Parse 1000 cards performance', passed,
      `Parsed in ${parseTime.toFixed(2)}ms (${(parseTime / 1000).toFixed(2)}ms per card)`);
  }
  
  // Test 9: All sample decks
  logSection('Test 9: All Sample Decks');
  {
    for (const sampleDeck of sampleMarkdownDecks) {
      const result = markdownProcessor.parse(sampleDeck.markdown);
      
      totalTests++;
      const passed = result.cards.length > 0 && result.errors.length === 0;
      if (passed) passedTests++;
      
      logTest(`${sampleDeck.name}`, passed,
        `${result.cards.length} cards, ${result.errors.length} errors`);
    }
  }
  
  // Summary
  logSection('Test Summary');
  const allPassed = passedTests === totalTests;
  const summaryColor = allPassed ? colors.green : colors.red;
  
  log(`Total Tests: ${totalTests}`, colors.blue);
  log(`Passed: ${passedTests}`, colors.green);
  log(`Failed: ${totalTests - passedTests}`, colors.red);
  log(`\nResult: ${allPassed ? 'ALL TESTS PASSED! 🎉' : 'SOME TESTS FAILED ❌'}`, summaryColor);
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    log(`\nTest suite error: ${error}`, colors.red);
    process.exit(1);
  });
}