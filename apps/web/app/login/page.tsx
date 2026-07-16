"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiClient } from "@/lib/api/client";
import type { ApiAuthResponse } from "@/lib/api/types";
import { useAuthStore } from "@/lib/store/auth-store";

type Step = "request" | "verify";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const requestOtp = useMutation({
    mutationFn: () => apiClient.post<{ status: string }>("/auth/otp/request", { email }),
    onSuccess: () => setStep("verify"),
  });

  const verifyOtp = useMutation({
    mutationFn: () =>
      apiClient.post<ApiAuthResponse>("/auth/otp/verify", { email, code }),
    onSuccess: (response) => {
      if (!response.data) return;
      setSession(response.data.user, response.data.tokens);
      router.push("/onboarding");
    },
  });

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll email you a one-time code — no password needed.
        </p>
      </div>

      {step === "request" ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            requestOtp.mutate();
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="you@company.com"
            />
          </label>

          <button
            type="submit"
            disabled={requestOtp.isPending}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity disabled:opacity-50"
          >
            {requestOtp.isPending ? "Sending…" : "Send code"}
          </button>

          {requestOtp.isError && (
            <p className="text-sm text-red-500">
              Couldn&apos;t send a code. Please try again.
            </p>
          )}
        </form>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            verifyOtp.mutate();
          }}
        >
          <p className="text-sm">
            Enter the 6-digit code sent to <span className="font-medium">{email}</span>
          </p>

          <label className="flex flex-col gap-1.5 text-sm">
            Verification code
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="rounded-md border border-border bg-transparent px-3 py-2 tracking-[0.3em] outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="000000"
            />
          </label>

          <button
            type="submit"
            disabled={verifyOtp.isPending}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity disabled:opacity-50"
          >
            {verifyOtp.isPending ? "Verifying…" : "Verify and continue"}
          </button>

          {verifyOtp.isError && (
            <p className="text-sm text-red-500">Invalid or expired code. Try again.</p>
          )}

          <button
            type="button"
            onClick={() => setStep("request")}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Use a different email
          </button>
        </form>
      )}
    </main>
  );
}
