export interface Template {
  id: string;
  name: string;
  description: string;
  emoji: string;
  complexity: 'basic' | 'intermediate' | 'advanced';
  deckName: string;
  deckDescription: string;
  markdown: string;
}

export const templates: Template[] = [
  {
    id: 'basic-qa',
    name: 'Basic Q&A',
    description: 'Simple question and answer flashcards',
    emoji: '❓',
    complexity: 'basic',
    deckName: 'My First Flashcards',
    deckDescription: 'Simple question and answer cards',
    markdown: `# ❓ My First Flashcards

Simple question and answer cards

## General

- What is the capital of France? :: Paris
- What is 2 + 2? :: 4
- What color do you get when you mix red and blue? :: Purple`
  },
  {
    id: 'vocabulary',
    name: 'Vocabulary Builder',
    description: 'Language learning with definitions',
    emoji: '📖',
    complexity: 'basic',
    deckName: 'Vocabulary Practice',
    deckDescription: 'Learn new words and their meanings',
    markdown: `# 📖 Vocabulary Practice

Learn new words and their meanings

## New Words

- What does "serendipity" mean? :: A pleasant surprise or fortunate accident
- What does "ubiquitous" mean? :: Present everywhere; widespread
- What does "ephemeral" mean? :: Lasting for a very short time`
  },
  {
    id: 'categorized',
    name: 'Categorized Learning',
    description: 'Cards organized by topics with categories',
    emoji: '📂',
    complexity: 'intermediate',
    deckName: 'Science Fundamentals',
    deckDescription: 'Basic science concepts organized by subject',
    markdown: `# 📂 Science Fundamentals

Basic science concepts organized by subject

## Biology

- What is the powerhouse of the cell? :: Mitochondria
- What is the process by which plants make food? :: Photosynthesis
- What is DNA? :: Deoxyribonucleic acid, the genetic material of organisms

## Chemistry

- What is the chemical symbol for water? :: H2O
- What is the atomic number of carbon? :: 6
- What happens when an acid and base react? :: They neutralize each other

## Physics

- What is the speed of light? :: 299,792,458 meters per second
- What is Newton's first law? :: An object at rest stays at rest unless acted upon by force
- What is the unit of electrical resistance? :: Ohm`
  },
  {
    id: 'multiple-choice',
    name: 'Multiple Choice Quiz',
    description: 'Quiz-style cards with multiple choice options',
    emoji: '✅',
    complexity: 'intermediate',
    deckName: 'History Quiz',
    deckDescription: 'Test your knowledge of world history',
    markdown: `# ✅ History Quiz

Test your knowledge of world history

## Ancient History

- Which river was essential to ancient Egyptian civilization?
  * Nile River [correct]
  * Amazon River
  * Mississippi River
  * Yangtze River

- When did the Roman Empire fall?
  * 476 CE [correct]
  * 500 CE
  * 410 CE
  * 350 CE

## Modern History

- Who wrote the Declaration of Independence?
  * Thomas Jefferson [correct]
  * John Adams
  * Benjamin Franklin
  * George Washington`
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive Study Guide',
    description: 'Advanced cards with multiple types, categories, and metadata',
    emoji: '🎓',
    complexity: 'advanced',
    deckName: 'Advanced Biology',
    deckDescription: 'Comprehensive biology study guide with multiple card types',
    markdown: `# 🎓 Advanced Biology

Comprehensive biology study guide with multiple card types

## Cell Biology

- What are the main components of a eukaryotic cell? :: Nucleus, cytoplasm, cell membrane, organelles
<!-- Hint: Think about what makes eukaryotic cells different from prokaryotic cells -->
<!-- Explanation: Eukaryotic cells have a membrane-bound nucleus and specialized organelles -->

- Which organelle is responsible for protein synthesis?
  * Ribosome [correct]
  * Mitochondria
  * Endoplasmic reticulum
  * Golgi apparatus
<!-- Hint: These structures can be free-floating or attached to membranes -->

## Genetics

- What is the central dogma of molecular biology? :: DNA → RNA → Protein
<!-- Explanation: This describes the flow of genetic information in cells -->

- True or false: All mutations are harmful :: false
<!-- Explanation: Some mutations are beneficial, some are neutral, and some are harmful -->

## Evolution

- What is natural selection? :: The process by which organisms with favorable traits survive and reproduce more successfully
<!-- Hint: Think about "survival of the fittest" -->
<!-- Explanation: This is the main mechanism of evolution proposed by Charles Darwin -->

- Which scientist is most associated with the theory of evolution?
  * Charles Darwin [correct]
  * Gregor Mendel
  * Louis Pasteur
  * Alexander Fleming`
  },
  {
    id: 'language-learning',
    name: 'Language Learning',
    description: 'Foreign language cards with pronunciation and context',
    emoji: '🌍',
    complexity: 'intermediate',
    deckName: 'Spanish Basics',
    deckDescription: 'Essential Spanish words and phrases',
    markdown: `# 🌍 Spanish Basics

Essential Spanish words and phrases

## Greetings

- How do you say "Hello" in Spanish? :: Hola
<!-- Hint: Pronounced "OH-lah" -->

- How do you say "Good morning" in Spanish? :: Buenos días
<!-- Hint: Literally means "good days" -->

- How do you say "Thank you" in Spanish? :: Gracias
<!-- Explanation: One of the most important words to know! -->

## Numbers

- How do you say "one" in Spanish? :: uno
- How do you say "two" in Spanish? :: dos
- How do you say "three" in Spanish? :: tres

## Common Phrases

- How do you say "Where is the bathroom?" in Spanish? :: ¿Dónde está el baño?
<!-- Hint: Very useful phrase for travelers! -->
<!-- Explanation: "Dónde" = where, "está" = is, "el baño" = the bathroom -->`
  },
  {
    id: 'programming',
    name: 'Programming Concepts',
    description: 'Computer science and programming fundamentals',
    emoji: '💻',
    complexity: 'advanced',
    deckName: 'JavaScript Fundamentals',
    deckDescription: 'Core JavaScript concepts for web development',
    markdown: `# 💻 JavaScript Fundamentals

Core JavaScript concepts for web development

## Data Types

- What are the primitive data types in JavaScript? :: string, number, boolean, null, undefined, symbol, bigint
<!-- Explanation: These are the basic building blocks of JavaScript data -->

- What is the difference between null and undefined? :: null is an intentional absence of value, undefined means a variable has been declared but not assigned
<!-- Hint: One is intentional, the other is accidental -->

## Functions

- What is a closure in JavaScript? :: A function that has access to variables in its outer scope even after the outer function returns
<!-- Explanation: This is a powerful feature that enables many JavaScript patterns -->

- What is the difference between function declaration and function expression?
  * Declaration is hoisted, expression is not [correct]
  * Expression is hoisted, declaration is not
  * Both are hoisted the same way
  * Neither is hoisted
<!-- Hint: Think about when the function becomes available -->

## Objects and Arrays

- How do you add an element to the end of an array? :: array.push(element)
<!-- Explanation: push() modifies the original array and returns the new length -->

- What is destructuring in JavaScript? :: A syntax for extracting values from arrays or objects into variables
<!-- Hint: Uses curly braces {} for objects and square brackets [] for arrays -->`
  }
];

export const getTemplateByComplexity = (complexity: 'basic' | 'intermediate' | 'advanced') => {
  return templates.filter(template => template.complexity === complexity);
};

export const getTemplateById = (id: string) => {
  return templates.find(template => template.id === id);
};