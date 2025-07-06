#!/usr/bin/env tsx

/**
 * Comprehensive Markdown Testing Suite
 * This is a first-class citizen test that MUST pass before any build
 */

import { MarkdownParserV2 } from '../src/utils/markdown-parser-v2';
import { sampleMarkdownDecks } from '../src/data/sample-decks';
import { MarkdownValidator } from '../src/utils/markdown/validator';
import { MarkdownProcessor } from '../src/utils/markdown/processor';
import type { ValidationRule } from '../src/utils/markdown/types';
import type { Flashcard } from '../src/types/flashcard.types';

// Test configuration
const VERBOSE = process.env.VERBOSE === 'true';

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  details?: any;
}

class MarkdownTestSuite {
  private parser: MarkdownParserV2;
  private validator: MarkdownValidator;
  private processor: MarkdownProcessor;
  private results: TestResult[] = [];
  
  constructor() {
    this.parser = new MarkdownParserV2();
    this.validator = new MarkdownValidator();
    this.processor = new MarkdownProcessor();
  }
  
  log(message: string, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }
  
  logSection(title: string) {
    console.log('\n' + '═'.repeat(60));
    this.log(title, colors.cyan);
    console.log('═'.repeat(60));
  }
  
  addResult(name: string, passed: boolean, message?: string, details?: any) {
    this.results.push({ name, passed, message, details });
    
    const icon = passed ? '✓' : '✗';
    const color = passed ? colors.green : colors.red;
    
    this.log(`${icon} ${name}`, color);
    if (message && (VERBOSE || !passed)) {
      this.log(`  ${message}`, colors.gray);
    }
    if (details && VERBOSE) {
      console.log('  Details:', details);
    }
  }
  
  // Test 1: Basic Markdown Formats
  testBasicFormats() {
    this.logSection('Test 1: Basic Markdown Formats');
    
    const tests = [
      {
        name: 'Simple Q&A',
        markdown: 'What is 2 + 2? :: 4',
        expected: { count: 1, type: 'simple' }
      },
      {
        name: 'True/False',
        markdown: 'The sky is blue :: true',
        expected: { count: 1, type: 'true-false' }
      },
      {
        name: 'Multiple lines',
        markdown: `Question 1 :: Answer 1
Question 2 :: Answer 2
Question 3 :: Answer 3`,
        expected: { count: 3, type: 'simple' }
      }
    ];
    
    for (const test of tests) {
      try {
        const cards = this.parser.parse(test.markdown);
        const passed = cards.length === test.expected.count && 
                      cards[0]?.type === test.expected.type;
        
        this.addResult(
          test.name,
          passed,
          `Expected ${test.expected.count} ${test.expected.type} cards, got ${cards.length}`,
          VERBOSE ? cards : undefined
        );
      } catch (error: any) {
        this.addResult(test.name, false, error.message);
      }
    }
  }
  
  // Test 2: Multiple Choice
  testMultipleChoice() {
    this.logSection('Test 2: Multiple Choice Questions');
    
    const markdown = `
What is 3 × 4?
- 10
- 11
- 12
- 13
> 12

Which planet is largest?
- Earth
- Mars
- Jupiter
- Venus
> Jupiter
    `.trim();
    
    try {
      const cards = this.parser.parse(markdown);
      
      this.addResult(
        'Multiple choice count',
        cards.length === 2,
        `Found ${cards.length} cards`
      );
      
      this.addResult(
        'Multiple choice type',
        cards.every(c => c.type === 'multiple-choice'),
        'All cards should be multiple-choice'
      );
      
      this.addResult(
        'Multiple choice options',
        cards[0]?.options?.length === 4,
        `First card has ${cards[0]?.options?.length} options`
      );
      
      this.addResult(
        'Correct answer marked',
        cards[0]?.options?.some(o => o.isCorrect),
        'Should have one correct answer'
      );
    } catch (error: any) {
      this.addResult('Multiple choice parsing', false, error.message);
    }
  }
  
  // Test 3: Categories and Organization
  testCategories() {
    this.logSection('Test 3: Categories and Organization');
    
    const markdown = `
# Math

## Addition
2 + 2 :: 4
3 + 5 :: 8

## Subtraction
10 - 5 :: 5
8 - 3 :: 5

# Science
Water is H2O :: true
    `.trim();
    
    try {
      const cards = this.parser.parse(markdown);
      
      const mathCards = cards.filter(c => c.category === 'Math');
      const scienceCards = cards.filter(c => c.category === 'Science');
      const additionCards = cards.filter(c => c.subcategory === 'Addition');
      
      this.addResult(
        'Category parsing',
        mathCards.length === 4 && scienceCards.length === 1,
        `Math: ${mathCards.length}, Science: ${scienceCards.length}`
      );
      
      this.addResult(
        'Subcategory parsing',
        additionCards.length === 2,
        `Addition subcategory: ${additionCards.length} cards`
      );
    } catch (error: any) {
      this.addResult('Category parsing', false, error.message);
    }
  }
  
  // Test 4: UTF-8 and International Characters
  testUTF8() {
    this.logSection('Test 4: UTF-8 and International Characters');
    
    const languages = [
      {
        name: 'Vietnamese',
        markdown: 'Xin chào thế giới :: Hello world',
        check: (text: string) => /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i.test(text)
      },
      {
        name: 'Chinese',
        markdown: '你好世界 :: Hello world',
        check: (text: string) => /[\u4e00-\u9fff]/.test(text)
      },
      {
        name: 'Arabic',
        markdown: 'مرحبا بالعالم :: Hello world',
        check: (text: string) => /[\u0600-\u06ff]/.test(text)
      },
      {
        name: 'Emoji',
        markdown: 'What is this? 🎉 :: Party popper',
        check: (text: string) => /[\u{1F300}-\u{1F9FF}]/u.test(text)
      }
    ];
    
    for (const lang of languages) {
      try {
        const cards = this.parser.parse(lang.markdown);
        const hasSpecialChars = cards.length > 0 && lang.check(cards[0].front);
        
        this.addResult(
          `${lang.name} support`,
          hasSpecialChars,
          hasSpecialChars ? 'Characters preserved' : 'Characters lost'
        );
      } catch (error: any) {
        this.addResult(`${lang.name} support`, false, error.message);
      }
    }
  }
  
  // Test 5: Sample Decks
  testSampleDecks() {
    this.logSection('Test 5: All Sample Decks');
    
    let totalCards = 0;
    let totalErrors = 0;
    
    for (const deck of sampleMarkdownDecks) {
      try {
        const cards = this.parser.parse(deck.markdown);
        totalCards += cards.length;
        
        const passed = cards.length > 0;
        this.addResult(
          deck.name,
          passed,
          `${cards.length} cards parsed`,
          VERBOSE ? { 
            types: this.countTypes(cards),
            firstCard: cards[0] 
          } : undefined
        );
        
        // Special check for Vietnamese decks
        if (deck.id.includes('vietnamese')) {
          const hasVietnamese = cards.some(card => 
            /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i.test(card.front + card.back)
          );
          
          this.addResult(
            `${deck.name} - Vietnamese content`,
            hasVietnamese,
            hasVietnamese ? 'Vietnamese characters found' : 'No Vietnamese characters'
          );
        }
      } catch (error: any) {
        totalErrors++;
        this.addResult(deck.name, false, error.message);
      }
    }
    
    this.log(`\nTotal cards parsed: ${totalCards}`, colors.blue);
    this.log(`Total errors: ${totalErrors}`, totalErrors > 0 ? colors.red : colors.green);
  }
  
  // Test 6: Edge Cases
  testEdgeCases() {
    this.logSection('Test 6: Edge Cases and Error Handling');
    
    const edgeCases = [
      {
        name: 'Empty markdown',
        markdown: '',
        shouldPass: true,
        expectedCards: 0
      },
      {
        name: 'Only whitespace',
        markdown: '   \n\n   \t\t   ',
        shouldPass: true,
        expectedCards: 0
      },
      {
        name: 'Question without answer',
        markdown: 'What is 2 + 2? ::',
        shouldPass: true,
        expectedCards: 1
      },
      {
        name: 'Answer without question',
        markdown: ':: 42',
        shouldPass: true,
        expectedCards: 1
      },
      {
        name: 'Multiple :: separators',
        markdown: 'A :: B :: C',
        shouldPass: true,
        expectedCards: 1
      },
      {
        name: 'Very long content',
        markdown: 'A'.repeat(1000) + ' :: ' + 'B'.repeat(1000),
        shouldPass: true,
        expectedCards: 1
      }
    ];
    
    for (const testCase of edgeCases) {
      try {
        const cards = this.parser.parse(testCase.markdown);
        const passed = cards.length === testCase.expectedCards;
        
        this.addResult(
          testCase.name,
          passed,
          `Expected ${testCase.expectedCards} cards, got ${cards.length}`
        );
      } catch (error: any) {
        this.addResult(
          testCase.name,
          !testCase.shouldPass,
          error.message
        );
      }
    }
  }
  
  // Test 7: Metadata and Comments
  testMetadata() {
    this.logSection('Test 7: Metadata and Comments');
    
    const markdown = `
What is 2 + 2? :: 4
<!-- Hint: Basic addition -->
<!-- Explanation: Two plus two equals four -->
<!-- Difficulty: easy -->
<!-- Tags: math, addition, basic -->

Capital of France? :: Paris
<!-- Difficulty: medium -->
    `.trim();
    
    try {
      const cards = this.parser.parse(markdown);
      
      this.addResult(
        'Metadata parsing',
        cards.length === 2,
        `Found ${cards.length} cards with metadata`
      );
      
      const firstCard = cards[0];
      this.addResult(
        'Hint metadata',
        firstCard?.metadata?.hint === 'Basic addition',
        firstCard?.metadata?.hint || 'No hint found'
      );
      
      this.addResult(
        'Explanation metadata',
        firstCard?.metadata?.explanation === 'Two plus two equals four',
        firstCard?.metadata?.explanation || 'No explanation found'
      );
      
      this.addResult(
        'Difficulty metadata',
        firstCard?.metadata?.difficulty === 'easy',
        firstCard?.metadata?.difficulty || 'No difficulty found'
      );
      
      this.addResult(
        'Tags metadata',
        firstCard?.metadata?.tags?.length === 3,
        `Found ${firstCard?.metadata?.tags?.length || 0} tags`
      );
    } catch (error: any) {
      this.addResult('Metadata parsing', false, error.message);
    }
  }
  
  // Test 8: Performance
  testPerformance() {
    this.logSection('Test 8: Performance Testing');
    
    const sizes = [10, 100, 1000];
    
    for (const size of sizes) {
      const lines: string[] = [];
      for (let i = 0; i < size; i++) {
        lines.push(`Question ${i} :: Answer ${i}`);
      }
      const markdown = lines.join('\n');
      
      try {
        const start = performance.now();
        const cards = this.parser.parse(markdown);
        const duration = performance.now() - start;
        
        const passed = cards.length === size && duration < size * 2; // Max 2ms per card
        
        this.addResult(
          `Parse ${size} cards`,
          passed,
          `Completed in ${duration.toFixed(2)}ms (${(duration/size).toFixed(2)}ms per card)`
        );
      } catch (error: any) {
        this.addResult(`Parse ${size} cards`, false, error.message);
      }
    }
  }
  
  // Test 9: Validator - Basic Validation
  testValidatorBasic() {
    this.logSection('Test 9: Validator - Basic Validation');
    
    const testCases = [
      {
        name: 'Valid simple card',
        card: { 
          id: '1', 
          type: 'simple' as const, 
          front: 'What is 2+2?', 
          back: '4',
          metadata: {} 
        },
        expectValid: true
      },
      {
        name: 'Empty front',
        card: { 
          id: '2', 
          type: 'simple' as const, 
          front: '', 
          back: '4',
          metadata: {} 
        },
        expectValid: false,
        expectedError: 'Question/front cannot be empty'
      },
      {
        name: 'Empty back',
        card: { 
          id: '3', 
          type: 'simple' as const, 
          front: 'Question?', 
          back: '',
          metadata: {} 
        },
        expectValid: false,
        expectedError: 'Answer/back cannot be empty'
      },
      {
        name: 'Whitespace only content',
        card: { 
          id: '4', 
          type: 'simple' as const, 
          front: '   \t\n   ', 
          back: '   ',
          metadata: {} 
        },
        expectValid: false
      }
    ];
    
    for (const test of testCases) {
      const result = this.validator.validateCard(test.card as Flashcard);
      const passed = result.valid === test.expectValid;
      
      this.addResult(
        test.name,
        passed,
        test.expectValid 
          ? (result.valid ? 'Valid as expected' : `Expected valid but got errors: ${result.errors?.join(', ')}`)
          : (result.valid ? 'Expected errors but got valid' : `Errors: ${result.errors?.join(', ')}`),
        VERBOSE ? result : undefined
      );
      
      if (test.expectedError && result.errors) {
        const hasExpectedError = result.errors.some(e => e.includes(test.expectedError!));
        this.addResult(
          `${test.name} - error message`,
          hasExpectedError,
          hasExpectedError ? 'Expected error found' : `Expected "${test.expectedError}" but got "${result.errors.join(', ')}"`
        );
      }
    }
  }
  
  // Test 10: Validator - True/False Cards
  testValidatorTrueFalse() {
    this.logSection('Test 10: Validator - True/False Cards');
    
    const testCases = [
      {
        name: 'Valid true answer',
        card: { 
          id: '1', 
          type: 'true-false' as const, 
          front: 'The sky is blue', 
          back: 'true',
          metadata: {} 
        },
        expectValid: true
      },
      {
        name: 'Valid false answer',
        card: { 
          id: '2', 
          type: 'true-false' as const, 
          front: 'Fish can fly', 
          back: 'false',
          metadata: {} 
        },
        expectValid: true
      },
      {
        name: 'Valid uppercase TRUE',
        card: { 
          id: '3', 
          type: 'true-false' as const, 
          front: 'Water is wet', 
          back: 'TRUE',
          metadata: {} 
        },
        expectValid: true
      },
      {
        name: 'Invalid yes/no answer',
        card: { 
          id: '4', 
          type: 'true-false' as const, 
          front: 'Is this valid?', 
          back: 'yes',
          metadata: {} 
        },
        expectValid: false,
        expectedError: 'True/false answer must be either "true" or "false"'
      },
      {
        name: 'Invalid numeric answer',
        card: { 
          id: '5', 
          type: 'true-false' as const, 
          front: 'Is this valid?', 
          back: '1',
          metadata: {} 
        },
        expectValid: false
      }
    ];
    
    for (const test of testCases) {
      const result = this.validator.validateCard(test.card as Flashcard);
      const passed = result.valid === test.expectValid;
      
      this.addResult(
        test.name,
        passed,
        result.errors?.join(', ') || (result.valid ? 'Valid' : 'Invalid'),
        VERBOSE ? result : undefined
      );
    }
  }
  
  // Test 11: Validator - Multiple Choice
  testValidatorMultipleChoice() {
    this.logSection('Test 11: Validator - Multiple Choice');
    
    const testCases = [
      {
        name: 'Valid MC with 4 options',
        card: { 
          id: '1', 
          type: 'multiple-choice' as const, 
          front: 'What is 2+2?', 
          back: '4',
          options: [
            { text: '3', isCorrect: false },
            { text: '4', isCorrect: true },
            { text: '5', isCorrect: false },
            { text: '6', isCorrect: false }
          ],
          metadata: {} 
        },
        expectValid: true
      },
      {
        name: 'MC with only 1 option',
        card: { 
          id: '2', 
          type: 'multiple-choice' as const, 
          front: 'What is 2+2?', 
          back: '4',
          options: [
            { text: '4', isCorrect: true }
          ],
          metadata: {} 
        },
        expectValid: false,
        expectedError: 'Multiple choice must have at least 2 options'
      },
      {
        name: 'MC with no correct answer',
        card: { 
          id: '3', 
          type: 'multiple-choice' as const, 
          front: 'What is 2+2?', 
          back: '4',
          options: [
            { text: '3', isCorrect: false },
            { text: '5', isCorrect: false }
          ],
          metadata: {} 
        },
        expectValid: false,
        expectedError: 'Multiple choice must have at least one correct answer'
      },
      {
        name: 'MC with multiple correct answers',
        card: { 
          id: '4', 
          type: 'multiple-choice' as const, 
          front: 'Which are even?', 
          back: '2, 4',
          options: [
            { text: '1', isCorrect: false },
            { text: '2', isCorrect: true },
            { text: '3', isCorrect: false },
            { text: '4', isCorrect: true }
          ],
          metadata: {} 
        },
        expectValid: true,
        expectWarning: true,
        expectedWarning: 'Multiple choice has multiple correct answers'
      },
      {
        name: 'MC with 8 options (warning)',
        card: { 
          id: '5', 
          type: 'multiple-choice' as const, 
          front: 'Select one', 
          back: 'A',
          options: Array.from({ length: 8 }, (_, i) => ({
            text: String.fromCharCode(65 + i),
            isCorrect: i === 0
          })),
          metadata: {} 
        },
        expectValid: true,
        expectWarning: true,
        expectedWarning: 'more than 6 options'
      }
    ];
    
    for (const test of testCases) {
      const result = this.validator.validateCard(test.card as Flashcard);
      const passed = result.valid === test.expectValid;
      
      this.addResult(
        test.name,
        passed,
        `Valid: ${result.valid}, Errors: ${result.errors?.join(', ') || 'none'}, Warnings: ${result.warnings?.join(', ') || 'none'}`,
        VERBOSE ? result : undefined
      );
      
      if (test.expectWarning && test.expectedWarning) {
        const hasWarning = result.warnings?.some(w => w.includes(test.expectedWarning!)) || false;
        this.addResult(
          `${test.name} - warning check`,
          hasWarning,
          hasWarning ? 'Expected warning found' : 'Expected warning not found'
        );
      }
    }
  }
  
  // Test 12: Validator - Content Length
  testValidatorContentLength() {
    this.logSection('Test 12: Validator - Content Length');
    
    const testCases = [
      {
        name: 'Normal length content',
        card: { 
          id: '1', 
          type: 'simple' as const, 
          front: 'What is the capital of France?', 
          back: 'Paris',
          metadata: {} 
        },
        expectValid: true,
        expectWarning: false
      },
      {
        name: 'Very long question (>500 chars)',
        card: { 
          id: '2', 
          type: 'simple' as const, 
          front: 'A'.repeat(501), 
          back: 'Short answer',
          metadata: {} 
        },
        expectValid: true,
        expectWarning: true,
        expectedWarning: 'Question is very long'
      },
      {
        name: 'Very long answer (>1000 chars)',
        card: { 
          id: '3', 
          type: 'simple' as const, 
          front: 'Short question?', 
          back: 'B'.repeat(1001),
          metadata: {} 
        },
        expectValid: true,
        expectWarning: true,
        expectedWarning: 'Answer is very long'
      },
      {
        name: 'Both very long',
        card: { 
          id: '4', 
          type: 'simple' as const, 
          front: 'Q'.repeat(600), 
          back: 'A'.repeat(1100),
          metadata: {} 
        },
        expectValid: true,
        expectWarning: true,
        expectedWarnings: 2
      }
    ];
    
    for (const test of testCases) {
      const result = this.validator.validateCard(test.card as Flashcard);
      const passed = result.valid === test.expectValid;
      
      this.addResult(
        test.name,
        passed,
        `Valid: ${result.valid}, Warnings: ${result.warnings?.length || 0}`,
        VERBOSE ? result : undefined
      );
      
      if (test.expectWarning) {
        const hasWarnings = (result.warnings?.length || 0) > 0;
        this.addResult(
          `${test.name} - warnings present`,
          hasWarnings === test.expectWarning,
          hasWarnings ? `${result.warnings?.length} warnings found` : 'No warnings'
        );
      }
      
      if (test.expectedWarnings) {
        this.addResult(
          `${test.name} - warning count`,
          result.warnings?.length === test.expectedWarnings,
          `Expected ${test.expectedWarnings} warnings, got ${result.warnings?.length || 0}`
        );
      }
    }
  }
  
  // Test 13: Validator - Metadata Validation
  testValidatorMetadata() {
    this.logSection('Test 13: Validator - Metadata Validation');
    
    const testCases = [
      {
        name: 'Valid easy difficulty',
        card: { 
          id: '1', 
          type: 'simple' as const, 
          front: 'What is 1+1?', 
          back: '2',
          metadata: { difficulty: 'easy' }
        },
        expectValid: true
      },
      {
        name: 'Valid medium difficulty',
        card: { 
          id: '2', 
          type: 'simple' as const, 
          front: 'What is 15×7?', 
          back: '105',
          metadata: { difficulty: 'medium' }
        },
        expectValid: true
      },
      {
        name: 'Invalid difficulty',
        card: { 
          id: '3', 
          type: 'simple' as const, 
          front: 'Question?', 
          back: 'Answer',
          metadata: { difficulty: 'very-hard' }
        },
        expectValid: false,
        expectedError: 'Invalid difficulty: very-hard'
      },
      {
        name: 'No difficulty specified',
        card: { 
          id: '4', 
          type: 'simple' as const, 
          front: 'Question?', 
          back: 'Answer',
          metadata: {}
        },
        expectValid: true
      }
    ];
    
    for (const test of testCases) {
      const result = this.validator.validateCard(test.card as Flashcard);
      const passed = result.valid === test.expectValid;
      
      this.addResult(
        test.name,
        passed,
        result.errors?.join(', ') || 'Valid',
        VERBOSE ? result : undefined
      );
    }
  }
  
  // Test 14: Validator - Custom Rules
  testValidatorCustomRules() {
    this.logSection('Test 14: Validator - Custom Rules');
    
    // Create custom rules
    const customRules: ValidationRule[] = [
      {
        name: 'no-duplicate-options',
        validate: (card) => {
          if (card.type !== 'multiple-choice' || !card.options) {
            return { valid: true };
          }
          
          const texts = card.options.map(o => o.text.toLowerCase());
          const unique = new Set(texts);
          
          if (texts.length !== unique.size) {
            return {
              valid: false,
              errors: ['Multiple choice options must be unique']
            };
          }
          
          return { valid: true };
        }
      },
      {
        name: 'category-required',
        validate: (card) => {
          if (!card.category || card.category.trim() === '') {
            return {
              valid: false,
              errors: ['Category is required']
            };
          }
          return { valid: true };
        }
      }
    ];
    
    const customValidator = new MarkdownValidator(customRules);
    
    const testCases = [
      {
        name: 'MC with duplicate options',
        card: { 
          id: '1', 
          type: 'multiple-choice' as const, 
          front: 'Choose one', 
          back: 'A',
          options: [
            { text: 'Option A', isCorrect: true },
            { text: 'Option B', isCorrect: false },
            { text: 'Option A', isCorrect: false }
          ],
          metadata: {}
        },
        expectValid: false,
        expectedError: 'Multiple choice options must be unique'
      },
      {
        name: 'Card without category',
        card: { 
          id: '2', 
          type: 'simple' as const, 
          front: 'Question?', 
          back: 'Answer',
          metadata: {}
        },
        expectValid: false,
        expectedError: 'Category is required'
      },
      {
        name: 'Valid card with category',
        card: { 
          id: '3', 
          type: 'simple' as const, 
          front: 'Question?', 
          back: 'Answer',
          category: 'General',
          metadata: {}
        },
        expectValid: true
      }
    ];
    
    for (const test of testCases) {
      const result = customValidator.validateCard(test.card as Flashcard);
      const passed = result.valid === test.expectValid;
      
      this.addResult(
        test.name,
        passed,
        result.errors?.join(', ') || 'Valid',
        VERBOSE ? result : undefined
      );
      
      if (test.expectedError) {
        const hasError = result.errors?.some(e => e.includes(test.expectedError!)) || false;
        this.addResult(
          `${test.name} - custom rule check`,
          hasError,
          hasError ? 'Custom rule error found' : 'Custom rule error not found'
        );
      }
    }
  }
  
  // Test 15: Validator - Batch Validation
  testValidatorBatch() {
    this.logSection('Test 15: Validator - Batch Validation');
    
    const cards: Flashcard[] = [
      { 
        id: '1', 
        type: 'simple', 
        front: 'Valid card', 
        back: 'Answer',
        metadata: {} 
      },
      { 
        id: '2', 
        type: 'simple', 
        front: '', 
        back: 'Invalid - empty front',
        metadata: {} 
      },
      { 
        id: '3', 
        type: 'true-false', 
        front: 'Statement', 
        back: 'maybe',
        metadata: {} 
      },
      { 
        id: '4', 
        type: 'multiple-choice', 
        front: 'Question?', 
        back: 'A',
        options: [{ text: 'A', isCorrect: true }],
        metadata: {} 
      },
      { 
        id: '5', 
        type: 'simple', 
        front: 'A'.repeat(600), 
        back: 'Long question warning',
        metadata: {} 
      }
    ];
    
    const results = this.validator.validate(cards);
    
    this.addResult(
      'Batch validation count',
      results.length === cards.length,
      `Validated ${results.length} cards`
    );
    
    const validCount = results.filter(r => r.valid).length;
    const invalidCount = results.filter(r => !r.valid).length;
    const warningCount = results.filter(r => r.warnings && r.warnings.length > 0).length;
    
    this.addResult(
      'Valid cards count',
      validCount === 2,
      `${validCount} valid cards`
    );
    
    this.addResult(
      'Invalid cards count',
      invalidCount === 3,
      `${invalidCount} invalid cards`
    );
    
    this.addResult(
      'Cards with warnings',
      warningCount === 1,
      `${warningCount} cards with warnings`
    );
    
    // Check specific validation results
    this.addResult(
      'Card 2 validation',
      !results[1].valid && results[1].errors?.some(e => e.includes('empty')),
      'Empty front error detected'
    );
    
    this.addResult(
      'Card 3 validation',
      !results[2].valid && results[2].errors?.some(e => e.includes('true" or "false')),
      'Invalid true/false error detected'
    );
    
    this.addResult(
      'Card 5 validation',
      results[4].valid && (results[4].warnings?.length || 0) > 0,
      'Long content warning detected'
    );
  }
  
  // Helper methods
  private countTypes(cards: any[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const card of cards) {
      counts[card.type] = (counts[card.type] || 0) + 1;
    }
    return counts;
  }
  
  // Test 16: Processor - Full Integration
  testProcessorIntegration() {
    this.logSection('Test 16: Processor - Full Integration');
    
    const testCases = [
      {
        name: 'Simple deck processing',
        markdown: `# Math Basics

What is 2 + 2? :: 4
What is 5 × 3? :: 15

The square root of 16 is 4 :: true`,
        expectedCards: 3,
        expectedTypes: { simple: 2, 'true-false': 1 }
      },
      {
        name: 'Mixed content with metadata',
        markdown: `---
title: Advanced Math
description: Complex calculations
emoji: 🧮
---

# Algebra

What is x if 2x + 5 = 13?
- x = 3
- x = 4
- x = 5
- x = 6
> x = 4

Solve: x² = 25 :: x = ±5
<!-- Difficulty: medium -->`,
        expectedCards: 2,
        expectedMetadata: {
          title: 'Advanced Math',
          emoji: '🧮'
        }
      },
      {
        name: 'Vietnamese content processing',
        markdown: `# Tiếng Việt

Xin chào nghĩa là gì? :: Hello
Cảm ơn :: Thank you
Việt Nam nằm ở châu Á :: true`,
        expectedCards: 3,
        hasVietnamese: true
      }
    ];
    
    for (const test of testCases) {
      try {
        const result = this.processor.parse(test.markdown);
        
        this.addResult(
          `${test.name} - card count`,
          result.cards.length === test.expectedCards,
          `Expected ${test.expectedCards} cards, got ${result.cards.length}`
        );
        
        if (test.expectedTypes) {
          const types = this.countTypes(result.cards);
          const typesMatch = Object.entries(test.expectedTypes).every(
            ([type, count]) => types[type] === count
          );
          
          this.addResult(
            `${test.name} - card types`,
            typesMatch,
            `Types: ${JSON.stringify(types)}`
          );
        }
        
        if (test.expectedMetadata) {
          const metadataMatch = Object.entries(test.expectedMetadata).every(
            ([key, value]) => result.metadata[key as keyof typeof result.metadata] === value
          );
          
          this.addResult(
            `${test.name} - metadata`,
            metadataMatch,
            'Metadata processed correctly'
          );
        }
        
        if (test.hasVietnamese) {
          const hasViet = result.cards.some(card => 
            /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i.test(
              card.front + card.back
            )
          );
          
          this.addResult(
            `${test.name} - Vietnamese content`,
            hasViet,
            hasViet ? 'Vietnamese preserved' : 'Vietnamese lost'
          );
        }
        
        // Check validation
        const validationPassed = result.errors.length === 0;
        this.addResult(
          `${test.name} - validation`,
          validationPassed,
          validationPassed ? 'No errors' : `Errors: ${result.errors.map(e => e.message).join(', ')}`
        );
        
      } catch (error: any) {
        this.addResult(test.name, false, error.message);
      }
    }
  }
  
  // Test 17: Processor - Error Handling
  testProcessorErrors() {
    this.logSection('Test 17: Processor - Error Handling');
    
    const errorCases = [
      {
        name: 'Invalid YAML frontmatter',
        markdown: `---
title: Test
invalid yaml here :: bad
---

Question :: Answer`,
        expectError: true
      },
      {
        name: 'Malformed multiple choice',
        markdown: `What is the answer?
- Option 1
- Option 2
No correct answer marker`,
        shouldHaveCards: false
      },
      {
        name: 'Mixed valid and invalid',
        markdown: `Valid card :: Answer

Invalid multiple choice:
- Only one option
> Only one option

Another valid :: Card`,
        minCards: 2
      }
    ];
    
    for (const test of errorCases) {
      try {
        const result = this.processor.parse(test.markdown);
        
        if (test.expectError) {
          this.addResult(
            test.name,
            result.errors.length > 0,
            `Expected errors, got ${result.errors.length} errors`
          );
        }
        
        if (test.shouldHaveCards === false) {
          this.addResult(
            test.name,
            result.cards.length === 0,
            `Expected no cards, got ${result.cards.length}`
          );
        }
        
        if (test.minCards) {
          this.addResult(
            test.name,
            result.cards.length >= test.minCards,
            `Expected at least ${test.minCards} cards, got ${result.cards.length}`
          );
        }
        
      } catch (error: any) {
        this.addResult(
          test.name,
          test.expectError === true,
          `Exception: ${error.message}`
        );
      }
    }
  }
  
  // Test 18: Processor - Plugin System
  testProcessorPlugins() {
    this.logSection('Test 18: Processor - Plugin System');
    
    // Create a custom plugin
    const emojiPlugin = {
      name: 'emoji-replacer',
      version: '1.0.0',
      
      beforeTokenize: (content: string) => {
        return content
          .replace(/:smile:/g, '😊')
          .replace(/:star:/g, '⭐')
          .replace(/:check:/g, '✅');
      },
      
      afterParse: (result: any) => {
        // Add emoji count to stats
        const emojiCount = result.cards.reduce((count: number, card: any) => {
          const emojiRegex = /[\u{1F300}-\u{1F9FF}]/gu;
          const frontEmojis = (card.front.match(emojiRegex) || []).length;
          const backEmojis = (card.back.match(emojiRegex) || []).length;
          return count + frontEmojis + backEmojis;
        }, 0);
        
        return {
          ...result,
          stats: {
            ...result.stats,
            emojiCount
          }
        };
      }
    };
    
    const processorWithPlugin = new MarkdownProcessor({ plugins: [emojiPlugin] });
    
    const markdown = `What makes you :smile:? :: Being happy :smile:
Rate this with a :star: :: :star::star::star::star::star:
Task completed :check: :: true`;
    
    try {
      const result = processorWithPlugin.parse(markdown);
      
      this.addResult(
        'Plugin - emoji replacement',
        result.cards.some(c => c.front.includes('😊')),
        'Emoji replacement worked'
      );
      
      this.addResult(
        'Plugin - stats modification',
        (result.stats as any).emojiCount > 0,
        `Found ${(result.stats as any).emojiCount || 0} emojis`
      );
      
      this.addResult(
        'Plugin - card count',
        result.cards.length === 3,
        `Processed ${result.cards.length} cards`
      );
      
    } catch (error: any) {
      this.addResult('Plugin processing', false, error.message);
    }
  }
  
  // Run all tests
  async runAll() {
    this.log('🧪 MyFlashPlay Markdown Testing Suite', colors.magenta);
    this.log('This test MUST pass before any build\n', colors.yellow);
    
    const startTime = performance.now();
    
    // Run all test categories
    this.testBasicFormats();
    this.testMultipleChoice();
    this.testCategories();
    this.testUTF8();
    this.testSampleDecks();
    this.testEdgeCases();
    this.testMetadata();
    this.testPerformance();
    
    // Validator tests
    this.testValidatorBasic();
    this.testValidatorTrueFalse();
    this.testValidatorMultipleChoice();
    this.testValidatorContentLength();
    this.testValidatorMetadata();
    this.testValidatorCustomRules();
    this.testValidatorBatch();
    
    // Processor tests
    this.testProcessorIntegration();
    this.testProcessorErrors();
    this.testProcessorPlugins();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Summary
    this.logSection('Test Summary');
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const passRate = (passed / this.results.length * 100).toFixed(1);
    
    this.log(`Total Tests: ${this.results.length}`, colors.blue);
    this.log(`Passed: ${passed}`, colors.green);
    this.log(`Failed: ${failed}`, failed > 0 ? colors.red : colors.green);
    this.log(`Pass Rate: ${passRate}%`, colors.blue);
    this.log(`Duration: ${duration.toFixed(2)}ms`, colors.gray);
    
    if (failed > 0) {
      this.log('\nFailed Tests:', colors.red);
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          this.log(`  ✗ ${r.name}`, colors.red);
          if (r.message) this.log(`    ${r.message}`, colors.gray);
        });
    }
    
    const success = failed === 0;
    this.log(
      `\n${success ? '✅ All tests passed!' : '❌ Some tests failed!'}`,
      success ? colors.green : colors.red
    );
    
    return success;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const suite = new MarkdownTestSuite();
  suite.runAll().then(success => {
    process.exit(success ? 0 : 1);
  });
}