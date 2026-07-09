"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setErrorMessage(typeof payload.error === "string" ? payload.error : "Login failed.");
        setIsLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setErrorMessage("Network error during login.");
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label className="space-y-1 text-sm text-[#244367]">
        <span>Admin Username</span>
        <input
          className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
          onChange={(event) => setUsername(event.target.value)}
          required
          value={username}
        />
      </label>

      <label className="space-y-1 text-sm text-[#244367]">
        <span>Password</span>
        <input
          className="w-full rounded-lg border border-[#cdd8e7] px-3 py-2"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>

      <button
        className="bg-brand-navy inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? "Signing In..." : "Sign In"}
      </button>

      {errorMessage && (
        <p aria-live="polite" className="text-sm font-semibold text-[#8b1f1f]" role="status">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
