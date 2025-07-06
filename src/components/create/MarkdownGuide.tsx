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
                  ✨ Simple Format (Recommended)
                </h4>
                <div className="bg-white dark:bg-gray-800 rounded p-3 font-mono text-xs border">
                  <div className="text-green-600 dark:text-green-400 mb-2"># Just write one line per card:</div>
                  <div className="mb-1">What is 2+2? :: 4</div>
                  <div className="mb-1">Capital of France? :: Paris</div>
                  <div className="mb-1">What color is the sky? :: Blue</div>
                  <div className="mb-1">The sun is a star :: true</div>
                  <div>Fish can fly :: false</div>
                </div>
                <div className="mt-2 text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 rounded p-2">
                  💡 <strong>That's it!</strong> Each line is a card. Question :: Answer. Super simple!
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🔧 Advanced: Multiple Choice</h4>
                <div className="bg-white dark:bg-gray-800 rounded p-3 font-mono text-xs border">
                  <div className="mb-1">What is 2+2?</div>
                  <div className="mb-1">- 3</div>
                  <div className="mb-1">- 4</div>
                  <div className="mb-1">- 5</div>
                  <div className="mb-3">&gt; 4</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🔧 Advanced: With Categories</h4>
                <div className="bg-white dark:bg-gray-800 rounded p-3 font-mono text-xs border">
                  <div className="mb-2"># Math</div>
                  <div className="mb-1">What is 5×3? :: 15</div>
                  <div className="mb-3">What is 10÷2? :: 5</div>
                  <div className="mb-2"># History</div>
                  <div>When did WWII end? :: 1945</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🔧 Advanced: With Images 🖼️</h4>
                <div className="bg-white dark:bg-gray-800 rounded p-3 font-mono text-xs border">
                  <div className="mb-1">What animal is this? ![Dog](https://example.com/dog.jpg) :: Dog</div>
                  <div className="mb-1">Identify this landmark: ![Tower](https://example.com/tower.jpg) :: Eiffel Tower</div>
                  <div className="mb-3">What fruit is shown? ![Apple](https://example.com/apple.jpg) :: Apple</div>
                  <div className="text-gray-500 text-xs italic">* Use ![Alt Text](Image URL) format for images</div>
                </div>
              </div>

              <div className="text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 rounded p-3">
                <strong>Quick Tips:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>Start simple:</strong> Just use "Question :: Answer" format</li>
                  <li><strong>Title is separate:</strong> Enter deck name in the title field above</li>
                  <li><strong>One line = one card:</strong> Each line becomes a flashcard</li>
                  <li><strong>True/false works:</strong> "The sky is blue :: true"</li>
                  <li><strong>When you need more:</strong> Add multiple choice with "- Option" and "&gt; Correct"</li>
                  <li><strong>Categories optional:</strong> Use "# Section Name" to group cards</li>
                  <li><strong>Images supported:</strong> Use "![Alt Text](Image URL)" format</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}