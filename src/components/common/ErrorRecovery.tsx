import { useState } from 'react';
import { AlertTriangle, RefreshCw, FileText, Edit, Save, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { markdownStorage } from '@/utils/markdown-storage';
import { useNavigate } from '@tanstack/react-router';
import { v4 as uuidv4 } from 'uuid';

interface ErrorRecoveryProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  onRecover?: () => void;
}

export function ErrorRecovery({ error, errorInfo }: ErrorRecoveryProps) {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<string>('');
  const navigate = useNavigate();

  // Detect what type of error this is
  const currentUrl = window.location.href;
  const urlParams = new URLSearchParams(window.location.search);
  const deckId = urlParams.get('deck') || window.location.pathname.split('/').pop();
  
  const isPublicDeckError = currentUrl.includes('play-public') || 
                           currentUrl.includes('temp-') ||
                           error.message.includes('temp_deck');
  
  const isLocalDeckError = (currentUrl.includes('play/') && deckId && !isPublicDeckError) ||
                          error.message.includes('mdoc_');

  const savePublicDeckAndEdit = async () => {
    setIsRecovering(true);
    try {
      // Get the temporary deck data
      const tempDeckId = deckId;
      const tempDeckData = sessionStorage.getItem(`temp_deck_${tempDeckId}`);
      
      if (tempDeckData) {
        const tempDeck = JSON.parse(tempDeckData);
        
        // Create a new local deck
        const newDeckId = uuidv4();
        const localDeck = {
          ...tempDeck,
          id: newDeckId,
          name: `${tempDeck.name} (Copy)`,
          metadata: {
            ...tempDeck.metadata,
            source: 'created' as const,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
          }
        };
        
        // Save to local storage
        const result = markdownStorage.saveDeck(localDeck);
        if (result.success) {
          setRecoveryStatus('Deck saved to your collection! Redirecting to editor...');
          // Clear the temp deck
          sessionStorage.removeItem(`temp_deck_${tempDeckId}`);
          // Navigate to edit the new deck
          setTimeout(() => {
            navigate({ to: '/edit/$deckId', params: { deckId: newDeckId } });
          }, 1500);
        } else {
          setRecoveryStatus('Failed to save deck. Try going back and saving it manually.');
        }
      } else {
        setRecoveryStatus('Could not find the deck data. Try going back to public decks.');
      }
    } catch (err) {
      setRecoveryStatus('Error saving deck. Please try again.');
    }
    setIsRecovering(false);
  };

  const editLocalDeck = () => {
    if (deckId) {
      navigate({ to: '/edit/$deckId', params: { deckId: deckId } });
    } else {
      setRecoveryStatus('Could not determine which deck to edit.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Let's fix this deck! 🛠️
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isPublicDeckError 
                  ? 'This public deck has a formatting issue. We can save it and fix it together!'
                  : isLocalDeckError
                    ? 'Your deck has a small issue. Let\'s edit it to fix the problem!'
                    : 'Something went wrong, but we can handle it!'
                }
              </p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-mono text-red-600 dark:text-red-400 mb-2">
              {error.message}
            </p>
            {errorInfo && (
              <details className="text-xs text-gray-600 dark:text-gray-400">
                <summary className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                  Technical details
                </summary>
                <pre className="mt-2 overflow-x-auto">{errorInfo.componentStack}</pre>
              </details>
            )}
          </div>

          {recoveryStatus && (
            <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">{recoveryStatus}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Public deck error - Save & Edit Copy */}
            {isPublicDeckError && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save & Edit Copy
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                  We'll save this deck to your collection and open the editor so you can fix it!
                </p>
                <button
                  onClick={savePublicDeckAndEdit}
                  disabled={isRecovering}
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Save className="w-4 h-4" />
                  <span>Save to My Decks & Edit</span>
                </button>
              </div>
            )}

            {/* Local deck error - Edit Deck */}
            {isLocalDeckError && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Your Deck
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                  Let's open the editor so you can fix the formatting issue in your deck.
                </p>
                <button
                  onClick={editLocalDeck}
                  disabled={isRecovering}
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit This Deck</span>
                </button>
              </div>
            )}

            {/* Safe navigation options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => window.history.back()}
                className="flex items-center justify-center space-x-2 p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go Back</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                disabled={isRecovering}
                className="flex items-center justify-center space-x-2 p-3 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </div>

            {/* Navigation home */}
            <button
              onClick={() => window.location.href = '/'}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Go to Home Page</span>
            </button>
          </div>

          <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              ✅ Your data is safe!
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              This error won't delete any of your saved decks or progress. We just need to fix a small formatting issue.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}