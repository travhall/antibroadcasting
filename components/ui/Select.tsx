import React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, error, required, id, options, placeholder, ...props },
    ref,
  ) => {
    const selectId = id || `select-${React.useId()}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-label-text"
          >
            {label}
            {required && <span className="text-text-error ml-1">*</span>}
          </label>
        )}
        <select
          id={selectId}
          aria-describedby={error ? `${selectId}-error` : undefined}
          aria-required={required}
          aria-invalid={error ? true : undefined}
          className={`w-full rounded-input bg-input-surface border px-3.5 py-2.5 text-sm text-input-text outline-none transition focus:ring-2 focus:ring-input-ring-focus focus:border-transparent ${
            error ? "border-text-error" : "border-input-border"
          } ${className || ""}`}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="text-xs text-text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

export { Select };
