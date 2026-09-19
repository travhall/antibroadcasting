import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, required, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || `input-${generatedId}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block font-mono text-xs uppercase tracking-widest text-text-tertiary"
          >
            {label}
            {required && <span className="text-text-accent ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <input
          id={inputId}
          aria-describedby={error ? `${inputId}-error` : undefined}
          aria-required={required}
          aria-invalid={error ? true : undefined}
          className={`w-full rounded-input bg-input-surface border min-h-11 px-3.5 py-2.5 text-base sm:text-sm text-input-text placeholder:text-input-text-placeholder outline-none transition focus:ring-2 focus:ring-input-ring-focus focus:border-transparent ${
            error ? "border-text-error" : "border-input-border"
          } ${className || ""}`}
          ref={ref}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
