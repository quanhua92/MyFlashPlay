import { useState, useEffect } from 'react';
import { Upload, FileText, Wand2, CheckCircle, Edit3, Code } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { v4 as uuidv4 } from 'uuid';
import { MarkdownParser } from '@/utils/markdown-parser';
import { markdownStorage } from '@/utils/markdown-storage';
import { templates, type Template } from '@/data/templates';
import { useDecks } from '@/hooks/useDecks';
import { MarkdownGuide } from '@/components/create/MarkdownGuide';
import { QuickCreateInterface } from '@/components/create/QuickCreateInterface';
import { TemplateSelector } from '@/components/create/TemplateSelector';
import { MarkdownValidator } from '@/components/create/MarkdownValidator';
import { SafeContentRenderer } from '@/components/common/SafeContentRenderer';
import type { Deck } from '@/types';

type CreateMode = 'interface' | 'markdown';

export function CreatePage() {
  const [markdown, setMarkdown] = useState(templates[0].markdown);
  const [deckName, setDeckName] = useState(templates[0].deckName);
  const [description, setDescription] = useState(templates[0].deckDescription);
  const [emoji, setEmoji] = useState(templates[0].emoji);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>('interface');
  const [validationResult, setValidationResult] = useState<any>({ isValid: true, errors: [], cardCount: 0 });
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  
  const search = useSearch({ from: '/create' });
  const navigate = useNavigate();
  const { addDeck, updateDeck, getDeck } = useDecks();
  const parser = new MarkdownParser();
  const parsedCards = markdown ? parser.parse(markdown) : [];

  // Load deck for editing if editDeck parameter is provided
  useEffect(() => {
    if (search.editDeck) {
      const deckToEdit = getDeck(search.editDeck);
      if (deckToEdit) {
        setEditingDeck(deckToEdit);
        setDeckName(deckToEdit.name);
        setDescription(deckToEdit.description);
        setEmoji(deckToEdit.emoji);
        
        // Convert cards back to markdown format
        const markdownContent = deckToEdit.cards.map(card => {
          if (card.type === 'basic') {
            return `- ${card.front} :: ${card.back}`;
          } else if (card.type === 'multiple_choice') {
            const choices = card.choices.map(choice => `  - ${choice}`).join('\n');
            return `- ${card.front} ::\n${choices}\n  > ${card.back}`;
          }
          return `- ${card.front} :: ${card.back}`;
        }).join('\n\n');
        
        const fullMarkdown = `# ${deckToEdit.name}\n\n${markdownContent}`;
        setMarkdown(fullMarkdown);
      }
    }
  }, [search.editDeck, getDeck]);

  const handleCreateDeck = async () => {
    // Validate before creating/updating
    if (!validationResult?.isValid || parsedCards.length === 0) {
      console.error('Cannot save deck: validation failed or no cards');
      return;
    }
    
    setIsCreating(true);
    
    try {
      if (editingDeck) {
        // Update existing deck
        const updatedDeck: Deck = {
          ...editingDeck,
          name: deckName,
          description,
          emoji,
          cards: parsedCards,
          metadata: {
            ...editingDeck.metadata,
            lastModified: new Date().toISOString(),
          }
        };
        
        updateDeck(editingDeck.id, updatedDeck);
        console.log(`Updated deck ${editingDeck.id} successfully`);
        
        setIsCreating(false);
        setIsCreated(true);
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate({ to: '/decks' });
        }, 1500);
      } else {
        // Create new deck
        const newDeck: Deck = {
          id: uuidv4(),
          name: deckName,
          description,
          emoji,
          cards: parsedCards,
          metadata: {
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            playCount: 0,
            source: 'created',
            originalMarkdown: markdown,
            tags: [],
            difficulty: 'beginner',
            estimatedTime: Math.ceil(parsedCards.length / 10) * 5 // Rough estimate
          },
          settings: {
            shuffleCards: true,
            repeatIncorrect: true,
            studyMode: 'random'
          }
        };

        // Add to storage
        const addResult = addDeck(newDeck);
        
        if (addResult.success) {
          console.log(`Successfully created deck ${newDeck.id}`);
          setIsCreating(false);
          setIsCreated(true);
          
          // Redirect after a short delay
          setTimeout(() => {
            navigate({ to: '/decks' });
          }, 1500);
        } else {
          setIsCreating(false);
          console.error('Failed to create deck:', addResult.error);
        }
      }
    } catch (error) {
      setIsCreating(false);
      console.error('Error in deck creation:', error);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setMarkdown(template.markdown);
    setDeckName(template.deckName);
    setDescription(template.deckDescription);
    setEmoji(template.emoji);
  };

  const switchToMarkdown = () => {
    setCreateMode('markdown');
  };

  const switchToInterface = () => {
    setCreateMode('interface');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {editingDeck ? 'Edit Flashcards' : 'Create Flashcards'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {editingDeck 
              ? 'Edit your flashcard deck using our easy interface or Markdown directly!'
              : 'Choose your preferred way to create flashcards - use our easy interface or write Markdown directly!'
            }
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deck Metadata */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Deck Information
              </h3>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Emoji
                  </label>
                  <input
                    type="text"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-2xl"
                    placeholder="📚"
                    maxLength={2}
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Deck Name
                  </label>
                  <input
                    type="text"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Enter deck name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Enter deck description"
                />
              </div>
            </div>

            {/* Template Selector */}
            <TemplateSelector onSelectTemplate={handleTemplateSelect} />

            {/* Markdown Guide */}
            <MarkdownGuide />

            {/* Mode Toggle */}
            <div className="flex justify-center">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex">
                <button
                  onClick={switchToInterface}
                  className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                    createMode === 'interface'
                      ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  Easy Interface
                </button>
                <button
                  onClick={switchToMarkdown}
                  className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                    createMode === 'markdown'
                      ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Code className="w-4 h-4" />
                  Raw Markdown
                </button>
              </div>
            </div>

            {/* Content Creation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              {createMode === 'interface' ? (
                <QuickCreateInterface 
                  onMarkdownChange={setMarkdown}
                  initialMarkdown={markdown}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      Markdown Editor
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.md,.txt';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                const content = e.target?.result as string;
                                setMarkdown(content);
                              };
                              reader.readAsText(file);
                            }
                          };
                          input.click();
                        }}
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload</span>
                      </button>
                      <button 
                        className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                        onClick={() => handleTemplateSelect(templates[0])}
                      >
                        <Wand2 className="w-4 h-4" />
                        <span>Template</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    className="w-full h-96 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm resize-none"
                    placeholder="Paste your Markdown content here..."
                  />

                  {/* Validation */}
                  <MarkdownValidator 
                    markdown={markdown} 
                    onValidationChange={setValidationResult}
                  />

                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <span>Tip: Switch to Easy Interface for a guided experience</span>
                    <span>{markdown.length} characters</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Preview ({parsedCards.length} cards)
              </h3>
              
              {parsedCards.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {parsedCards.map((card, index) => (
                    <div
                      key={card.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                    >
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Card {index + 1} • {card.type} • {card.category || 'No category'}
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white mb-2">
                        <SafeContentRenderer content={card.front} />
                      </div>
                      <div className="text-gray-600 dark:text-gray-300">
                        <SafeContentRenderer content={card.back} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Start creating to see your flashcards appear here!
                </div>
              )}

              {parsedCards.length > 0 && (
                <motion.button 
                  className={`w-full mt-6 py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                    validationResult?.isValid && deckName.trim()
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg cursor-pointer'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={handleCreateDeck}
                  disabled={isCreating || !deckName.trim() || !validationResult?.isValid}
                  whileHover={validationResult?.isValid ? { scale: 1.02 } : {}}
                  whileTap={validationResult?.isValid ? { scale: 0.98 } : {}}
                >
                  {isCreating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : isCreated ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>{editingDeck ? 'Updated!' : 'Created!'} Redirecting...</span>
                    </>
                  ) : (
                    <span>
                      {validationResult?.isValid 
                        ? `${editingDeck ? 'Update' : 'Create'} Deck (${parsedCards.length} cards)` 
                        : `Fix validation errors to ${editingDeck ? 'update' : 'create'} deck`
                      }
                    </span>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}