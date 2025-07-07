# MyFlashPlay Integration Tests

## 🚀 Quick Usage

### Test any deployed URL:
```bash
# Test production site
pnpm test:integration https://www.MyFlashPlay.com

# Test local dev server (if running on localhost:3000)
pnpm test:integration:local

# Quick lightweight test
pnpm test:quick https://www.MyFlashPlay.com
```

### Self-test (build and test locally):
```bash
# Full self-test: builds, serves, and tests
pnpm test:self
```

## 🧪 Test Coverage

### Integration Test (`scripts/integration-test.ts`)
**Comprehensive test suite that checks:**

✅ **Page Load & Navigation** - Basic site loading and title verification  
✅ **Sample Decks Present** - Vietnamese UTF-8 support, math decks, card counts  
✅ **Deck Creation Flow** - Create page, markdown editor, save functionality  
✅ **Gameplay Functionality** - Play buttons, game loading, flashcard content  
✅ **Markdown Guide & Templates** - Simple format guide, template availability  
✅ **Mobile Responsiveness** - Mobile viewport testing  
✅ **Error Handling** - 404 pages, accessibility basics  

### Quick Test (`scripts/quick-test.ts`)
**Lightweight test for fast verification:**

✅ **Page loads successfully**  
✅ **Sample decks are visible**  
✅ **UTF-8 support (Vietnamese text)**  
✅ **Navigation to create page works**  

## 🎯 Test Results

Tests show **green ✅** or **red ❌** status with timing:

```
📊 Test Results Summary
==================================================
✅ Page Load & Navigation           1205ms
✅ Sample Decks Present              843ms
✅ Deck Creation Flow               2156ms
✅ Gameplay Functionality           1789ms
✅ Markdown Guide & Templates        654ms
✅ Mobile Responsiveness             432ms
✅ Error Handling                    876ms
==================================================
📈 7/7 tests passed (7955ms total)
🎉 All tests passed! MyFlashPlay is working correctly.
```

## 🛠️ For Development

### Run against local dev server:
```bash
# Start dev server in one terminal
pnpm dev

# Run tests in another terminal
pnpm test:quick:local
```

### Run against production build:
```bash
# Build and serve locally
pnpm build
pnpm serve

# Test against preview server
pnpm test:quick http://localhost:4173
```

## 🌐 Example URLs to Test

- **Vercel**: `https://www.MyFlashPlay.com`
- **Local Dev**: `http://localhost:3000`
- **Local Preview**: `http://localhost:4173`

## 🔧 Troubleshooting

**Tests failing?**
1. ✅ Check if the URL is accessible in your browser
2. ✅ Verify the site has loaded sample decks
3. ✅ Make sure Vietnamese text is visible (UTF-8 test)
4. ✅ Try the create page manually

**Timeout issues?**
- Tests have 30-second timeouts for page loads
- Quick test has 15-second timeouts for faster feedback

**Connection refused?**
- Make sure the target URL is running
- For local testing, ensure dev server is started first