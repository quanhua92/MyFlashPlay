# FlashPlay Test Plan

## Overview
This document outlines the testing methodology for FlashPlay, focusing on verifying that sample decks (especially Vietnamese UTF-8 decks) load correctly and all features work as expected.

## Test Environment Setup

### 1. Kill Any Running Servers
```bash
pkill -f "vite" || true
pkill -f "node" || true
```

### 2. Clear Browser Data
- Clear localStorage before each test
- Use incognito/private browsing when manual testing

### 3. Build and Serve
```bash
pnpm build
pnpm serve
```
Note: The serve command will automatically find an available port (usually 4173-4175)

## Test Scenarios

### Scenario 1: Verify Sample Decks Load
**Objective**: Ensure all sample decks, especially Vietnamese ones, load on first visit

**Steps**:
1. Open browser console (F12)
2. Clear localStorage: `localStorage.clear()`
3. Navigate to the app
4. Check console for:
   - "No existing decks found, initializing with sample decks"
   - "Successfully migrated X sample decks"
   - Any parsing errors
5. Verify on homepage:
   - Math Basics deck exists
   - Vietnamese animal deck (Động Vật Việt Nam) exists
   - Vietnamese colors deck (Màu Sắc và Đồ Vật) exists
   - Vietnamese math deck (Toán Học Cơ Bản) exists

**Expected Results**:
- All 4 sample decks should be visible
- No parsing errors in console
- Vietnamese characters display correctly

### Scenario 2: Test Markdown Parser
**Objective**: Verify the markdown parser handles all formats correctly

**Test Cases**:
1. Simple format: `Question :: Answer`
2. True/False: `Is sky blue? :: true`
3. With special characters: `Số 5 + 3 = ? :: 8`
4. With emoji: `🐯 là con gì? :: Con hổ`
5. Multi-line content (should handle gracefully)

**Debug Steps**:
1. Add console logging to `markdown-parser.ts`:
   ```typescript
   parse(markdown: string): Flashcard[] {
     console.log('Parsing markdown:', markdown);
     // ... rest of code
   }
   ```
2. Check what format is being saved to localStorage
3. Verify the parser handles both old and new formats

### Scenario 3: Integration Test
**Objective**: Verify automated tests work correctly

**Steps**:
1. Use the quick test first:
   ```bash
   pnpm test:quick http://localhost:4173
   ```
2. If quick test passes, run full test:
   ```bash
   pnpm test:integration http://localhost:4173
   ```

**Note**: Always use the actual port shown by the serve command, not hardcoded ports.

## Common Issues and Solutions

### Issue: Vietnamese Decks Not Showing
**Possible Causes**:
1. Markdown parser not handling UTF-8 correctly
2. Parser expecting wrong format (e.g., requiring `- ` prefix)
3. Silent parsing errors
4. localStorage corruption

**Debug Steps**:
1. Check localStorage keys: `Object.keys(localStorage).filter(k => k.startsWith('mdoc_'))`
2. Read raw markdown: `localStorage.getItem('mdoc_vietnamese-animals')`
3. Manually test parser: 
   ```javascript
   const parser = new MarkdownParser();
   const cards = parser.parse(localStorage.getItem('mdoc_vietnamese-animals'));
   console.log(cards);
   ```

### Issue: Port Conflicts
**Solution**: Never hardcode ports. Always check the actual port from serve output.

### Issue: Tests Timing Out
**Possible Causes**:
1. Elements have different selectors than expected
2. Page structure changed
3. Async loading issues

**Debug Steps**:
1. Take screenshots during test failures
2. Add wait conditions before assertions
3. Log page content when elements not found

## Manual Testing Checklist

- [ ] Clear localStorage and reload - sample decks appear
- [ ] Vietnamese text displays correctly
- [ ] Can create new deck with Vietnamese content
- [ ] Can play games with Vietnamese cards
- [ ] Download markdown works for Vietnamese decks
- [ ] Import markdown with Vietnamese content works
- [ ] Mobile view works correctly

## Automated Test Improvements

1. **Don't assume ports** - Always use the actual port from server output
2. **Add retries** - Some elements may load asynchronously
3. **Better error messages** - Include page content in error messages
4. **Screenshot on failure** - Helps debug visual issues

## Root Cause Analysis Steps

1. **Verify Markdown Format**
   - Check exact format saved to localStorage
   - Compare with parser expectations
   - Test parser with various inputs

2. **Console Debugging**
   - Add extensive logging to `useDecks.ts`
   - Log each step of sample deck loading
   - Capture any errors or warnings

3. **Parser Testing**
   - Create unit tests for parser
   - Test with sample deck content
   - Verify UTF-8 handling

4. **Browser Testing**
   - Test in different browsers
   - Check for console errors
   - Verify network requests