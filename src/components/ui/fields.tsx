import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-earth-800", className)} {...props} />;
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-earth-300 bg-white px-3.5 py-2.5 text-sm text-earth-900 placeholder:text-earth-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-earth-100",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-xl border border-earth-300 bg-white px-3.5 py-2.5 text-sm text-earth-900 placeholder:text-earth-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full appearance-none rounded-xl border border-earth-300 bg-white bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%235c5a50%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat px-3.5 py-2.5 pr-9 text-sm text-earth-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";

export function Checkbox({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn("h-5 w-5 rounded border-earth-300 accent-brand-700 focus:ring-brand-500", className)}
      {...props}
    />
  );
}

/** Champ avec label + message d'erreur serveur. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  required,
  className,
}: {
  label?: string;
  htmlFor?: string;
  error?: string | null;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {label ? (
        <Label htmlFor={htmlFor}>
          {label}
          {required ? <span className="ml-0.5 text-kola-500" aria-hidden>*</span> : null}
        </Label>
      ) : null}
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-earth-500">{hint}</p> : null}
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-kola-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
