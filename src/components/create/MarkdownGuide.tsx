import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function MarkdownGuide() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          <span className="font-medium">Markdown Format Guide</span>
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
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Basic Q&A Format
                </h4>
                <div className="bg-white dark:bg-gray-800 rounded p-3 font-mono text-xs border">
                  <div className="text-gray-600 dark:text-gray-400 mb-2"># Deck Title</div>
                  <div className="text-gray-600 dark:text-gray-400 mb-2">Deck description here</div>
                  <div className="mb-1">## Q: What is 2+2?</div>
                  <div className="mb-3">A: 4</div>
                  <div className="mb-1">## Q: Capital of France?</div>
                  <div>A: Paris</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Multiple Choice</h4>
                <div className="bg-white dark:bg-gray-800 rounded p-3 font-mono text-xs border">
                  <div className="mb-1">## Q: What is 2+2?</div>
                  <div className="mb-1">- A) 3</div>
                  <div className="mb-1">- B) 4</div>
                  <div className="mb-1">- C) 5</div>
                  <div className="mb-3">**Answer: B) 4**</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">With Categories</h4>
                <div className="bg-white dark:bg-gray-800 rounded p-3 font-mono text-xs border">
                  <div className="mb-1">## Math: What is 5×3?</div>
                  <div className="mb-3">A: 15</div>
                  <div className="mb-1">## History: When did WWII end?</div>
                  <div>A: 1945</div>
                </div>
              </div>

              <div className="text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 rounded p-3">
                <strong>Tips:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Use ## for questions (H2 headers)</li>
                  <li>Start questions with "Q:" or "Category:"</li>
                  <li>Use "A:" for simple answers</li>
                  <li>Bold (**text**) for multiple choice answers</li>
                  <li>Categories help organize your cards</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}