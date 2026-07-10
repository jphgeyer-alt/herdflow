"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/admin/Field";
import { Button } from "@/components/admin/Button";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        label="Email address"
        type="email"
        autoComplete="username"
        onChange={(event) => setEmail(event.target.value)}
        required
        value={email}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        onChange={(event) => setPassword(event.target.value)}
        required
        value={password}
      />

      <Button className="w-full" loading={isLoading} type="submit">
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>

      {errorMessage && (
        <p aria-live="polite" className="text-sm font-semibold text-red-600" role="status">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
