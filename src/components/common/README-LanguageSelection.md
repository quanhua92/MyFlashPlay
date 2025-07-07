# Language Selection Dialog

A beautiful, animated language selection dialog that appears when users first visit MyFlashPlay without a language preference.

## Features

✨ **Visual Appeal**
- Gradient header with animated decorative elements
- Smooth entrance animations with staggered list items
- Interactive hover effects with scale and color transitions
- Responsive design with backdrop blur

🌍 **Language Support**
- Support for all 8 languages: English, Spanish, Chinese, Vietnamese, French, German, Japanese, Korean
- Native language names with flag emojis
- Auto-detection of user preferences
- localStorage persistence

🔧 **User Experience**
- First-time visitor detection
- Non-intrusive (can be dismissed)
- Remembers user choice
- Smooth language switching with React 19 useTransition

## Components

### `LanguageSelectionDialog.tsx`
Main dialog component with:
- Animated backdrop and modal
- Language selection grid
- Interactive buttons with hover effects
- Framer Motion animations

### `useFirstTimeLanguageSelection.ts`
Custom hook managing:
- First-time user detection
- localStorage state management
- Language preference persistence
- Dialog state control

## Usage

The dialog automatically appears for new users. It can also be triggered manually:

```tsx
import { LanguageSelectionDialog } from '@/components/common/LanguageSelectionDialog';
import { useFirstTimeLanguageSelection } from '@/hooks/useFirstTimeLanguageSelection';

function MyComponent() {
  const { showDialog, handleLanguageSelect, handleDialogClose } = useFirstTimeLanguageSelection();
  
  return (
    <LanguageSelectionDialog
      isOpen={showDialog}
      onSelect={handleLanguageSelect}
      onClose={handleDialogClose}
    />
  );
}
```

## Integration

The dialog is integrated into the root layout (`RootLayout.tsx`) and automatically manages the first-time user experience.

## Preview

Visit the Settings page for a preview button to test the dialog appearance and functionality.

## Customization

The dialog can be customized by modifying:
- Colors in Tailwind classes
- Animation timings in Framer Motion props
- Language selection logic in the hook
- Visual styling and layout