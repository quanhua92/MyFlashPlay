# FlashPlay Markdown Format Guide

## Overview
FlashPlay uses a flexible Markdown format to create flashcards. The parser intelligently converts different Markdown structures into interactive flashcards and quiz questions.

## Basic Format

### Simple Q&A Format
```markdown
# Math Basics

- What is 2 + 2? :: 4
- What is 5 × 3? :: 15
- What is 10 ÷ 2? :: 5
```

### Detailed Format with Categories
```markdown
# Science Flashcards

## Animals

- What is the largest mammal? :: The blue whale
- How many legs does a spider have? :: Eight legs
- What do pandas eat? :: Bamboo

## Plants

- What process do plants use to make food? :: Photosynthesis
- What gives plants their green color? :: Chlorophyll
- What do plants release during photosynthesis? :: Oxygen
```

### Multiple Choice Format
```markdown
# Geography Quiz

- What is the capital of France?
  * London
  * Berlin
  * Paris [correct]
  * Madrid

- Which ocean is the largest?
  * Atlantic Ocean
  * Indian Ocean
  * Arctic Ocean
  * Pacific Ocean [correct]
```

### True/False Format
```markdown
# History Facts

- The Great Wall of China is visible from space :: false
- George Washington was the first U.S. President :: true
- The pyramids were built by aliens :: false
```

### Advanced Format with Hints and Explanations
```markdown
# Advanced Math

- What is the Pythagorean theorem?
  Front: a² + b² = ?
  Back: c²
  Hint: It relates to right triangles
  Explanation: In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides
  Difficulty: medium
  Tags: geometry, theorems

- Solve: 3x + 7 = 22
  Front: Find the value of x
  Back: x = 5
  Hint: First subtract 7 from both sides
  Difficulty: easy
  Tags: algebra, equations
```

### Code Block Support
```markdown
# Programming Concepts

- What does this Python code print?
  ```python
  for i in range(3):
      print(i)
  ```
  :: Prints: 0, 1, 2

- What is the time complexity?
  ```javascript
  for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
          console.log(i, j);
      }
  }
  ```
  :: O(n²)
```

### Nested Lists for Related Information
```markdown
# Solar System

- Planets in order from the Sun:
  1. Mercury
  2. Venus
  3. Earth
  4. Mars
  5. Jupiter
  6. Saturn
  7. Uranus
  8. Neptune
  :: The eight planets of our solar system

- Earth Facts:
  - Diameter: 12,742 km
  - Distance from Sun: 150 million km
  - Number of moons: 1
  - Orbital period: 365.25 days
  :: Key facts about planet Earth
```

## Parser Logic Design

### Parsing Rules

1. **Headers (#)**: Create categories/sections
2. **Bullet Points (-)**: Define flashcard items
3. **Double Colon (::)**: Separates question from answer
4. **Asterisk Lists (*)**: Multiple choice options
5. **[correct] tag**: Marks correct answer in multiple choice
6. **Code Blocks**: Preserved with syntax highlighting
7. **Nested Structure**: Creates hierarchical organization

### Parser Implementation Strategy

```typescript
interface ParsedCard {
  id: string;
  type: 'simple' | 'multiple-choice' | 'true-false' | 'code';
  category?: string;
  subcategory?: string;
  front: string;
  back: string;
  options?: string[];
  correctOption?: number;
  hint?: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  codeBlock?: {
    language: string;
    code: string;
  };
}

class MarkdownParser {
  parse(markdown: string): ParsedCard[] {
    // 1. Split into sections by headers
    // 2. Process each section based on content type
    // 3. Extract metadata (hints, difficulty, tags)
    // 4. Generate unique IDs
    // 5. Validate and return cards
  }
  
  private detectCardType(content: string): CardType {
    // Logic to determine card type based on format
  }
  
  private parseSimpleCard(line: string): ParsedCard {
    // Parse "question :: answer" format
  }
  
  private parseMultipleChoice(lines: string[]): ParsedCard {
    // Parse question with * options
  }
  
  private extractMetadata(content: string): Metadata {
    // Extract hints, difficulty, tags, etc.
  }
}
```

## Sample Flashcard Decks

### Elementary Math Deck
```markdown
# Elementary Math

## Addition

- 1 + 1 = ? :: 2
- 2 + 3 = ? :: 5
- 4 + 4 = ? :: 8
- 5 + 5 = ? :: 10
- 6 + 7 = ? :: 13

## Subtraction

- 10 - 5 = ? :: 5
- 8 - 3 = ? :: 5
- 7 - 4 = ? :: 3
- 9 - 6 = ? :: 3
- 5 - 2 = ? :: 3

## Word Problems

- Tom has 3 apples. Sarah gives him 2 more. How many apples does Tom have now?
  * 4 apples
  * 5 apples [correct]
  * 6 apples
  * 7 apples

- There are 8 birds on a tree. 3 fly away. How many are left? :: 5 birds
```

### Science Vocabulary Deck
```markdown
# Science Vocabulary

## Biology Terms

- Photosynthesis
  Front: The process by which plants make their own food
  Back: Using sunlight, water, and carbon dioxide to create glucose and oxygen
  Difficulty: medium
  Tags: plants, processes

- Cell
  Front: The basic unit of life
  Back: The smallest unit that can carry out all life processes
  Difficulty: easy
  Tags: biology, basics

- Ecosystem
  Front: A community of living and non-living things
  Back: All organisms in an area interacting with each other and their environment
  Difficulty: medium
  Tags: ecology, systems

## Chemistry Terms

- Atom :: The smallest unit of matter that retains properties of an element
- Molecule :: Two or more atoms bonded together
- Element :: A pure substance made of only one type of atom
```

### History Timeline Deck
```markdown
# World History Timeline

## Ancient Civilizations

- When did the Egyptian pyramids get built? :: Around 2500 BCE
- When was the Roman Empire founded? :: 27 BCE
- When did the Maya civilization peak? :: 250-900 CE

## Modern History

- When did World War I begin?
  * 1912
  * 1914 [correct]
  * 1916
  * 1918

- The Declaration of Independence was signed in :: 1776
- The Berlin Wall fell in :: 1989
```

## Import/Export Features

### Import Options
1. Paste Markdown directly
2. Upload .md file
3. Import from URL
4. Import from template library

### Export Options
1. Export as Markdown file
2. Export as JSON
3. Export as PDF study guide
4. Share link (using base64 encoding)