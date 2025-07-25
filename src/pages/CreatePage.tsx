import { useState, useRef } from 'react';
import { Upload, FileText, Wand2, CheckCircle, Edit3, Code, Tag, X, Plus, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import { v4 as uuidv4 } from 'uuid';
import { MarkdownParser } from '@/utils/markdown';
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
  const t = useTranslation();
  const navigate = useNavigate();
  const { addDeck } = useDecks();
  const parser = new MarkdownParser();

  // Core state
  const [markdown, setMarkdown] = useState('');
  const [deckName, setDeckName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📚');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // UI state
  const [createMode, setCreateMode] = useState<CreateMode>('markdown');
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationResult, setValidationResult] = useState<any>({ isValid: true, errors: [], cardCount: 0 });
  
  // Ref to prevent double updates
  const markdownUpdateRef = useRef<string>('');

  // Parse cards from markdown
  const parsedCards = markdown ? parser.parse(markdown) : [];

  const handleCreateDeck = async () => {
    // Validate before creating
    if (!validationResult?.isValid || parsedCards.length === 0) {
      console.error('Cannot save deck: validation failed or no cards');
      return;
    }
    
    if (!deckName.trim()) {
      console.error('Deck name is required');
      return;
    }
    
    setIsCreating(true);
    
    try {
      const newDeck: Deck = {
        id: uuidv4(),
        name: deckName.trim(),
        description: description.trim(),
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
          estimatedTime: Math.ceil(parsedCards.length / 10) * 5
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

  const handleMarkdownChange = (newMarkdown: string) => {
    markdownUpdateRef.current = newMarkdown;
    setMarkdown(newMarkdown);
  };

  const handleQuickCreateChange = (newMarkdown: string) => {
    // Prevent feedback loop
    if (markdownUpdateRef.current === newMarkdown) {
      return;
    }
    setMarkdown(newMarkdown);
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

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setMarkdown(content);
    };
    reader.readAsText(file);
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
            {t('create.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {t('create.subtitle')}
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

              <div className="mb-4">
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
                  onClick={() => setCreateMode('interface')}
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
                  onClick={() => setCreateMode('markdown')}
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
                  onMarkdownChange={handleQuickCreateChange}
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
                              handleFileUpload(file);
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
                    onChange={(e) => handleMarkdownChange(e.target.value)}
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

            {/* Preview Button for Mobile */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="w-full py-3 px-6 rounded-lg font-semibold bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                {showPreview ? t('create.hidePreview') : t('create.showPreview')}
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div className={`lg:col-span-1 space-y-6 ${showPreview ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 lg:sticky lg:top-4">
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
                  whileHover={validationResult?.isValid && deckName.trim() ? { scale: 1.02 } : {}}
                  whileTap={validationResult?.isValid && deckName.trim() ? { scale: 0.98 } : {}}
                >
                  {isCreating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('create.creating')}</span>
                    </>
                  ) : isCreated ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>{t('create.created')} {t('create.redirecting')}</span>
                    </>
                  ) : (
                    <span>
                      {validationResult?.isValid 
                        ? `${t('create.createDeck')} (${parsedCards.length} ${t('create.cards')})` 
                        : `${t('create.fixErrors')} ${t('create.create')} ${t('create.deck')}`
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