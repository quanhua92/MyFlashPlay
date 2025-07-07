// Template for creating new deck contributions
// 
// Instructions:
// 1. Copy this file to your contributor folder: contributors/[your-username]/[your-deck-id].ts
// 2. Replace all template values with your content
// 3. Use a unique deck ID that starts with "public-" followed by descriptive name
// 4. Follow the markdown format guidelines in the README.md

export const yourDeckVariableName = {
  // Unique identifier - must start with "public-" and be URL-safe
  id: 'public-your-deck-name',
  
  // Display name with emoji (optional but recommended)
  name: '🎯 Your Deck Title',
  
  // Brief description of what this deck teaches
  description: 'A brief description of what students will learn from this deck',
  
  // Your name or username
  author: 'Your Name',
  
  // Difficulty: 'easy', 'medium', 'hard'
  difficulty: 'easy',
  
  // Tags for categorization - use lowercase, descriptive keywords
  tags: ['category1', 'category2', 'language', 'topic'],
  
  // Markdown content using the :: format for flashcards
  markdown: `# Section Title
Question or front side :: Answer or back side
Another question :: Another answer

# True/False Questions (optional)
The sun is a star :: true
Fish can fly :: false

# Multiple Choice Questions (optional)
What is the largest planet?
- Earth
- Jupiter
- Mars
- Venus
> Jupiter

# Tips for writing good content:
# - Keep questions clear and concise
# - Use :: to separate question from answer
# - Group related content under section headers (#)
# - For multiple choice, list options with - and mark correct answer with >
# - For true/false, use :: true or :: false
# - Test your content before submitting`
};