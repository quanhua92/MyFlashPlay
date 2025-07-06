import { describe, it, expect, vi } from 'vitest';
import { parseMarkdownToCards } from '../markdown-parser';

describe('Markdown Parser', () => {
  it('should parse basic Q&A format', () => {
    const markdown = `
# Test Deck

## Q: What is 2+2?
A: 4

## Q: What is the capital of France?
A: Paris
    `;

    const result = parseMarkdownToCards(markdown);
    
    expect(result.cards).toHaveLength(2);
    expect(result.cards[0].front).toBe('What is 2+2?');
    expect(result.cards[0].back).toBe('4');
    expect(result.cards[1].front).toBe('What is the capital of France?');
    expect(result.cards[1].back).toBe('Paris');
  });

  it('should handle multiple choice questions', () => {
    const markdown = `
# Test Deck

## Q: What is 2+2?
- A) 3
- B) 4
- C) 5
- D) 6

**Answer: B) 4**
    `;

    const result = parseMarkdownToCards(markdown);
    
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].type).toBe('multiple-choice');
    expect(result.cards[0].options).toHaveLength(4);
    expect(result.cards[0].correctAnswer).toBe('B) 4');
  });

  it('should extract deck metadata', () => {
    const markdown = `
# Test Deck 🧪

This is a test deck for unit tests.

## Q: What is 2+2?
A: 4
    `;

    const result = parseMarkdownToCards(markdown);
    
    expect(result.name).toBe('Test Deck');
    expect(result.description).toBe('This is a test deck for unit tests.');
    expect(result.emoji).toBe('🧪');
  });

  it('should handle empty input', () => {
    const result = parseMarkdownToCards('');
    
    expect(result.cards).toHaveLength(0);
    expect(result.name).toBe('Untitled Deck');
    expect(result.description).toBe('');
  });

  it('should handle malformed input gracefully', () => {
    const markdown = `
# Test Deck

Random text without questions

## Not a question
Some content
    `;

    const result = parseMarkdownToCards(markdown);
    
    expect(result.cards).toHaveLength(0);
    expect(result.name).toBe('Test Deck');
  });

  it('should assign difficulty levels', () => {
    const markdown = `
# Test Deck

## Q: Easy question
A: Easy answer

## Q: Medium question with more complex content
A: Medium answer with detailed explanation

## Q: Hard question with very complex content and multiple concepts
A: Hard answer with extensive explanation and examples
    `;

    const result = parseMarkdownToCards(markdown);
    
    expect(result.cards).toHaveLength(3);
    expect(result.cards[0].difficulty).toBe('easy');
    expect(result.cards[1].difficulty).toBe('medium');
    expect(result.cards[2].difficulty).toBe('hard');
  });

  it('should sanitize HTML content', () => {
    const markdown = `
# Test Deck

## Q: What is <script>alert('xss')</script>2+2?
A: <img src="x" onerror="alert('xss')">4
    `;

    const result = parseMarkdownToCards(markdown);
    
    expect(result.cards[0].front).not.toContain('<script>');
    expect(result.cards[0].back).not.toContain('onerror');
  });

  it('should handle categories', () => {
    const markdown = `
# Test Deck

## Math: What is 2+2?
A: 4

## Geography: What is the capital of France?
A: Paris
    `;

    const result = parseMarkdownToCards(markdown);
    
    expect(result.cards[0].category).toBe('Math');
    expect(result.cards[1].category).toBe('Geography');
  });

  it('should estimate time correctly', () => {
    const markdown = `
# Test Deck

## Q: Question 1
A: Answer 1

## Q: Question 2
A: Answer 2
    `;

    const result = parseMarkdownToCards(markdown);
    
    expect(result.metadata.estimatedTime).toBeGreaterThan(0);
    expect(result.metadata.estimatedTime).toBeLessThan(60);
  });
});