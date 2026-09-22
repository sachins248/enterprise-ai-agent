import { useTheme } from '../../context/ThemeContext';
import Icon from './Icon';

/**
 * ThemeToggle — a small icon button that swaps between the sun (switch to
 * light) and moon (switch to dark) icon depending on the current theme.
 */
export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`flex items-center justify-center w-8 h-8 border border-hairline text-ink-2
        hover:border-accent hover:text-accent transition-colors duration-150 ${className}`}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
    </button>
  );
}
