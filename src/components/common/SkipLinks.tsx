import { motion } from 'framer-motion';

export function SkipLinks() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      whileFocus={{ opacity: 1, y: 0 }}
      className="sr-only focus:not-sr-only absolute top-4 left-4 z-50"
    >
      <nav aria-label="Skip links">
        <ul className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 space-y-1">
          <li>
            <a
              href="#main-content"
              className="block px-4 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Skip to main content
            </a>
          </li>
          <li>
            <a
              href="#navigation"
              className="block px-4 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Skip to navigation
            </a>
          </li>
          <li>
            <a
              href="#footer"
              className="block px-4 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Skip to footer
            </a>
          </li>
        </ul>
      </nav>
    </motion.div>
  );
}