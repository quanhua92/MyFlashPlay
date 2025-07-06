import { useState } from 'react';
import { ChevronDown, ChevronRight, Wand2, BookOpen, FileText, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { templates, getTemplateByComplexity, type Template } from '@/data/templates';

interface TemplateSelectorProps {
  onSelectTemplate: (template: Template) => void;
}

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedComplexity, setSelectedComplexity] = useState<'basic' | 'intermediate' | 'advanced' | null>(null);

  const complexityConfig = {
    basic: {
      icon: BookOpen,
      color: 'green',
      description: 'Simple Q&A cards, perfect for beginners'
    },
    intermediate: {
      icon: FileText,
      color: 'blue',
      description: 'Organized categories and multiple choice questions'
    },
    advanced: {
      icon: GraduationCap,
      color: 'purple',
      description: 'Complex cards with metadata, hints, and explanations'
    }
  };

  const handleTemplateSelect = (template: Template) => {
    onSelectTemplate(template);
    setIsExpanded(false);
    setSelectedComplexity(null);
  };

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-purple-800 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          <span className="font-medium">Choose a Template</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 pb-4"
          >
            <div className="space-y-4">
              {/* Complexity Level Selector */}
              <div>
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">
                  Choose Complexity Level
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(complexityConfig).map(([level, config]) => {
                    const Icon = config.icon;
                    const isSelected = selectedComplexity === level;
                    
                    return (
                      <button
                        key={level}
                        onClick={() => setSelectedComplexity(level as any)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? config.color === 'green' 
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : config.color === 'blue'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-5 h-5 ${
                            isSelected 
                              ? config.color === 'green'
                                ? 'text-green-600 dark:text-green-400'
                                : config.color === 'blue'
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-purple-600 dark:text-purple-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`} />
                          <span className={`font-medium capitalize ${
                            isSelected 
                              ? config.color === 'green'
                                ? 'text-green-800 dark:text-green-200'
                                : config.color === 'blue'
                                ? 'text-blue-800 dark:text-blue-200'
                                : 'text-purple-800 dark:text-purple-200'
                              : 'text-gray-800 dark:text-gray-200'
                          }`}>
                            {level}
                          </span>
                        </div>
                        <p className={`text-sm ${
                          isSelected 
                            ? config.color === 'green'
                              ? 'text-green-700 dark:text-green-300'
                              : config.color === 'blue'
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-purple-700 dark:text-purple-300'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {config.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Template Options */}
              {selectedComplexity && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">
                    Select Template
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getTemplateByComplexity(selectedComplexity).map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{template.emoji}</span>
                          <div>
                            <h5 className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-purple-800 dark:group-hover:text-purple-200">
                              {template.name}
                            </h5>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {template.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quick Start Option */}
              <div className="pt-4 border-t border-purple-200 dark:border-purple-700">
                <button
                  onClick={() => handleTemplateSelect(templates[0])} // Default to first template
                  className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Start with Basic Template
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}