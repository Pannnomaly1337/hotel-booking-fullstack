import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
  {
    variants: {
      variant: {
        primary: "bg-brand text-ink hover:bg-brand-light",
        secondary:
          "bg-surface text-fg border border-border-2 hover:border-brand/60",
        ghost: "text-muted hover:text-fg",
        danger: "bg-danger text-ink hover:opacity-90",
      },
      size: {
        sm: "h-9 px-4 text-sm rounded-lg",
        md: "h-11 px-5 text-sm rounded-xl",
        lg: "h-13 px-7 text-base rounded-xl py-3.5",
      },
      pill: { true: "rounded-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", pill: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, pill, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, pill }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
