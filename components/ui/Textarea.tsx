import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, required, id, ...props }, ref) => {
    const textareaId = id || `textarea-${React.useId()}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-label-text"
          >
            {label}
            {required && <span className="text-text-error ml-1">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          aria-required={required}
          aria-invalid={error ? true : undefined}
          className={`w-full rounded-input bg-input-surface border px-3.5 py-2.5 text-sm text-input-text placeholder:text-input-text-placeholder outline-none transition focus:ring-2 focus:ring-input-ring-focus focus:border-transparent resize-y ${
            error ? "border-text-error" : "border-input-border"
          } ${className || ""}`}
          ref={ref}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="text-xs text-text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
