import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Check } from 'lucide-react';
import { useI18n } from '../../contexts/i18nContext';
import { AVAILABLE_LANGUAGES, type LanguageCode } from '../../types/i18n.types';

interface LanguageSelectionDialogProps {
  isOpen: boolean;
  onSelect: (languageCode: LanguageCode) => void;
  onClose: () => void;
}

export const LanguageSelectionDialog: React.FC<LanguageSelectionDialogProps> = ({
  isOpen,
  onSelect,
  onClose
}) => {
  const { currentLanguage } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(currentLanguage);

  const handleLanguageSelect = (languageCode: LanguageCode) => {
    setSelectedLanguage(languageCode);
  };

  const handleConfirm = () => {
    onSelect(selectedLanguage);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 p-8 text-white">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors z-20"
                >
                  <X size={20} />
                </button>
                
                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="flex items-center gap-4 mb-4"
                  >
                    <div className="p-4 bg-white/20 rounded-2xl">
                      <Globe size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold mb-1">Welcome to MyFlashPlay</h2>
                      <p className="text-purple-100">Choose your preferred language to get started</p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Language Options */}
              <div className="p-6">
                {/* Accept Button */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex gap-3 mb-6"
                >
                  <motion.button
                    onClick={onClose}
                    className="flex-1 px-6 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Skip for now
                  </motion.button>
                  <motion.button
                    onClick={handleConfirm}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl relative overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/20 opacity-0 hover:opacity-100 transition-opacity"></div>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Continue with {AVAILABLE_LANGUAGES.find(l => l.code === selectedLanguage)?.name}
                      <span className="text-lg">
                        {AVAILABLE_LANGUAGES.find(l => l.code === selectedLanguage)?.flag}
                      </span>
                    </span>
                  </motion.button>
                </motion.div>

                <div className="grid gap-3 max-h-80 overflow-y-auto">
                  {AVAILABLE_LANGUAGES.map((language, index) => (
                    <motion.button
                      key={language.code}
                      onClick={() => handleLanguageSelect(language.code)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                      className={`
                        flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group relative overflow-hidden
                        ${selectedLanguage === language.code
                          ? 'bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 border-2 border-purple-500 shadow-lg'
                          : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600 hover:shadow-md'
                        }
                      `}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Hover effect background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      
                      {/* Flag */}
                      <div className="relative z-10 text-4xl transform group-hover:scale-110 transition-transform duration-200">
                        {language.flag}
                      </div>
                      
                      {/* Language Info */}
                      <div className="relative z-10 flex-1 text-left">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                          {language.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                          {language.nativeName}
                        </div>
                      </div>
                      
                      {/* Selection Indicator */}
                      <div className={`
                        relative z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200
                        ${selectedLanguage === language.code
                          ? 'bg-purple-500 border-purple-500 shadow-lg'
                          : 'border-gray-300 dark:border-gray-500 group-hover:border-purple-400'
                        }
                      `}>
                        {selectedLanguage === language.code && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", duration: 0.3 }}
                          >
                            <Check size={16} className="text-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};