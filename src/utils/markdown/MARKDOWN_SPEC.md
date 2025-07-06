# FlashPlay Markdown Specification

## Overview

FlashPlay uses a simplified markdown format for creating flashcards. This document defines the complete specification for the markdown format.

## Basic Format

### Simple Question & Answer
```
Question :: Answer
```

Example:
```
What is 2 + 2? :: 4
Capital of France? :: Paris
```

### True/False Questions
```
Statement :: true
Statement :: false
```

Example:
```
The sun is a star :: true
Fish can fly :: false
```

### Multiple Choice Questions
```
Question
- Option 1
- Option 2
- Option 3
- Option 4
> Correct Answer
```

Example:
```
What is the largest planet?
- Earth
- Jupiter
- Mars
- Venus
> Jupiter
```

## Advanced Features

### Categories
Use markdown headers to organize cards into categories:

```
# Main Category

## Subcategory

Question :: Answer
```

### Metadata
Add metadata using HTML comments:

```
Question :: Answer
<!-- Hint: This is a hint -->
<!-- Explanation: This explains the answer -->
<!-- Difficulty: easy|medium|hard -->
<!-- Tags: tag1, tag2, tag3 -->
```

### Code Blocks
Support for code in questions/answers:

```
What does this code do?
```python
print("Hello World")
```
:: It prints "Hello World"
```

### Images
Support for images (URLs):

```
![Image description](https://example.com/image.jpg) :: Answer
```

### LaTeX Math
Support for mathematical expressions:

```
What is $\int_0^1 x^2 dx$? :: $\frac{1}{3}$
```

## Internationalization

Full UTF-8 support for any language:

```
Số 5 + 3 = ? :: 8
什么是水? :: H2O
¿Cuál es la capital de España? :: Madrid
```

## Import/Export Format

### Deck Header
```
---
title: Deck Name
description: Deck description
emoji: 📚
tags: [tag1, tag2]
difficulty: beginner|intermediate|advanced
---
```

### Full Example
```
---
title: Elementary Math
description: Basic math for kids
emoji: 🔢
tags: [math, elementary]
difficulty: beginner
---

# Addition

2 + 2 :: 4
5 + 3 :: 8

# Subtraction

10 - 5 :: 5
8 - 3 :: 5

# True/False

2 + 2 equals 5 :: false
10 is greater than 5 :: true

# Multiple Choice

What is 3 × 4?
- 10
- 11
- 12
- 13
> 12
```

## Parsing Rules

1. **Line-based parsing**: Each line is processed independently
2. **Trim whitespace**: Leading/trailing whitespace is removed
3. **Empty lines**: Used to separate different card types
4. **Headers**: Lines starting with # or ## define categories
5. **Comments**: HTML comments are parsed for metadata
6. **Special characters**: :: is the separator, > marks correct answer
7. **Flexible format**: Parser should be forgiving of minor format variations