"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  id: string;
  name?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  required?: boolean;
  autoComplete?: string;
  error?: string;
  minLength?: number;
}

export function PasswordInput({
  id,
  name,
  placeholder,
  value,
  onChange,
  label,
  required,
  autoComplete,
  error,
  minLength,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-[#244367]">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name || id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          minLength={minLength}
          className={`w-full rounded-lg border px-4 py-3 pr-12 text-[#1B3A6B] placeholder-[#9aabb9] transition focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 ${
            error ? "border-red-400 bg-red-50" : "border-[#cdd8e7] bg-white"
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aabb9] transition hover:text-[#5d7497] focus:text-[#2E7D32] focus:outline-none"
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {show && !error && <p className="mt-1 text-xs text-amber-600">Password is visible</p>}
    </div>
  );
}
