import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900",
        sun: "bg-sun-400 text-brand-950 hover:bg-sun-300 active:bg-sun-500",
        secondary: "border border-brand-200 bg-white text-brand-800 hover:border-brand-400 hover:bg-brand-50",
        dark: "bg-forest-700 text-white hover:bg-forest-800",
        ghost: "text-earth-700 hover:bg-earth-100",
        danger: "bg-kola-600 text-white hover:bg-kola-700",
        link: "text-brand-700 underline-offset-4 hover:underline",
      },
      size: {
        sm: "px-3.5 py-1.5 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-7 py-3.5 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
