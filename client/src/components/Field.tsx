"use client";

import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function Field({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const isPasswordField = props.type === "password";
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPasswordField ? (showPassword ? "text" : "password") : props.type;

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <div className="relative">
        <input
          className="h-10 w-full rounded-md border border-border bg-white px-3 pr-10 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-blue-100"
          {...props}
          type={inputType}
        />
        {isPasswordField && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <select
        className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-blue-100"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function TextareaField({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <textarea
        className="min-h-24 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-blue-100"
        {...props}
      />
    </label>
  );
}
