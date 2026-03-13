import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-button font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-button-primary-surface text-button-primary-text hover:bg-button-primary-surface-hover focus:ring-button-primary-surface",
        secondary:
          "bg-button-secondary-surface text-button-secondary-text hover:bg-button-secondary-surface-hover focus:ring-button-secondary-surface",
        neutral:
          "bg-button-neutral-surface text-button-neutral-text hover:bg-button-neutral-surface-hover focus:ring-button-neutral-surface",
        outline:
          "bg-button-outline-surface border-2 border-button-outline-border text-button-outline-text hover:bg-button-outline-surface-hover hover:text-button-outline-text-hover hover:border-button-outline-border/50 focus:ring-button-outline-border",
        ghost:
          "text-text-secondary hover:text-text-primary hover:bg-bg-subtle focus:ring-border-default",
        link: "text-text-secondary hover:text-text-primary underline-offset-4 hover:underline focus:ring-border-default p-0 h-auto",
        destructive:
          "bg-button-destructive-surface text-button-destructive-text hover:bg-button-destructive-surface-hover focus:ring-button-destructive-surface",
      },
      size: {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
        icon: "p-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
