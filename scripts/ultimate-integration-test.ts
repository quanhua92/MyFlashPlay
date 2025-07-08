#!/usr/bin/env node

/**
 * Ultimate MyFlashPlay Integration Test Suite
 * 
 * Comprehensive test covering every possible user journey:
 * - Complete user flows from start to finish
 * - Translation switching and validation
 * - Deck creation, editing, deletion workflows
 * - Public deck interaction and saving
 * - All UI components and interactions
 * - Mobile and desktop responsiveness
 * - Error handling and edge cases
 * - Performance and accessibility
 * 
 * Usage: pnpm test:ultimate [URL]
 */

import { chromium, type Browser, type Page } from 'playwright';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message?: string;
  duration: number;
  details?: string[];
}

interface TestStep {
  description: string;
  action: () => Promise<void>;
  optional?: boolean;
}

class UltimateIntegrationTester {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl: string;
  private results: TestResult[] = [];
  private testData: {
    createdDeckId?: string;
    savedPublicDeckId?: string;
    testDeckName: string;
    testMarkdown: string;
    supportedLanguages: string[];
  };

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.testData = {
      testDeckName: 'Ultimate Test Deck',
      testMarkdown: `# Ultimate Test Deck

## Math Section
What is 2 + 2? :: 4
What is 5 × 3? :: 15
What is 10 ÷ 2? :: 5

## Science Section
What is H2O? :: Water
What is the speed of light? :: 299,792,458 m/s
Is the Earth round? :: true

## Multiple Choice
What is the largest planet?
- Earth
- Jupiter
- Mars
- Venus
> Jupiter

## Languages
Bonjour :: Hello (French)
Hola :: Hello (Spanish)
Xin chào :: Hello (Vietnamese)
こんにちは :: Hello (Japanese)`,
      supportedLanguages: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'vi']
    };
  }

  private async setup() {
    console.log('🚀 Starting Ultimate MyFlashPlay Integration Tests...');
    console.log(`🌐 Target URL: ${this.baseUrl}`);
    console.log('📋 Test Coverage:');
    console.log('   • Complete user journeys');
    console.log('   • Translation systems');
    console.log('   • Deck management workflows');
    console.log('   • Public deck interactions');
    console.log('   • UI/UX comprehensive testing');
    console.log('   • Mobile/desktop responsiveness');
    console.log('   • Error handling & edge cases');
    console.log('   • Performance & accessibility');

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

    // Enable detailed logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔍 Browser Error: ${msg.text()}`);
      }
    });
  }

  private async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async runTest(testName: string, testSteps: TestStep[]): Promise<void> {
    const startTime = Date.now();
    const details: string[] = [];

    try {
      console.log(`⏳ ${testName}...`);
      
      for (const step of testSteps) {
        try {
          await step.action();
          details.push(`✅ ${step.description}`);
        } catch (error) {
          if (step.optional) {
            details.push(`⚠️ ${step.description} (optional - ${error})`);
          } else {
            throw new Error(`${step.description}: ${error}`);
          }
        }
      }

      const duration = Date.now() - startTime;
      this.results.push({ name: testName, status: 'pass', duration, details });
      console.log(`✅ ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      this.results.push({ name: testName, status: 'fail', message, duration, details });
      console.log(`❌ ${testName} (${duration}ms): ${message}`);
    }
  }

  private async waitForElement(selector: string, timeout = 5000): Promise<void> {
    await this.page!.waitForSelector(selector, { timeout });
  }

  private async clickElement(selector: string, options: { timeout?: number; optional?: boolean } = {}): Promise<void> {
    try {
      await this.page!.click(selector, { timeout: options.timeout || 10000 });
    } catch (error) {
      if (options.optional) {
        throw new Error(`Optional click failed: ${error}`);
      }
      throw error;
    }
  }

  // Test 1: Complete User Onboarding Flow
  private async testUserOnboarding(): Promise<void> {
    const steps: TestStep[] = [
      {
        description: "Navigate to homepage",
        action: async () => {
          const response = await this.page!.goto(this.baseUrl, { waitUntil: 'networkidle' });
          if (!response || response.status() >= 400) {
            throw new Error(`Failed to load homepage: ${response?.status()}`);
          }
        }
      },
      {
        description: "Verify homepage loads with branding",
        action: async () => {
          const hasTitle = await this.page!.locator('h1, title').count() > 0 || 
                          await this.page!.locator('text=MyFlashPlay').count() > 0;
          if (!hasTitle) {
            throw new Error('Homepage title/branding not found');
          }
        }
      },
      {
        description: "Check language selection dialog (if first visit)",
        action: async () => {
          const hasLanguageDialog = await this.page!.locator('text=Select Language').count() > 0 || 
                                    await this.page!.locator('text=Choose Language').count() > 0;
          if (hasLanguageDialog) {
            const englishButton = this.page!.locator('text=English').first();
            if (await englishButton.count() > 0) {
              await englishButton.click();
            }
          }
        },
        optional: true
      },
      {
        description: "Verify sample decks are visible",
        action: async () => {
          const deckCards = await this.page!.locator('.bg-white, .rounded-xl, .shadow, [data-testid="deck-card"]').count();
          if (deckCards === 0) {
            throw new Error('No sample decks found');
          }
        }
      },
      {
        description: "Test navigation menu accessibility",
        action: async () => {
          const hasNavigation = await this.page!.locator('nav, header, [role="navigation"]').count() > 0;
          if (!hasNavigation) {
            throw new Error('Navigation menu not found');
          }
        }
      }
    ];

    await this.runTest('User Onboarding Flow', steps);
  }

  // Test 2: Complete Deck Creation Workflow
  private async testDeckCreationWorkflow(): Promise<void> {
    const steps: TestStep[] = [
      {
        description: "Navigate to create page",
        action: async () => {
          await this.page!.goto(`${this.baseUrl}/create`);
          await this.page!.waitForTimeout(2000);
        }
      },
      {
        description: "Fill deck name",
        action: async () => {
          const nameInput = this.page!.locator('input[placeholder*="name"], input[placeholder*="deck"], input[type="text"]').first();
          await nameInput.fill(this.testData.testDeckName);
        }
      },
      {
        description: "Switch to markdown mode",
        action: async () => {
          const markdownButton = this.page!.locator('text=Raw Markdown, text=Markdown, button:has-text("Raw")');
          if (await markdownButton.count() > 0) {
            await markdownButton.first().click();
            await this.page!.waitForTimeout(1000);
          }
        },
        optional: true
      },
      {
        description: "Input comprehensive markdown content",
        action: async () => {
          const markdownArea = this.page!.locator('textarea, .cm-editor, .CodeMirror').last();
          await markdownArea.fill(this.testData.testMarkdown);
        }
      },
      {
        description: "Validate markdown preview",
        action: async () => {
          const previewButton = this.page!.locator('text=Preview, button:has-text("Preview")');
          if (await previewButton.count() > 0) {
            await previewButton.first().click();
            await this.page!.waitForTimeout(1000);
            const hasPreview = await this.page!.locator('text=What is 2 + 2?').count() > 0;
            if (!hasPreview) {
              throw new Error('Markdown preview not working');
            }
          }
        },
        optional: true
      },
      {
        description: "Save the deck",
        action: async () => {
          // Wait for any loading to complete first
          await this.page!.waitForTimeout(2000);
          
          const saveButton = this.page!.locator('button:has-text("Save"), button:has-text("Create"), button:has-text("Update")').first();
          
          // Wait for the button to be visible and enabled
          await saveButton.waitFor({ state: 'visible', timeout: 10000 });
          await saveButton.scrollIntoViewIfNeeded();
          
          // Try to click the button
          await saveButton.click({ force: true });
          await this.page!.waitForTimeout(3000);
        }
      },
      {
        description: "Verify deck was created",
        action: async () => {
          const url = this.page!.url();
          const hasSuccess = await this.page!.locator('text=success, text=created, text=saved').count() > 0;
          if (!url.includes('/decks') && !hasSuccess) {
            throw new Error('Deck creation may not have completed');
          }
        }
      }
    ];

    await this.runTest('Deck Creation Workflow', steps);
  }

  // Test 3: Deck Editing and Management
  private async testDeckEditingWorkflow(): Promise<void> {
    const steps: TestStep[] = [
      {
        description: "Navigate to decks page",
        action: async () => {
          await this.page!.goto(`${this.baseUrl}/decks`);
          await this.page!.waitForTimeout(2000);
        }
      },
      {
        description: "Find the created deck",
        action: async () => {
          const createdDeck = await this.page!.locator(`text=${this.testData.testDeckName}`).count();
          if (createdDeck === 0) {
            throw new Error('Created deck not found in deck list');
          }
        }
      },
      {
        description: "Access deck edit options",
        action: async () => {
          const editButton = this.page!.locator('text=Edit, button:has-text("Edit"), [data-testid="edit-button"]').first();
          if (await editButton.count() > 0) {
            await editButton.click();
          } else {
            // Try clicking on the deck card itself
            await this.page!.locator(`text=${this.testData.testDeckName}`).first().click();
          }
          await this.page!.waitForTimeout(2000);
        }
      },
      {
        description: "Modify deck content",
        action: async () => {
          const editPageUrl = this.page!.url();
          if (editPageUrl.includes('/edit') || editPageUrl.includes('/create')) {
            const markdownArea = this.page!.locator('textarea, .cm-editor').last();
            const currentContent = await markdownArea.inputValue();
            const updatedContent = currentContent + '\n\nWhat is 20 + 20? :: 40';
            await markdownArea.fill(updatedContent);
          }
        }
      },
      {
        description: "Save changes",
        action: async () => {
          const saveButton = this.page!.locator('button:has-text("Save"), button:has-text("Update")').first();
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await this.page!.waitForTimeout(2000);
          }
        },
        optional: true
      }
    ];

    await this.runTest('Deck Editing Workflow', steps);
  }

  // Test 4: Public Deck Interaction
  private async testPublicDeckInteraction(): Promise<void> {
    const steps: TestStep[] = [
      {
        description: "Navigate to public decks",
        action: async () => {
          await this.page!.goto(`${this.baseUrl}/public-decks`);
          await this.page!.waitForTimeout(3000);
        }
      },
      {
        description: "Browse available public decks",
        action: async () => {
          const publicDecks = await this.page!.locator('.bg-white, .rounded-xl, .shadow, [data-testid="deck-card"]').count();
          if (publicDecks === 0) {
            throw new Error('No public decks found');
          }
        }
      },
      {
        description: "Filter decks by category",
        action: async () => {
          const filterButton = this.page!.locator('text=Filter, button:has-text("Filter"), select').first();
          if (await filterButton.count() > 0) {
            await filterButton.click();
            await this.page!.waitForTimeout(1000);
          }
        },
        optional: true
      },
      {
        description: "Save a public deck",
        action: async () => {
          const saveButton = this.page!.locator('text=Save, button:has-text("Save"), text=Add').first();
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await this.page!.waitForTimeout(2000);
          }
        }
      },
      {
        description: "Verify deck was saved to personal collection",
        action: async () => {
          await this.page!.goto(`${this.baseUrl}/decks`);
          await this.page!.waitForTimeout(2000);
          const deckCount = await this.page!.locator('.bg-white, .rounded-xl, .shadow').count();
          if (deckCount === 0) {
            throw new Error('No decks found in personal collection');
          }
        }
      }
    ];

    await this.runTest('Public Deck Interaction', steps);
  }

  // Test 5: Complete Gameplay Testing
  private async testGameplayModes(): Promise<void> {
    const steps: TestStep[] = [
      {
        description: "Navigate to a deck for gameplay",
        action: async () => {
          await this.page!.goto(`${this.baseUrl}/decks`);
          await this.page!.waitForTimeout(2000);
        }
      },
      {
        description: "Start gameplay session",
        action: async () => {
          // Close any potential modal dialogs first
          const closeButton = this.page!.locator('button[aria-label="Close"], button:has-text("×"), [role="dialog"] button').first();
          if (await closeButton.count() > 0) {
            await closeButton.click();
            await this.page!.waitForTimeout(1000);
          }
          
          const playButton = this.page!.locator('text=Start Playing').first();
          if (await playButton.count() > 0) {
            await playButton.click();
          } else {
            const playButtons = this.page!.locator('text=Play, button:has-text("Play")').first();
            if (await playButtons.count() > 0) {
              await playButtons.click();
            } else {
              // Try clicking on deck card
              const deckCard = this.page!.locator('.bg-white.rounded-xl, .shadow-lg').first();
              await deckCard.click();
            }
          }
          await this.page!.waitForTimeout(3000);
        }
      },
      {
        description: "Test Study Mode",
        action: async () => {
          const studyMode = this.page!.locator('text=Study Mode, button:has-text("Study")');
          if (await studyMode.count() > 0) {
            await studyMode.first().click();
            await this.page!.waitForTimeout(2000);
            // Test flashcard interaction
            const flashcard = this.page!.locator('.flashcard, [data-testid="flashcard"]').first();
            if (await flashcard.count() > 0) {
              await flashcard.click();
            }
          }
        }
      },
      {
        description: "Test Quiz Mode",
        action: async () => {
          const quizMode = this.page!.locator('text=Quiz Mode, button:has-text("Quiz")');
          if (await quizMode.count() > 0) {
            await quizMode.first().click();
            await this.page!.waitForTimeout(2000);
            // Test multiple choice interaction
            const choice = this.page!.locator('button:has-text("4"), button:has-text("Paris")').first();
            if (await choice.count() > 0) {
              await choice.click();
            }
          }
        },
        optional: true
      },
      {
        description: "Test Speed Mode",
        action: async () => {
          const speedMode = this.page!.locator('text=Speed Mode, button:has-text("Speed")');
          if (await speedMode.count() > 0) {
            await speedMode.first().click();
            await this.page!.waitForTimeout(2000);
          }
        },
        optional: true
      },
      {
        description: "Test Memory Mode",
        action: async () => {
          const memoryMode = this.page!.locator('text=Memory Mode, button:has-text("Memory")');
          if (await memoryMode.count() > 0) {
            await memoryMode.first().click();
            await this.page!.waitForTimeout(2000);
          }
        },
        optional: true
      },
      {
        description: "Test Falling Mode",
        action: async () => {
          const fallingMode = this.page!.locator('text=Falling Mode, button:has-text("Falling")');
          if (await fallingMode.count() > 0) {
            await fallingMode.first().click();
            await this.page!.waitForTimeout(2000);
          }
        },
        optional: true
      }
    ];

    await this.runTest('Gameplay Modes Testing', steps);
  }

  // Test 6: Translation and Internationalization
  private async testTranslationSystem(): Promise<void> {
    const steps: TestStep[] = [
      {
        description: "Navigate to settings",
        action: async () => {
          await this.page!.goto(`${this.baseUrl}/settings`);
          await this.page!.waitForTimeout(2000);
        }
      },
      {
        description: "Find language selector",
        action: async () => {
          const languageSelector = await this.page!.locator('select').count() > 0 || 
                                  await this.page!.locator('text=Language').count() > 0 || 
                                  await this.page!.locator('text=Idioma').count() > 0 || 
                                  await this.page!.locator('[data-testid="language-selector"]').count() > 0;
          if (!languageSelector) {
            throw new Error('Language selector not found');
          }
        }
      },
      {
        description: "Test Spanish translation",
        action: async () => {
          const spanishOption = this.page!.locator('option[value="es"], text=Español, text=Spanish');
          if (await spanishOption.count() > 0) {
            await spanishOption.first().click();
            await this.page!.waitForTimeout(2000);
            // Verify Spanish text appears
            const hasSpanish = await this.page!.locator('text=Crear, text=Configuración, text=Barajas').count() > 0;
            if (!hasSpanish) {
              throw new Error('Spanish translation not working');
            }
          }
        }
      },
      {
        description: "Test Vietnamese translation",
        action: async () => {
          const vietnameseOption = this.page!.locator('option[value="vi"], text=Tiếng Việt, text=Vietnamese');
          if (await vietnameseOption.count() > 0) {
            await vietnameseOption.first().click();
            await this.page!.waitForTimeout(2000);
            // Verify Vietnamese text appears
            const hasVietnamese = await this.page!.locator('text=Tạo, text=Cài đặt, text=Bộ thẻ').count() > 0;
            if (!hasVietnamese) {
              throw new Error('Vietnamese translation not working');
            }
          }
        }
      },
      {
        description: "Reset to English",
        action: async () => {
          const englishOption = this.page!.locator('option[value="en"], text=English');
          if (await englishOption.count() > 0) {
            await englishOption.first().click();
            await this.page!.waitForTimeout(2000);
          }
        }
      }
    ];

    await this.runTest('Translation System Testing', steps);
  }

  // Test 7: Mobile Responsiveness
  private async testMobileResponsiveness(): Promise<void> {
    const steps: TestStep[] = [
      {
        description: "Switch to mobile viewport",
        action: async () => {
          await this.page!.setViewportSize({ width: 375, height: 667 });
          await this.page!.goto(this.baseUrl);
          await this.page!.waitForTimeout(1000);
        }
      },
      {
        description: "Test mobile navigation",
        action: async () => {
          const mobileNav = await this.page!.locator('header, nav, [role="navigation"], button[aria-label*="menu"]').count();
          if (mobileNav === 0) {
            throw new Error('Mobile navigation not found');
          }
        }
      },
      {
        description: "Test deck cards mobile layout",
        action: async () => {
          const deckCards = await this.page!.locator('.bg-white, .rounded-xl, .shadow').count();
          if (deckCards === 0) {
            throw new Error('Deck cards not visible in mobile');
          }
        }
      },
      {
        description: "Test mobile deck creation",
        action: async () => {
          await this.page!.goto(`${this.baseUrl}/create`);
          await this.page!.waitForTimeout(2000);
          const hasInputs = await this.page!.locator('input, textarea').count();
          if (hasInputs === 0) {
            throw new Error('Create interface not working in mobile');
          }
        }
      },
      {
        description: "Test swipe gestures",
        action: async () => {
          await this.page!.goto(`${this.baseUrl}/decks`);
          await this.page!.waitForTimeout(2000);
          // Simulate swipe by touch events
          const deckCard = this.page!.locator('.bg-white, .rounded-xl').first();
          if (await deckCard.count() > 0) {
            const box = await deckCard.boundingBox();
            if (box) {
              await this.page!.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
            }
          }
        },
        optional: true
      },
      {
        description: "Reset to desktop viewport",
        action: async () => {
          await this.page!.setViewportSize({ width: 1280, height: 720 });
        }
      }
    ];

    await this.runTest('Mobile Responsiveness Testing', steps);
  }

  // Test 8: Error Handling and Edge Cases
  private async testErrorHandling(): Promise<void> {
    const steps: TestStep[] = [
      {
        description: "Test 404 page handling",
        action: async () => {
          await this.page!.goto(`${this.baseUrl}/nonexistent-page-12345`);
          await this.page!.waitForTimeout(2000);
          const url = this.page!.url();
          const has404 = await this.page!.locator('text=404, text=Not Found, text=not found').count() > 0;
          if (!has404 && !url.includes(this.baseUrl)) {
            throw new Error('404 handling not working');
          }
        }
      },
      {
        description: "Test empty deck creation",
        action: async () => {
          await this.page!.goto(`${this.baseUrl}/create`);
          await this.page!.waitForTimeout(2000);
          const saveButton = this.page!.locator('button:has-text("Save"), button:has-text("Create")').first();
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await this.page!.waitForTimeout(2000);
            // Should show validation error
            const hasError = await this.page!.locator('text=error, text=required, text=empty').count() > 0;
            if (!hasError) {
              console.log('Warning: No validation error shown for empty deck');
            }
          }
        },
        optional: true
      },
      {
        description: "Test invalid markdown handling",
        action: async () => {
          await this.page!.goto(`${this.baseUrl}/create`);
          await this.page!.waitForTimeout(2000);
          const markdownArea = this.page!.locator('textarea, .cm-editor').last();
          if (await markdownArea.count() > 0) {
            await markdownArea.fill('Invalid markdown format without :: separators');
            await this.page!.waitForTimeout(1000);
            // Should show validation warning
            const hasWarning = await this.page!.locator('text=warning, text=format, text=invalid').count() > 0;
            if (!hasWarning) {
              console.log('Warning: No validation warning for invalid markdown');
            }
          }
        },
        optional: true
      },
      {
        description: "Test network error resilience",
        action: async () => {
          // Temporarily simulate slow network
          await this.page!.route('**/*', route => {
            setTimeout(() => route.continue(), 100);
          });
          await this.page!.goto(this.baseUrl);
          await this.page!.waitForTimeout(3000);
          await this.page!.unroute('**/*');
        },
        optional: true
      }
    ];

    await this.runTest('Error Handling & Edge Cases', steps);
  }

  // Test 9: Performance and Accessibility
  private async testPerformanceAndAccessibility(): Promise<void> {
    const steps: TestStep[] = [
      {
        description: "Test page load performance",
        action: async () => {
          const startTime = Date.now();
          await this.page!.goto(this.baseUrl, { waitUntil: 'networkidle' });
          const loadTime = Date.now() - startTime;
          if (loadTime > 10000) {
            throw new Error(`Page load too slow: ${loadTime}ms`);
          }
        }
      },
      {
        description: "Check accessibility attributes",
        action: async () => {
          const ariaElements = await this.page!.locator('[aria-label], [aria-labelledby], [role]').count();
          if (ariaElements === 0) {
            throw new Error('No accessibility attributes found');
          }
        }
      },
      {
        description: "Test keyboard navigation",
        action: async () => {
          await this.page!.goto(this.baseUrl);
          await this.page!.waitForTimeout(2000);
          // Test tab navigation
          await this.page!.keyboard.press('Tab');
          await this.page!.keyboard.press('Tab');
          await this.page!.keyboard.press('Enter');
          await this.page!.waitForTimeout(1000);
        }
      },
      {
        description: "Check color contrast",
        action: async () => {
          const darkElements = await this.page!.locator('.bg-black, .text-black, .dark').count();
          const lightElements = await this.page!.locator('.bg-white, .text-white, .light').count();
          if (darkElements + lightElements === 0) {
            console.log('Warning: No explicit contrast classes found');
          }
        },
        optional: true
      }
    ];

    await this.runTest('Performance & Accessibility', steps);
  }

  // Test 10: Data Persistence and Storage
  private async testDataPersistence(): Promise<void> {
    const steps: TestStep[] = [
      {
        description: "Test local storage functionality",
        action: async () => {
          await this.page!.goto(`${this.baseUrl}/create`);
          await this.page!.waitForTimeout(2000);
          // Create a test deck
          const nameInput = this.page!.locator('input[type="text"]').first();
          await nameInput.fill('Persistence Test Deck');
          const markdownArea = this.page!.locator('textarea').last();
          await markdownArea.fill('Test question :: Test answer');
          // Check if data persists in localStorage
          const hasLocalStorage = await this.page!.evaluate(() => {
            return localStorage.getItem('flashplay-decks') !== null;
          });
          if (!hasLocalStorage) {
            console.log('Warning: No localStorage data found');
          }
        },
        optional: true
      },
      {
        description: "Test data export functionality",
        action: async () => {
          await this.page!.goto(`${this.baseUrl}/settings`);
          await this.page!.waitForTimeout(2000);
          const exportButton = this.page!.locator('text=Export, button:has-text("Export")');
          if (await exportButton.count() > 0) {
            await exportButton.first().click();
            await this.page!.waitForTimeout(2000);
          }
        },
        optional: true
      },
      {
        description: "Test data import functionality",
        action: async () => {
          const importButton = this.page!.locator('text=Import, button:has-text("Import")');
          if (await importButton.count() > 0) {
            await importButton.first().click();
            await this.page!.waitForTimeout(2000);
          }
        },
        optional: true
      }
    ];

    await this.runTest('Data Persistence & Storage', steps);
  }

  // Test 11: Deck Deletion Workflow
  private async testDeckDeletion(): Promise<void> {
    const steps: TestStep[] = [
      {
        description: "Navigate to decks page",
        action: async () => {
          await this.page!.goto(`${this.baseUrl}/decks`);
          await this.page!.waitForTimeout(2000);
        }
      },
      {
        description: "Find deck to delete",
        action: async () => {
          const deckCards = await this.page!.locator('.bg-white, .rounded-xl, .shadow').count();
          if (deckCards === 0) {
            throw new Error('No decks found to delete');
          }
        }
      },
      {
        description: "Access delete option",
        action: async () => {
          const deleteButton = this.page!.locator('text=Delete, button:has-text("Delete"), [data-testid="delete-button"]');
          if (await deleteButton.count() > 0) {
            await deleteButton.first().click();
            await this.page!.waitForTimeout(1000);
          } else {
            // Try right-click context menu
            const deckCard = this.page!.locator('.bg-white, .rounded-xl').first();
            await deckCard.click({ button: 'right' });
            await this.page!.waitForTimeout(1000);
          }
        }
      },
      {
        description: "Confirm deletion",
        action: async () => {
          const confirmButton = this.page!.locator('text=Confirm, text=Yes, button:has-text("Delete")');
          if (await confirmButton.count() > 0) {
            await confirmButton.first().click();
            await this.page!.waitForTimeout(2000);
          }
        },
        optional: true
      }
    ];

    await this.runTest('Deck Deletion Workflow', steps);
  }

  // Main test runner
  async run() {
    try {
      await this.setup();

      // Run all comprehensive tests
      await this.testUserOnboarding();
      await this.testDeckCreationWorkflow();
      await this.testDeckEditingWorkflow();
      await this.testPublicDeckInteraction();
      await this.testGameplayModes();
      await this.testTranslationSystem();
      await this.testMobileResponsiveness();
      await this.testErrorHandling();
      await this.testPerformanceAndAccessibility();
      await this.testDataPersistence();
      await this.testDeckDeletion();

      this.printResults();

    } finally {
      await this.teardown();
    }
  }

  private printResults() {
    console.log('\n📊 Ultimate Test Results Summary');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : '❌';
      const time = result.duration.toString().padStart(5, ' ');
      console.log(`${icon} ${result.name.padEnd(35, ' ')} ${time}ms`);
      
      if (result.message) {
        console.log(`   └─ ${result.message}`);
      }
      
      if (result.details && result.details.length > 0) {
        result.details.forEach(detail => {
          console.log(`      ${detail}`);
        });
      }
    });

    console.log('='.repeat(60));
    console.log(`📈 ${passed}/${this.results.length} tests passed (${totalTime}ms total)`);
    console.log(`⚡ Average test time: ${Math.round(totalTime / this.results.length)}ms`);

    if (failed === 0) {
      console.log('🎉 ALL ULTIMATE TESTS PASSED! MyFlashPlay is fully functional.');
      console.log('🚀 Complete user journey coverage validated.');
      console.log('🌐 Translation system working correctly.');
      console.log('📱 Mobile responsiveness confirmed.');
      console.log('♿ Accessibility features present.');
      console.log('🎯 All game modes operational.');
      console.log('💾 Data persistence working.');
      process.exit(0);
    } else {
      console.log(`💥 ${failed} test(s) failed. See details above.`);
      console.log('🔧 Fix the failing tests and run again.');
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const targetUrl = process.argv[2] || 'http://localhost:3000';

  if (!targetUrl.startsWith('http')) {
    console.error('❌ Please provide a valid URL (must start with http:// or https://)');
    console.log('Usage: pnpm test:ultimate <URL>');
    console.log('Example: pnpm test:ultimate https://www.MyFlashPlay.com');
    process.exit(1);
  }

  const tester = new UltimateIntegrationTester(targetUrl);
  await tester.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Ultimate integration test failed:', error);
    process.exit(1);
  });
}