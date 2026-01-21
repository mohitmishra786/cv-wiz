/**
 * Input Component
 * Styled input field with label and error support
 */

import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, helperText, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`
            w-full px-4 py-3 border rounded-xl outline-none transition-shadow
            ${error
                            ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                        }
            ${className}
          `}
                    {...props}
                />
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
