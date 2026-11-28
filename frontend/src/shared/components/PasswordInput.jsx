import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Reusable password input with an accessible show/hide toggle button.
 */
const PasswordInput = ({
  className = '',
  containerClassName = '',
  iconClassName = 'w-4 h-4',
  ...props
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative w-full ${containerClassName}`}>
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`${className} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-kisan-dark rounded-lg focus:outline-none"
      >
        {visible ? <EyeOff className={iconClassName} /> : <Eye className={iconClassName} />}
      </button>
    </div>
  );
};

export default PasswordInput;
