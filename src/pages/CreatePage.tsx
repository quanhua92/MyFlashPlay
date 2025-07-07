import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Wand2, CheckCircle, Edit3, Code, Tag, X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { v4 as uuidv4 } from 'uuid';
import { MarkdownParser } from '@/utils/markdown';
import { markdownStorage } from '@/utils/markdown-storage';
import { templates, type Template } from '@/data/templates';
import { useDecks } from '@/hooks/useDecks';
import { MarkdownGuide } from '@/components/create/MarkdownGuide';
import { QuickCreateInterface } from '@/components/create/QuickCreateInterface';
import { TemplateSelector } from '@/components/create/TemplateSelector';
import { MarkdownValidator } from '@/components/create/MarkdownValidator';
import { SafeContentRenderer } from '@/components/common/SafeContentRenderer';
import { useTranslation } from '@/i18n';
import type { Deck } from '@/types';

type CreateMode = 'interface' | 'markdown';

export function CreatePage() {
  console.log('[CreatePage] Component rendering');
  const t = useTranslation();
  const [markdown, setMarkdown] = useState(templates[0].markdown);
  const [deckName, setDeckName] = useState(templates[0].deckName);
  const [description, setDescription] = useState(templates[0].deckDescription);
  const [emoji, setEmoji] = useState(templates[0].emoji);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>('interface');
  const [validationResult, setValidationResult] = useState<any>({ isValid: true, errors: [], cardCount: 0 });
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const loadedDeckRef = useRef<string | null>(null);
  
  // Enhanced logging for state changes
  useEffect(() => {
    console.log('[CreatePage STATE] Markdown changed:', {
      length: markdown.length,
      preview: markdown.substring(0, 100) + '...',
      parsedCardCount: parsedCards.length,
      isEditingDeck: !!editingDeck,
      editingDeckId: editingDeck?.id,
      loadedDeckRef: loadedDeckRef.current
    });
  }, [markdown]);
  
  useEffect(() => {
    console.log('[CreatePage STATE] EditingDeck changed:', {
      editingDeck: editingDeck ? {
        id: editingDeck.id,
        name: editingDeck.name,
        cardCount: editingDeck.cards.length,
        firstThreeCards: editingDeck.cards.slice(0, 3).map(card => ({
          front: card.front.substring(0, 30) + '...',
          back: card.back.substring(0, 30) + '...'
        }))
      } : null,
      loadedDeckRef: loadedDeckRef.current
    });
  }, [editingDeck]);
  
  useEffect(() => {
    console.log('[CreatePage STATE] DeckName changed:', {
      deckName,
      editingDeck: editingDeck?.name,
      loadedDeckRef: loadedDeckRef.current
    });
  }, [deckName]);
  
  const search = useSearch({ from: '/create' });
  console.log('[CreatePage] Search params:', search);
  const navigate = useNavigate();
  const { addDeck, updateDeck, getDeck } = useDecks();
  const parser = new MarkdownParser();
  const parsedCards = markdown ? parser.parse(markdown) : [];
  console.log('[CreatePage] Current state:', { 
    editingDeck: editingDeck?.id, 
    deckName, 
    loadedDeckRef: loadedDeckRef.current,
    cardCount: parsedCards.length 
  });
  
  // Debug: Check what's actually in localStorage for this deck
  useEffect(() => {
    if (search.editDeck) {
      const storageKey = `mdoc_${search.editDeck}`;
      const rawMarkdown = localStorage.getItem(storageKey);
      console.log('[CreatePage DEBUG] Current localStorage content:', {
        deckId: search.editDeck,
        key: storageKey,
        found: !!rawMarkdown,
        length: rawMarkdown?.length || 0,
        fullContent: rawMarkdown || 'NOT FOUND'
      });
    }
  }, [search.editDeck]);

  // Load deck for editing if editDeck parameter is provided
  useEffect(() => {
    console.log('[CreatePage useEffect] Running with:', {
      searchEditDeck: search.editDeck,
      loadedDeckRef: loadedDeckRef.current,
      condition: search.editDeck && loadedDeckRef.current !== search.editDeck
    });
    
    if (search.editDeck && loadedDeckRef.current !== search.editDeck) {
      console.log('[CreatePage useEffect] Loading deck for editing:', search.editDeck);
      
      // First check what markdown is currently in localStorage
      const storageKey = `mdoc_${search.editDeck}`;
      const rawMarkdown = localStorage.getItem(storageKey);
      console.log('[CreatePage useEffect] Raw markdown from localStorage:', {
        key: storageKey,
        found: !!rawMarkdown,
        length: rawMarkdown?.length || 0,
        preview: rawMarkdown ? rawMarkdown.substring(0, 200) + '...' : 'NOT FOUND'
      });
      
      const deckToEdit = getDeck(search.editDeck);
      console.log('[CreatePage useEffect] getDeck returned:', {
        found: !!deckToEdit,
        id: deckToEdit?.id,
        name: deckToEdit?.name,
        cardCount: deckToEdit?.cards?.length,
        firstCardPreview: deckToEdit?.cards?.[0] ? {
          type: deckToEdit.cards[0].type,
          front: deckToEdit.cards[0].front.substring(0, 50) + '...',
          back: deckToEdit.cards[0].back.substring(0, 50) + '...'
        } : 'NO CARDS'
      });
      
      if (deckToEdit) {
        console.log('[CreatePage useEffect] Setting deck data...');
        console.log('[CreatePage useEffect] ALL CARDS IN DECK:', deckToEdit.cards.map((card, index) => ({
          index,
          type: card.type,
          front: card.front,
          back: card.back,
          category: card.category
        })));
        
        loadedDeckRef.current = search.editDeck;
        setEditingDeck(deckToEdit);
        setDeckName(deckToEdit.name);
        setDescription(deckToEdit.description);
        setEmoji(deckToEdit.emoji);
        setTags(deckToEdit.metadata?.tags || []);
        
        // Option 1: Use raw markdown from localStorage if available
        if (rawMarkdown) {
          console.log('[CreatePage useEffect] Using raw markdown from localStorage');
          setMarkdown(rawMarkdown);
        } else {
          // Option 2: Convert cards back to markdown format
          console.log('[CreatePage useEffect] Converting cards to markdown...');
          const markdownContent = deckToEdit.cards.map((card, index) => {
            console.log(`[CreatePage useEffect] Processing card ${index}:`, {
              type: card.type,
              front: card.front.substring(0, 50) + '...',
              back: card.back.substring(0, 50) + '...'
            });
            if (card.type === 'basic') {
              return `${card.front} :: ${card.back}`;
            } else if (card.type === 'multiple_choice') {
              const choices = card.choices?.map(choice => `  - ${choice}`).join('\n') || '';
              return `${card.front} ::\n${choices}\n  > ${card.back}`;
            }
            return `${card.front} :: ${card.back}`;
          }).join('\n');
          
          const fullMarkdown = `# ${deckToEdit.name}\n\n${markdownContent}`;
          console.log('[CreatePage useEffect] Generated markdown:', {
            length: fullMarkdown.length,
            preview: fullMarkdown.substring(0, 200) + '...',
            fullContent: fullMarkdown
          });
          setMarkdown(fullMarkdown);
        }
      } else {
        console.error('[CreatePage useEffect] Deck not found for editing:', search.editDeck);
      }
    } else if (!search.editDeck) {
      console.log('[CreatePage useEffect] No editDeck param, resetting...');
      // Reset when not editing
      loadedDeckRef.current = null;
      setEditingDeck(null);
    } else {
      console.log('[CreatePage useEffect] Skipping - deck already loaded');
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
            tags: tags
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
            tags: tags,
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

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
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
            {editingDeck ? t('create.editTitle') : t('create.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {editingDeck 
              ? t('create.editSubtitle')
              : t('create.subtitle')
            }
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deck Metadata */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('create.deckInformation')}
              </h3>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('create.emojiLabel')}
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
                    {t('create.deckNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder={t('create.deckNamePlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('create.descriptionLabel')}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder={t('create.descriptionPlaceholder')}
                />
              </div>

              {/* Tags Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  {t('create.tagsLabel')}
                </label>
                
                {/* Tag Input */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder={t('create.tagsPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={!tagInput.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {t('create.addTag')}
                  </button>
                </div>

                {/* Tag Display */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {t('create.tagsHelp')}
                </p>
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
                  {t('create.easyInterface')}
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
                  {t('create.rawMarkdown')}
                </button>
              </div>
            </div>

            {/* Content Creation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              {createMode === 'interface' ? (
                <QuickCreateInterface 
                  onMarkdownChange={setMarkdown}
                  initialMarkdown={markdown}
                  isActive={true}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      {t('create.markdownEditor')}
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
                        <span>{t('create.upload')}</span>
                      </button>
                      <button 
                        className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                        onClick={() => handleTemplateSelect(templates[0])}
                      >
                        <Wand2 className="w-4 h-4" />
                        <span>{t('create.template')}</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    className="w-full h-96 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm resize-none"
                    placeholder={t('create.markdownPlaceholder')}
                  />

                  {/* Validation */}
                  <MarkdownValidator 
                    markdown={markdown} 
                    onValidationChange={setValidationResult}
                  />

                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <span>{t('create.interfaceTip')}</span>
                    <span>{t('create.characterCount', { count: markdown.length })}</span>
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
                {t('create.preview')} ({parsedCards.length} {t('create.cards')})
              </h3>
              
              {parsedCards.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {parsedCards.map((card, index) => (
                    <div
                      key={card.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                    >
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {t('create.cardNumber', { number: index + 1 })} • {card.type} • {card.category || t('create.noCategory')}
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
                  {t('create.startCreating')}
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
                      <span>{t('create.creating')}</span>
                    </>
                  ) : isCreated ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>{editingDeck ? t('create.updated') : t('create.created')} {t('create.redirecting')}</span>
                    </>
                  ) : (
                    <span>
                      {validationResult?.isValid 
                        ? `${editingDeck ? t('create.updateDeck') : t('create.createDeck')} ${t('create.deck')} (${parsedCards.length} ${t('create.cards')})` 
                        : `${t('create.fixErrors')} ${editingDeck ? t('create.update') : t('create.create')} ${t('create.deck')}`
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