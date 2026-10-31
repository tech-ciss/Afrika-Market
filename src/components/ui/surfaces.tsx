import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-earth-200 bg-white shadow-card", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-earth-100 px-5 py-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-semibold text-earth-900", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-t border-earth-100 px-5 py-4", className)} {...props} />;
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "success" | "warning" | "danger" | "brand" | "info" }) {
  const tones = {
    neutral: "bg-earth-100 text-earth-700 ring-earth-200",
    success: "bg-forest-50 text-forest-700 ring-forest-200",
    warning: "bg-sun-50 text-sun-700 ring-sun-200",
    danger: "bg-kola-50 text-kola-700 ring-kola-100",
    brand: "bg-brand-50 text-brand-700 ring-brand-200",
    info: "bg-sky-50 text-sky-700 ring-sky-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} {...props} />;
}

export function Alert({
  tone = "error",
  className,
  children,
}: {
  tone?: "error" | "success" | "info" | "warning";
  className?: string;
  children: React.ReactNode;
}) {
  const tones = {
    error: "border-kola-100 bg-kola-50 text-kola-700",
    success: "border-forest-200 bg-forest-50 text-forest-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
    warning: "border-sun-200 bg-sun-50 text-brand-950",
  };
  return (
    <div role="alert" className={cn("rounded-xl border px-4 py-3 text-sm", tones[tone], className)}>
      {children}
    </div>
  );
}
