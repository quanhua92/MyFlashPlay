import React, { useState } from 'react';
import { LanguageSelectionDialog } from '../common/LanguageSelectionDialog';
import { useI18n } from '../../contexts/i18nContext';
import { type LanguageCode } from '../../types/i18n.types';
import { Globe } from 'lucide-react';

export const LanguagePreview: React.FC = () => {
  const { setLanguage } = useI18n();
  const [showDialog, setShowDialog] = useState(false);

  const handleLanguageSelect = (languageCode: LanguageCode) => {
    setLanguage(languageCode);
    setShowDialog(false);
  };

  const handleShowDialog = () => {
    // Clear the "seen dialog" flag to force show the dialog
    localStorage.removeItem('myflashplay-first-time-language');
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <Globe size={20} />
        Language Selection Dialog Preview
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Preview the first-time language selection dialog that appears when users visit the site.
      </p>
      <button
        onClick={handleShowDialog}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Preview Language Dialog
      </button>

      <LanguageSelectionDialog
        isOpen={showDialog}
        onSelect={handleLanguageSelect}
        onClose={handleCloseDialog}
      />
    </div>
  );
};