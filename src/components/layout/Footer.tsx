import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t dark:border-gray-800 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>for young learners</span>
          </div>
          <div className="mt-2 sm:mt-0 text-sm text-gray-500 dark:text-gray-500">
            © 2024 FlashPlay - Learn, Play, Grow!
          </div>
        </div>
      </div>
    </footer>
  );
}