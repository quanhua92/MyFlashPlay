# Stage 5: Forms, Deck Management & Game Mode Translations

## Objective
Apply translations to form components, deck management interfaces, and game modes to complete the core user interaction areas of the application.

## Overview
This stage focuses on translating the more complex interactive elements where users create content, manage decks, and play games. These areas require careful attention to form labels, validation messages, and game feedback.

## Key Design Decisions

### Form Translation Strategy
- **Label + Placeholder Separation**: Both field labels and placeholder text are translated
- **Validation Message Integration**: Error messages use translated strings
- **Form Context Preservation**: Maintain existing form validation and submission logic
- **Accessibility First**: Ensure form labels remain properly associated

### Game Mode Translation Approach
- **Immediate Feedback**: Game actions and results are instantly translated
- **State Preservation**: Game logic remains unchanged, only UI text is translated
- **Consistent Terminology**: Game mode names and actions use consistent translation keys
- **Performance Awareness**: Translations don't impact game performance

## Files to Create/Modify

### 1. Update Create Page (`src/pages/CreatePage.tsx`)

```diff
@@ -1,6 +1,7 @@
 import { useState } from 'react';
 import { useNavigate } from '@tanstack/react-router';
 import { motion } from 'framer-motion';
+import { useTranslation } from '../i18n';
 import { useDecks } from '../hooks/useDecks';
 import { Button } from '../components/ui/Button';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
@@ -11,6 +12,7 @@ import { BookOpenIcon, FileTextIcon, EyeIcon, EyeOffIcon } from 'lucide-react';

 export function CreatePage() {
   const navigate = useNavigate();
+  const t = useTranslation();
   const { createDeck } = useDecks();
   
   const [deckName, setDeckName] = useState('');
@@ -19,6 +21,7 @@ export function CreatePage() {
   const [isPublic, setIsPublic] = useState(false);
   const [isCreating, setIsCreating] = useState(false);
   const [showGuide, setShowGuide] = useState(false);
+  const [errors, setErrors] = useState<Record<string, string>>({});

   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
+    setErrors({});
+
+    // Validation
+    const newErrors: Record<string, string> = {};
+    if (!deckName.trim()) {
+      newErrors.deckName = t('errors.deckNameRequired');
+    }
+    if (!content.trim()) {
+      newErrors.content = t('errors.contentRequired');
+    }
+
+    if (Object.keys(newErrors).length > 0) {
+      setErrors(newErrors);
+      return;
+    }
+
     setIsCreating(true);
     
     try {
       await createDeck({
         name: deckName,
         description,
         content,
         isPublic,
       });
       
       navigate({ to: '/decks' });
     } catch (error) {
+      setErrors({ submit: t('errors.saveError') });
       console.error('Failed to create deck:', error);
     } finally {
       setIsCreating(false);
     }
   };

   return (
     <div className="container mx-auto px-4 py-8 max-w-4xl">
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.6 }}
       >
-        <h1 className="text-3xl font-bold mb-8 text-center">Create New Deck</h1>
+        <h1 className="text-3xl font-bold mb-8 text-center">{t('create.title')}</h1>

         <div className="grid lg:grid-cols-2 gap-8">
           {/* Create Form */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center space-x-2">
                 <BookOpenIcon className="w-5 h-5" />
-                <span>Deck Details</span>
+                <span>{t('create.title')}</span>
               </CardTitle>
             </CardHeader>
             <CardContent>
               <form onSubmit={handleSubmit} className="space-y-6">
                 {/* Deck Name */}
                 <div>
-                  <label htmlFor="deck-name" className="block text-sm font-medium text-foreground mb-2">
-                    Deck Name
+                  <label htmlFor="deck-name" className="block text-sm font-medium text-foreground mb-2 required">
+                    {t('create.deckNameLabel')}
                   </label>
                   <input
                     id="deck-name"
                     type="text"
                     value={deckName}
                     onChange={(e) => setDeckName(e.target.value)}
-                    placeholder="Enter a name for your deck"
+                    placeholder={t('create.deckNamePlaceholder')}
                     className={`
                       w-full px-4 py-3 border rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                       bg-background text-foreground
+                      ${errors.deckName ? 'border-destructive' : 'border-border'}
                     `}
                     required
+                    aria-describedby={errors.deckName ? 'deck-name-error' : undefined}
                   />
+                  {errors.deckName && (
+                    <p id="deck-name-error" className="mt-1 text-sm text-destructive">
+                      {errors.deckName}
+                    </p>
+                  )}
                 </div>

                 {/* Description */}
                 <div>
                   <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
-                    Description (Optional)
+                    {t('create.descriptionLabel')}
                   </label>
                   <input
                     id="description"
                     type="text"
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
-                    placeholder="Describe what this deck covers"
+                    placeholder={t('create.descriptionPlaceholder')}
                     className="w-full px-4 py-3 border border-border rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                       bg-background text-foreground"
                   />
                 </div>

                 {/* Content */}
                 <div>
-                  <label htmlFor="content" className="block text-sm font-medium text-foreground mb-2">
-                    Flashcard Content
+                  <label htmlFor="content" className="block text-sm font-medium text-foreground mb-2 required">
+                    {t('create.contentLabel')}
                   </label>
                   <textarea
                     id="content"
                     value={content}
                     onChange={(e) => setContent(e.target.value)}
-                    placeholder="Question 1 :: Answer 1&#10;Question 2 :: Answer 2"
+                    placeholder={t('create.contentPlaceholder')}
                     rows={8}
                     className={`
                       w-full px-4 py-3 border rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                       bg-background text-foreground resize-y
+                      ${errors.content ? 'border-destructive' : 'border-border'}
                     `}
                     required
+                    aria-describedby={errors.content ? 'content-error' : undefined}
                   />
+                  {errors.content && (
+                    <p id="content-error" className="mt-1 text-sm text-destructive">
+                      {errors.content}
+                    </p>
+                  )}
                 </div>

                 {/* Visibility */}
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-3">
-                    Visibility
+                    {t('create.visibilityLabel')}
                   </label>
                   <div className="flex space-x-4">
                     <label className="flex items-center cursor-pointer">
                       <input
                         type="radio"
                         name="visibility"
                         checked={isPublic}
                         onChange={() => setIsPublic(true)}
                         className="mr-2"
                       />
-                      <EyeIcon className="w-4 h-4 mr-1" />
-                      Public
+                      <EyeIcon className="w-4 h-4 mr-2" />
+                      {t('create.public')}
                     </label>
                     <label className="flex items-center cursor-pointer">
                       <input
                         type="radio"
                         name="visibility"
                         checked={!isPublic}
                         onChange={() => setIsPublic(false)}
                         className="mr-2"
                       />
-                      <EyeOffIcon className="w-4 h-4 mr-1" />
-                      Private
+                      <EyeOffIcon className="w-4 h-4 mr-2" />
+                      {t('create.private')}
                     </label>
                   </div>
                 </div>

+                {/* Submit Error */}
+                {errors.submit && (
+                  <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
+                    <p className="text-sm text-destructive">{errors.submit}</p>
+                  </div>
+                )}

                 {/* Submit Button */}
                 <Button 
                   type="submit" 
                   disabled={isCreating}
                   className="w-full"
                 >
                   {isCreating ? (
                     <div className="flex items-center space-x-2">
                       <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
-                      <span>Creating...</span>
+                      <span>{t('common.loading')}</span>
                     </div>
                   ) : (
-                    'Create Deck'
+                    t('create.createButton')
                   )}
                 </Button>
               </form>
             </CardContent>
           </Card>

           {/* Markdown Guide */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                   <FileTextIcon className="w-5 h-5" />
-                  <span>Markdown Guide</span>
+                  <span>{t('create.markdownGuideTitle')}</span>
                 </div>
                 <Button
                   type="button"
                   variant="ghost"
                   size="sm"
                   onClick={() => setShowGuide(!showGuide)}
                 >
                   {showGuide ? 'Hide' : 'Show'}
                 </Button>
               </CardTitle>
             </CardHeader>
             {showGuide && (
               <CardContent>
                 <div className="space-y-4">
-                  <div>
-                    <h4 className="font-semibold text-foreground mb-2">Basic Format</h4>
-                    <p className="text-sm text-muted-foreground mb-2">
-                      Create flashcards with a simple one-line format:
-                    </p>
-                    <code className="block bg-muted p-2 rounded text-sm">
-                      Question :: Answer
-                    </code>
-                  </div>
+                  <div>
+                    <h4 className="font-semibold text-foreground mb-2">{t('create.basicFormat')}</h4>
+                    <code className="block bg-muted p-2 rounded text-sm">
+                      {t('create.basicFormat')}
+                    </code>
+                  </div>
+                  
+                  <div>
+                    <h4 className="font-semibold text-foreground mb-2">{t('create.advancedFormat')}</h4>
+                    <p className="text-sm text-muted-foreground">
+                      {t('create.advancedFormat')}
+                    </p>
+                  </div>
                 </div>
               </CardContent>
             )}
           </Card>
         </div>
       </motion.div>
     </div>
   );
 }
```

**Explanation**: Updates the create page with comprehensive form translations, including validation error messages and accessibility improvements.

### 2. Update Decks Page (`src/pages/DecksPage.tsx`)

```diff
@@ -1,5 +1,6 @@
 import { useState } from 'react';
 import { motion } from 'framer-motion';
+import { useTranslation } from '../i18n';
 import { useDecks } from '../hooks/useDecks';
 import { DeckCard } from '../components/decks/DeckCard';
 import { Button } from '../components/ui/Button';
@@ -9,6 +10,7 @@ import { PlusIcon, BookOpenIcon, GlobeIcon } from 'lucide-react';

 export function DecksPage() {
   const { decks, isLoading } = useDecks();
+  const t = useTranslation();
   const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');

   const myDecks = decks.filter(deck => !deck.isPublic);
@@ -23,7 +25,7 @@ export function DecksPage() {
         transition={{ duration: 0.6 }}
         className="container mx-auto px-4 py-8"
       >
-        <h1 className="text-3xl font-bold text-center mb-8">Flashcard Decks</h1>
+        <h1 className="text-3xl font-bold text-center mb-8">{t('decks.title')}</h1>

         {/* Tab Navigation */}
         <div className="flex justify-center mb-8">
@@ -35,7 +37,7 @@ export function DecksPage() {
               onClick={() => setActiveTab('my')}
               className={activeTab === 'my' ? 'bg-primary text-primary-foreground' : ''}
             >
               <BookOpenIcon className="w-4 h-4 mr-2" />
-              My Decks
+              {t('decks.myDecksTitle')}
             </Button>
             <Button
               variant={activeTab === 'public' ? 'default' : 'outline'}
               onClick={() => setActiveTab('public')}
               className={activeTab === 'public' ? 'bg-primary text-primary-foreground' : ''}
             >
               <GlobeIcon className="w-4 h-4 mr-2" />
-              Public Decks
+              {t('decks.publicDecksTitle')}
             </Button>
           </div>
         </div>

         {/* Create New Deck Button */}
         <div className="text-center mb-8">
           <Button asChild size="lg">
             <Link to="/create" className="inline-flex items-center space-x-2">
               <PlusIcon className="w-5 h-5" />
-              <span>Create New Deck</span>
+              <span>{t('decks.createNewDeck')}</span>
             </Link>
           </Button>
         </div>

         {/* Deck Grid */}
         {isLoading ? (
           <div className="text-center py-12">
             <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
-            <p className="text-muted-foreground">Loading decks...</p>
+            <p className="text-muted-foreground">{t('common.loading')}</p>
           </div>
         ) : currentDecks.length === 0 ? (
           <div className="text-center py-12">
             <BookOpenIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
-            <h3 className="text-xl font-semibold text-foreground mb-2">No decks found</h3>
+            <h3 className="text-xl font-semibold text-foreground mb-2">{t('decks.noDeckFound')}</h3>
             <p className="text-muted-foreground mb-6">
-              {activeTab === 'my' 
-                ? 'Create your first deck to get started!' 
-                : 'No public decks available at the moment.'}
+              {activeTab === 'my' 
+                ? t('decks.createFirstDeck')
+                : t('decks.noPublicDecks')}
             </p>
             {activeTab === 'my' && (
               <Button asChild>
                 <Link to="/create">
                   <PlusIcon className="w-4 h-4 mr-2" />
-                  Create Your First Deck
+                  {t('decks.createFirstDeck')}
                 </Link>
               </Button>
             )}
           </div>
         ) : (
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             {currentDecks.map((deck, index) => (
               <motion.div
                 key={deck.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.4, delay: index * 0.1 }}
               >
                 <DeckCard deck={deck} />
               </motion.div>
             ))}
           </div>
         )}
       </motion.div>
     </div>
   );
 }
```

**Explanation**: Updates the deck management page with tab navigation, empty states, and loading messages using translations.

### 3. Update DeckCard Component (`src/components/decks/DeckCard.tsx`)

```diff
@@ -1,5 +1,6 @@
 import { Link } from '@tanstack/react-router';
 import { motion } from 'framer-motion';
+import { useTranslation } from '../../i18n';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
 import { Button } from '../ui/Button';
 import { Badge } from '../ui/Badge';
@@ -12,6 +13,7 @@ interface DeckCardProps {

 export function DeckCard({ deck }: DeckCardProps) {
   const { deleteDeck } = useDecks();
+  const t = useTranslation();
   const [isDeleting, setIsDeleting] = useState(false);

   const handleDelete = async () => {
-    if (confirm('Are you sure you want to delete this deck?')) {
+    if (confirm(t('decks.confirmDelete'))) {
       setIsDeleting(true);
       try {
         await deleteDeck(deck.id);
       } catch (error) {
         console.error('Failed to delete deck:', error);
       } finally {
         setIsDeleting(false);
       }
     }
   };

   const cardCount = deck.content.split('\n').filter(line => line.includes('::')).length;

   return (
     <motion.div
       whileHover={{ y: -4, scale: 1.02 }}
       transition={{ duration: 0.2 }}
     >
       <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
         <CardHeader>
           <div className="flex justify-between items-start">
             <CardTitle className="text-lg line-clamp-2">{deck.name}</CardTitle>
             <Badge variant={deck.isPublic ? 'default' : 'secondary'}>
-              {deck.isPublic ? 'Public' : 'Private'}
+              {deck.isPublic ? t('create.public') : t('create.private')}
             </Badge>
           </div>
           {deck.description && (
             <CardDescription className="line-clamp-2">
               {deck.description}
             </CardDescription>
           )}
         </CardHeader>

         <CardContent className="flex-1 flex flex-col justify-between">
           <div className="space-y-2 mb-4">
             <div className="flex items-center text-sm text-muted-foreground">
               <BookOpenIcon className="w-4 h-4 mr-1" />
-              <span>{cardCount} cards</span>
+              <span>{cardCount} {t('decks.cards')}</span>
             </div>
             <div className="flex items-center text-sm text-muted-foreground">
               <ClockIcon className="w-4 h-4 mr-1" />
-              <span>Last modified {new Date(deck.updatedAt).toLocaleDateString()}</span>
+              <span>{t('decks.lastModified')} {new Date(deck.updatedAt).toLocaleDateString()}</span>
             </div>
           </div>

           <div className="space-y-2">
             <Button asChild className="w-full">
               <Link to="/game/$deckId" params={{ deckId: deck.id }}>
                 <PlayIcon className="w-4 h-4 mr-2" />
-                Play Deck
+                {t('decks.playDeck')}
               </Link>
             </Button>
             
             <div className="grid grid-cols-2 gap-2">
               <Button variant="outline" size="sm" asChild>
                 <Link to="/edit/$deckId" params={{ deckId: deck.id }}>
                   <EditIcon className="w-4 h-4 mr-1" />
-                  Edit
+                  {t('common.edit')}
                 </Link>
               </Button>
               
               <Button
                 variant="outline"
                 size="sm"
                 onClick={handleDelete}
                 disabled={isDeleting}
                 className="text-destructive hover:text-destructive"
               >
                 {isDeleting ? (
                   <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                 ) : (
                   <TrashIcon className="w-4 h-4 mr-1" />
                 )}
-                {isDeleting ? 'Deleting...' : 'Delete'}
+                {isDeleting ? t('common.loading') : t('common.delete')}
               </Button>
             </div>
           </div>
         </CardContent>
       </Card>
     </motion.div>
   );
 }
```

**Explanation**: Updates deck cards with translated labels, action buttons, and confirmation dialogs.

### 4. Update Study Mode Component (`src/components/game/StudyMode.tsx`)

```diff
@@ -1,4 +1,5 @@
 import { useState } from 'react';
+import { useTranslation } from '../../i18n';
 import { motion, AnimatePresence } from 'framer-motion';
 import { Button } from '../ui/Button';
 import { Card, CardContent } from '../ui/Card';
@@ -11,6 +12,7 @@ interface StudyModeProps {

 export function StudyMode({ cards, onComplete }: StudyModeProps) {
   const [currentIndex, setCurrentIndex] = useState(0);
+  const t = useTranslation();
   const [showAnswer, setShowAnswer] = useState(false);
   const [completedCards, setCompletedCards] = useState<Set<number>>(new Set());

@@ -44,8 +46,8 @@ export function StudyMode({ cards, onComplete }: StudyModeProps) {
       <div className="text-center mb-6">
         <div className="flex justify-between items-center mb-4">
           <div className="text-sm text-muted-foreground">
-            Card {currentIndex + 1} of {cards.length}
+            {t('game.cardProgress', { current: currentIndex + 1, total: cards.length })}
           </div>
           <div className="text-sm text-muted-foreground">
-            Completed: {completedCards.size}/{cards.length}
+            {t('game.completed')}: {completedCards.size}/{cards.length}
           </div>
         </div>
@@ -80,7 +82,7 @@ export function StudyMode({ cards, onComplete }: StudyModeProps) {
             onClick={() => setShowAnswer(true)}
             className="w-full"
           >
-            Show Answer
+            {t('game.showAnswer')}
           </Button>
         ) : (
           <div className="space-y-4">
@@ -90,14 +92,14 @@ export function StudyMode({ cards, onComplete }: StudyModeProps) {
               onClick={handleNext}
               className="w-full"
             >
-              Next Card
+              {t('game.nextCard')}
             </Button>
             
             <div className="grid grid-cols-2 gap-4">
               <Button 
                 variant="outline"
                 onClick={handleMarkCorrect}
               >
-                I knew this
+                {t('game.knewThis')}
               </Button>
               <Button 
                 variant="outline"
                 onClick={handleMarkIncorrect}
               >
-                I didn't know
+                {t('game.didntKnow')}
               </Button>
             </div>
           </div>
@@ -123,11 +125,11 @@ export function StudyMode({ cards, onComplete }: StudyModeProps) {
         >
           <div className="text-center py-8">
             <h3 className="text-2xl font-bold text-foreground mb-4">
-              Study Session Complete!
+              {t('game.studyComplete')}
             </h3>
             <p className="text-muted-foreground mb-6">
-              You completed {completedCards.size} out of {cards.length} cards correctly.
+              {t('game.studyStats', { correct: completedCards.size, total: cards.length })}
             </p>
             <div className="space-y-4">
               <Button onClick={() => window.location.reload()}>
-                Study Again
+                {t('game.studyAgain')}
               </Button>
               <Button variant="outline" onClick={onComplete}>
-                Back to Decks
+                {t('game.backToDecks')}
               </Button>
             </div>
           </div>
         </motion.div>
       )}
     </AnimatePresence>
   );
 }
```

**Explanation**: Updates study mode with translated progress indicators, button labels, and completion messages.

### 5. Update Quiz Mode Component (`src/components/game/QuizMode.tsx`)

```diff
@@ -1,4 +1,5 @@
 import { useState, useEffect } from 'react';
+import { useTranslation } from '../../i18n';
 import { motion, AnimatePresence } from 'framer-motion';
 import { Button } from '../ui/Button';
 import { Card, CardContent } from '../ui/Card';
@@ -15,6 +16,7 @@ interface QuizModeProps {
 export function QuizMode({ cards, onComplete }: QuizModeProps) {
   const [currentIndex, setCurrentIndex] = useState(0);
   const [score, setScore] = useState(0);
+  const t = useTranslation();
   const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
   const [showResult, setShowResult] = useState(false);
   const [quizData, setQuizData] = useState<QuizCard[]>([]);
@@ -72,8 +74,8 @@ export function QuizMode({ cards, onComplete }: QuizModeProps) {
       <div className="text-center mb-6">
         <div className="flex justify-between items-center mb-4">
           <div className="text-sm text-muted-foreground">
-            Question {currentIndex + 1} of {quizData.length}
+            {t('game.questionProgress', { current: currentIndex + 1, total: quizData.length })}
           </div>
           <div className="text-sm text-muted-foreground">
-            Score: {score}/{currentIndex}
+            {t('game.score')}: {score}/{currentIndex}
           </div>
         </div>
@@ -118,7 +120,7 @@ export function QuizMode({ cards, onComplete }: QuizModeProps) {
             disabled={!selectedAnswer}
             className="w-full"
           >
-            {showResult ? 'Next Question' : 'Submit Answer'}
+            {showResult ? t('game.nextQuestion') : t('game.submitAnswer')}
           </Button>
         </div>

@@ -130,7 +132,7 @@ export function QuizMode({ cards, onComplete }: QuizModeProps) {
             className={`text-center p-4 rounded-lg ${
               selectedAnswer === currentCard.correctAnswer 
                 ? 'bg-green-100 text-green-800 border border-green-300' 
                 : 'bg-red-100 text-red-800 border border-red-300'
             }`}
           >
-            {selectedAnswer === currentCard.correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
+            {selectedAnswer === currentCard.correctAnswer ? 
+              `✅ ${t('game.correct')}` : 
+              `❌ ${t('game.incorrect')}`
+            }
             <div className="mt-2 text-sm">
-              Correct answer: {currentCard.correctAnswer}
+              {t('game.correctAnswer')}: {currentCard.correctAnswer}
             </div>
           </motion.div>
         )}
@@ -152,12 +154,12 @@ export function QuizMode({ cards, onComplete }: QuizModeProps) {
         >
           <div className="text-center py-8">
             <h3 className="text-2xl font-bold text-foreground mb-4">
-              Quiz Complete!
+              {t('game.quizComplete')}
             </h3>
             <p className="text-muted-foreground mb-6">
-              Final Score: {score}/{quizData.length} ({Math.round((score / quizData.length) * 100)}%)
+              {t('game.finalScore')}: {score}/{quizData.length} ({Math.round((score / quizData.length) * 100)}%)
             </p>
             <div className="space-y-4">
               <Button onClick={() => window.location.reload()}>
-                Try Again
+                {t('game.tryAgain')}
               </Button>
               <Button variant="outline" onClick={onComplete}>
-                Back to Decks
+                {t('game.backToDecks')}
               </Button>
             </div>
           </div>
         </motion.div>
       )}
     </AnimatePresence>
   );
 }
```

**Explanation**: Updates quiz mode with translated question progress, score display, feedback messages, and completion screen.

### 6. Add Missing Translation Keys to All Language Files

#### English (`src/i18n/locales/en.ts`)

```diff
@@ -70,6 +70,12 @@ const en: TranslationNamespace = {
     backToDecks: 'Back to Decks',
+    cardProgress: 'Card {{current}} of {{total}}',
+    completed: 'Completed',
+    knewThis: 'I knew this',
+    didntKnow: 'I didn\'t know',
+    studyComplete: 'Study Session Complete!',
+    studyStats: 'You completed {{correct}} out of {{total}} cards correctly.',
+    studyAgain: 'Study Again',
+    questionProgress: 'Question {{current}} of {{total}}',
+    submitAnswer: 'Submit Answer',
+    nextQuestion: 'Next Question',
+    correctAnswer: 'Correct answer',
+    quizComplete: 'Quiz Complete!',
+    finalScore: 'Final Score',
+    tryAgain: 'Try Again',
   },

   // Error messages
   errors: {
     deckNotFound: 'Deck not found',
     invalidFormat: 'Invalid flashcard format',
     saveError: 'Failed to save. Please try again.',
     loadError: 'Failed to load content. Please refresh the page.',
     networkError: 'Network error. Please check your connection.',
     genericError: 'Something went wrong. Please try again.',
+    deckNameRequired: 'Deck name is required',
+    contentRequired: 'Flashcard content is required',
   },
 };
```

#### Vietnamese (`src/i18n/locales/vi.ts`)

```diff
@@ -70,6 +70,12 @@ const vi: TranslationNamespace = {
     backToDecks: 'Quay Lại Bộ Thẻ',
+    cardProgress: 'Thẻ {{current}} trong {{total}}',
+    completed: 'Hoàn Thành',
+    knewThis: 'Tôi đã biết',
+    didntKnow: 'Tôi không biết',
+    studyComplete: 'Hoàn Thành Phiên Học!',
+    studyStats: 'Bạn đã hoàn thành đúng {{correct}} trong {{total}} thẻ.',
+    studyAgain: 'Học Lại',
+    questionProgress: 'Câu hỏi {{current}} trong {{total}}',
+    submitAnswer: 'Gửi Câu Trả Lời',
+    nextQuestion: 'Câu Hỏi Tiếp Theo',
+    correctAnswer: 'Câu trả lời đúng',
+    quizComplete: 'Hoàn Thành Bài Kiểm Tra!',
+    finalScore: 'Điểm Cuối Cùng',
+    tryAgain: 'Thử Lại',
   },

   errors: {
     deckNotFound: 'Không tìm thấy bộ thẻ',
     invalidFormat: 'Định dạng thẻ ghi nhớ không hợp lệ',
     saveError: 'Không thể lưu. Vui lòng thử lại.',
     loadError: 'Không thể tải nội dung. Vui lòng làm mới trang.',
     networkError: 'Lỗi mạng. Vui lòng kiểm tra kết nối.',
     genericError: 'Có lỗi xảy ra. Vui lòng thử lại.',
+    deckNameRequired: 'Tên bộ thẻ là bắt buộc',
+    contentRequired: 'Nội dung thẻ ghi nhớ là bắt buộc',
   },
```

#### Spanish (`src/i18n/locales/es.ts`)

```diff
@@ -70,6 +70,12 @@ const es: TranslationNamespace = {
     backToDecks: 'Volver a Mazos',
+    cardProgress: 'Tarjeta {{current}} de {{total}}',
+    completed: 'Completado',
+    knewThis: 'Ya lo sabía',
+    didntKnow: 'No lo sabía',
+    studyComplete: '¡Sesión de Estudio Completada!',
+    studyStats: 'Completaste correctamente {{correct}} de {{total}} tarjetas.',
+    studyAgain: 'Estudiar de Nuevo',
+    questionProgress: 'Pregunta {{current}} de {{total}}',
+    submitAnswer: 'Enviar Respuesta',
+    nextQuestion: 'Siguiente Pregunta',
+    correctAnswer: 'Respuesta correcta',
+    quizComplete: '¡Quiz Completado!',
+    finalScore: 'Puntuación Final',
+    tryAgain: 'Intentar de Nuevo',
   },

   errors: {
     deckNotFound: 'Mazo no encontrado',
     invalidFormat: 'Formato de tarjeta inválido',
     saveError: 'Error al guardar. Por favor, inténtalo de nuevo.',
     loadError: 'Error al cargar contenido. Por favor, actualiza la página.',
     networkError: 'Error de red. Por favor, verifica tu conexión.',
     genericError: 'Algo salió mal. Por favor, inténtalo de nuevo.',
+    deckNameRequired: 'El nombre del mazo es obligatorio',
+    contentRequired: 'El contenido de las tarjetas es obligatorio',
   },
```

### 7. Update TypeScript Interface (`src/types/i18n.types.ts`)

```diff
@@ -107,6 +107,12 @@ export interface TranslationNamespace {
     gameComplete: string;
     playAgain: string;
     backToDecks: string;
+    cardProgress: string;
+    completed: string;
+    knewThis: string;
+    didntKnow: string;
+    studyComplete: string;
+    studyStats: string;
+    studyAgain: string;
+    questionProgress: string;
+    submitAnswer: string;
+    nextQuestion: string;
+    correctAnswer: string;
+    quizComplete: string;
+    finalScore: string;
+    tryAgain: string;
   };

   // Error messages
   errors: {
     deckNotFound: string;
     invalidFormat: string;
     saveError: string;
     loadError: string;
     networkError: string;
     genericError: string;
+    deckNameRequired: string;
+    contentRequired: string;
   };
 }
```

## Testing Strategy

### 1. Form Validation Test (`src/pages/__tests__/CreatePage.test.tsx`) - NEW FILE

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { CreatePage } from '../CreatePage';
import { MemoryRouter } from '@tanstack/react-router';

// Mock translation hook
const mockT = vi.fn((key: string) => key);
vi.mock('../../i18n', () => ({
  useTranslation: () => mockT,
}));

// Mock deck hooks
const mockCreateDeck = vi.fn();
vi.mock('../../hooks/useDecks', () => ({
  useDecks: () => ({
    createDeck: mockCreateDeck,
  }),
}));

describe('CreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockT.mockImplementation((key: string) => key);
  });

  it('shows validation errors for empty required fields', async () => {
    render(
      <MemoryRouter>
        <CreatePage />
      </MemoryRouter>
    );

    const submitButton = screen.getByRole('button', { name: /create.createButton/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockT).toHaveBeenCalledWith('errors.deckNameRequired');
      expect(mockT).toHaveBeenCalledWith('errors.contentRequired');
    });
  });

  it('submits form with valid data', async () => {
    mockCreateDeck.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <CreatePage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/create.deckNameLabel/), {
      target: { value: 'Test Deck' }
    });
    fireEvent.change(screen.getByLabelText(/create.contentLabel/), {
      target: { value: 'Question :: Answer' }
    });

    const submitButton = screen.getByRole('button', { name: /create.createButton/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateDeck).toHaveBeenCalledWith({
        name: 'Test Deck',
        description: '',
        content: 'Question :: Answer',
        isPublic: false,
      });
    });
  });
});
```

## Verification Steps

1. **Form Translations**: Verify create page form labels and validation messages are translated
2. **Deck Management**: Check that deck list, cards, and actions use translations
3. **Game Modes**: Test that study and quiz modes show translated progress and feedback
4. **Error Handling**: Confirm validation errors and submission errors are localized
5. **Accessibility**: Ensure form labels and ARIA attributes work with translations
6. **Parameter Interpolation**: Test that dynamic content like "Card 1 of 5" works correctly

## Performance Impact

- **Translation Function Calls**: Game modes may call translations frequently during play
- **Form Validation**: Validation errors are translated on-demand
- **Memory Usage**: Additional translation keys increase bundle size by ~1KB per language

## Next Stage Preview

Stage 6 will add contributor documentation and example language files to make it easy for open-source contributors to add new languages.

---

**AI Agent Instructions**: 
1. Update CreatePage with comprehensive form translations and validation
2. Update DecksPage with tab navigation and empty state translations  
3. Update DeckCard component with all action buttons and metadata
4. Update StudyMode and QuizMode with progress indicators and feedback
5. Add all missing translation keys to English, Vietnamese, and Spanish files
6. Update TypeScript interface with new translation keys
7. Run `npm run validate-translations` to ensure consistency
8. Run `npm run type-check` to verify TypeScript compilation
9. Test form validation, deck management, and game modes in different languages
10. Continue to Stage 6 only after successful verification