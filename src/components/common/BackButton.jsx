import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';

const BackButton = ({
  label,
  fallbackPath,
  className = '',
  iconClassName = 'w-4 h-4',
  variant = 'pill', // 'pill' | 'circle' | 'minimal'
  onClick,
}) => {
  const { goBack } = useNavigation();

  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) {
      onClick();
    } else {
      goBack(fallbackPath);
    }
  };

  if (variant === 'circle') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md border border-kisan-border text-kisan-dark flex items-center justify-center shadow-sm hover:bg-gray-100 active:scale-95 transition-all tap-effect flex-shrink-0 ${className}`}
        aria-label={label || 'Go back'}
        title={label || 'Back'}
      >
        <ArrowLeft className={iconClassName} />
      </button>
    );
  }

  if (variant === 'minimal') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center space-x-1.5 text-xs font-bold text-kisan-muted hover:text-kisan-dark transition-colors tap-effect ${className}`}
        aria-label={label || 'Go back'}
      >
        <ArrowLeft className={iconClassName} />
        {label && <span>{label}</span>}
      </button>
    );
  }

  // Default 'pill'
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center space-x-2 text-xs font-bold text-kisan-dark bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-kisan-border shadow-sm hover:bg-gray-50 active:scale-95 transition-all tap-effect ${className}`}
      aria-label={label || 'Go back'}
    >
      <ArrowLeft className={iconClassName} />
      <span>{label || 'Back'}</span>
    </button>
  );
};

export default BackButton;
