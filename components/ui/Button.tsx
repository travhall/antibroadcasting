import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center font-display uppercase tracking-widest justify-center rounded-button font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-(--background) cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "relative z-0 overflow-hidden border-2 border-button-primary-border bg-button-primary-surface text-button-primary-text hover:text-button-primary-text-hover before:absolute before:inset-0 before:-z-10 before:bg-button-primary-surface-hover before:scale-y-0 before:origin-bottom before:transition-transform before:duration-300 before:ease-in-out hover:before:scale-y-100 hover:before:origin-top active:before:bg-button-primary-surface-active",
        secondary:
          "relative z-0 overflow-hidden border-2 border-button-secondary-border bg-button-secondary-surface text-button-secondary-text hover:text-button-secondary-text-hover before:absolute before:inset-0 before:-z-10 before:bg-button-secondary-surface-hover before:scale-y-0 before:origin-bottom before:transition-transform before:duration-300 before:ease-in-out hover:before:scale-y-100 hover:before:origin-top active:before:bg-button-secondary-surface-active",
        neutral:
          "relative z-0 overflow-hidden border-2 border-button-neutral-border bg-button-neutral-surface text-button-neutral-text hover:text-button-neutral-text-hover before:absolute before:inset-0 before:-z-10 before:bg-button-neutral-surface-hover before:scale-y-0 before:origin-bottom before:transition-transform before:duration-300 before:ease-in-out hover:before:scale-y-100 hover:before:origin-top active:before:bg-button-neutral-surface-active",
        outline:
          "relative z-0 overflow-hidden bg-button-outline-surface border-2 border-button-outline-border text-button-outline-text hover:text-button-outline-text-hover hover:border-button-outline-border-hover before:absolute before:inset-0 before:-z-10 before:bg-button-outline-surface-hover before:scale-y-0 before:origin-bottom before:transition-transform before:duration-300 before:ease-in-out hover:before:scale-y-100 hover:before:origin-top active:before:bg-button-outline-surface-active",
        ghost:
          "relative z-0 overflow-hidden bg-button-outline-surface text-button-outline-text hover:text-button-outline-text-hover before:absolute before:inset-0 before:-z-10 before:bg-button-outline-surface-hover before:scale-y-0 before:origin-bottom before:transition-transform before:duration-300 before:ease-in-out hover:before:scale-y-100 hover:before:origin-top active:before:bg-button-outline-surface-active",
        link: "text-text-secondary hover:text-text-primary underline underline-offset-2 hover:underline-offset-4 decoration-text-primary/50 hover:decoration-text-primary p-0 h-auto",
        destructive:
          "relative z-0 overflow-hidden border-2 border-button-destructive-border bg-button-destructive-surface text-button-destructive-text hover:text-button-destructive-text-hover focus-visible:ring-focus-ring-error before:absolute before:inset-0 before:-z-10 before:bg-button-destructive-surface-hover before:scale-y-0 before:origin-bottom before:transition-transform before:duration-300 before:ease-in-out hover:before:scale-y-100 hover:before:origin-top active:before:bg-button-destructive-surface-active",
      },
      size: {
        sm: "min-h-11 px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
        icon: "min-h-11 min-w-11 px-3 py-2",
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
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
