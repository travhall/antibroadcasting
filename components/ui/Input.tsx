import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, required, id, ...props }, ref) => {
    const inputId = id || `input-${React.useId()}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-label-text"
          >
            {label}
            {required && <span className="text-text-error ml-1">*</span>}
          </label>
        )}
        <input
          id={inputId}
          className={`w-full rounded-input bg-input-surface border px-3.5 py-2.5 text-sm text-input-text placeholder:text-input-text-placeholder outline-none transition focus:ring-2 focus:ring-input-border-focus focus:border-transparent ${
            error ? "border-text-error" : "border-input-border"
          } ${className || ""}`}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-text-error">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
