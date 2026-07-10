"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const FIELD_CLASS =
  "w-full rounded-lg border border-navy-100 bg-white px-3 py-2 text-sm text-navy-700 placeholder-navy-200 focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/15 disabled:bg-navy-25 disabled:text-navy-300";

function FieldWrapper({
  label,
  hint,
  error,
  required,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  if (!label) return children;
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-semibold text-navy-500">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="block text-xs text-navy-300">{hint}</span>}
      {error && <span className="block text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className = "", ...rest },
  ref,
) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={rest.required}>
      <input ref={ref} className={`${FIELD_CLASS} ${label ? "mt-1" : ""} ${className}`} {...rest} />
    </FieldWrapper>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className = "", children, ...rest },
  ref,
) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={rest.required}>
      <select ref={ref} className={`${FIELD_CLASS} ${label ? "mt-1" : ""} ${className}`} {...rest}>
        {children}
      </select>
    </FieldWrapper>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className = "", ...rest },
  ref,
) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={rest.required}>
      <textarea ref={ref} className={`${FIELD_CLASS} ${label ? "mt-1" : ""} ${className}`} {...rest} />
    </FieldWrapper>
  );
});
