# MyFlashPlay Deck Contributions

Welcome to the MyFlashPlay deck contribution system! This directory contains all public flashcard decks organized by author/contributor for easy collaboration.

## 📁 Directory Structure

```
src/data/decks/
├── myflashplay-team/          # Official MyFlashPlay decks
│   ├── english-vietnamese/    # English-Vietnamese language learning
│   ├── vietnamese/            # Vietnamese-only educational content
│   └── world-knowledge/       # General world knowledge
├── contributors/              # Community contributions
│   ├── _template/             # Template files for new contributors
│   │   └── deck-template.ts   # Copy this to create new decks
│   ├── username1/             # Individual contributor folders
│   ├── username2/
│   └── ...
└── index.ts                   # Main aggregation file (auto-updated)
```

## 🚀 Contributing a New Deck

### Step 1: Create Your Contributor Folder
If this is your first contribution, create a folder with your GitHub username:
```
contributors/[your-github-username]/
```

### Step 2: Copy the Template
Copy the template file and rename it:
```bash
cp contributors/_template/deck-template.ts contributors/[your-username]/[your-deck-id].ts
```

### Step 3: Edit Your Deck
Open your new file and customize:
- **ID**: Must be unique and start with `public-`
- **Name**: Descriptive title with emoji (optional)
- **Author**: Your name or username
- **Tags**: Relevant categories for searchability
- **Markdown**: Your flashcard content

### Step 4: Follow the Markdown Format

#### Basic Flashcards
```markdown
Question :: Answer
Capital of France :: Paris
What is 2 + 2? :: 4
```

#### True/False Questions
```markdown
The sun is a star :: true
Fish can fly :: false
```

#### Multiple Choice Questions
```markdown
What is the largest planet?
- Earth
- Jupiter
- Mars
- Venus
> Jupiter
```

#### Organize with Sections
```markdown
# Math Section
What is 5 × 3? :: 15
What is 10 ÷ 2? :: 5

# Science Section
What is H2O? :: Water
```

### Step 5: Add Your Export
Add your deck export to `contributors/index.ts`:
```typescript
export { yourDeckVariableName } from './[your-username]/[your-deck-id]';
```

### Step 6: Test Your Deck
1. Run `pnpm build` to test
2. Test your deck in the app

### Step 7: Submit Your Pull Request
1. Fork the repository
2. Create a branch for your deck
3. Submit a pull request with your changes

## 📝 Content Guidelines

### Quality Standards
- ✅ Educational value - content should teach something useful
- ✅ Accuracy - verify all facts and answers
- ✅ Clear language - questions should be easy to understand
- ✅ Appropriate difficulty - match your stated difficulty level
- ✅ Good organization - use sections to group related content

### What Makes a Good Deck
- **Focused topic** - stick to one subject area
- **Progressive difficulty** - start easy, build complexity
- **Varied question types** - mix flashcards, multiple choice, true/false
- **Cultural sensitivity** - respect all cultures and viewpoints
- **Original content** - create your own questions or use public domain sources

### Deck Size Recommendations
- **Small deck**: 10-25 cards (focused topic)
- **Medium deck**: 25-50 cards (broader topic)
- **Large deck**: 50+ cards (comprehensive subject)

## 🏷️ Tag Guidelines

Use lowercase, descriptive tags to help users find your content:

### Language Tags
- `english`, `vietnamese`, `spanish`, `french`, etc.
- `translation`, `vocabulary`, `grammar`

### Subject Tags
- `math`, `science`, `history`, `geography`
- `literature`, `art`, `music`, `sports`
- `technology`, `business`, `health`

### Difficulty Tags
- `beginner`, `intermediate`, `advanced`
- `elementary`, `middle-school`, `high-school`, `college`

### Format Tags
- `multiple-choice`, `true-false`, `flashcards`
- `mixed-practice`, `quiz`, `review`

## 🔧 Technical Details

### File Naming Convention
- Use kebab-case: `public-your-topic-name.ts`
- Include `public-` prefix for all public decks
- Be descriptive but concise

### Variable Naming
- Use camelCase for the exported variable
- Match the general pattern: `publicYourTopicName`

### Markdown Processing
The app uses a custom markdown parser that supports:
- Basic flashcards with `::`
- Multiple choice with `-` for options and `>` for answers
- True/false with `:: true` or `:: false`
- Section headers with `#`
- UTF-8 character support for international content

## 🌍 Internationalization

We welcome content in all languages! When creating non-English content:
- Use proper UTF-8 encoding
- Include language tags
- Consider adding English translations for broader accessibility
- Test special characters thoroughly

## 📊 Current Deck Statistics

### MyFlashPlay Team Decks
- **English-Vietnamese**: 23 decks covering basic to advanced vocabulary
- **Vietnamese**: 15 decks covering science, culture, and education
- **World Knowledge**: 7 decks covering general knowledge topics

### Total Cards
- **2000+ flashcards** covering diverse topics
- **Multiple question types** for varied learning
- **UTF-8 support** for international content

## 🤝 Community Guidelines

### Before Contributing
1. Search existing decks to avoid duplicates
2. Review the template and examples
3. Test your content thoroughly
4. Follow the code style and naming conventions

### Code Review Process
All contributions go through review for:
- Content accuracy and quality
- Technical compliance
- Code style consistency
- No offensive or inappropriate content

### Getting Help
- Check existing decks for examples
- Review the template file
- Open an issue for questions
- Join our community discussions

## 🔄 Maintenance

### Updating the Index
When adding new decks, you only need to update `contributors/index.ts`:
1. Add export statement for your deck
2. The main `index.ts` automatically aggregates all exports
3. No manual maintenance of the main index file required

### Future Automation
We're working on automating the index.ts updates to make contributions even easier!

---

Happy contributing! 🎉 Your educational content helps learners around the world.