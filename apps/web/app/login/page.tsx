"use client";

import { useMutation } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GoogleSignInButton } from "@/components/google-sign-in-button";
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

  const googleLogin = useMutation({
    mutationFn: (idToken: string) =>
      apiClient.post<ApiAuthResponse>("/auth/google", { id_token: idToken }),
    onSuccess: (response) => {
      if (!response.data) return;
      setSession(response.data.user, response.data.tokens);
      router.push("/onboarding");
    },
  });

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
    <main className="bg-mesh flex min-h-[calc(100vh-65px)] items-center justify-center px-6 py-16">
      <div className="animate-fade-up w-full max-w-sm rounded-3xl border border-border bg-surface p-8 shadow-card">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-gradient text-white shadow-glow">
            <KeyRound className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {step === "request"
              ? "Sign in with Google, or we'll email you a one-time code."
              : "Enter the code we sent you to continue."}
          </p>
        </div>

        {step === "request" ? (
          <div className="flex flex-col gap-6">
            <div className="flex justify-center">
              <GoogleSignInButton onCredential={(idToken) => googleLogin.mutate(idToken)} />
            </div>

            {googleLogin.isError && (
              <p className="text-center text-sm text-danger">
                Google sign-in failed. Please try again.
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              or
              <div className="h-px flex-1 bg-border" />
            </div>

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
                  className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-shadow focus:shadow-glow"
                  placeholder="you@company.com"
                />
              </label>

              <button
                type="submit"
                disabled={requestOtp.isPending}
                className="rounded-xl bg-accent-gradient px-4 py-2.5 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
              >
                {requestOtp.isPending ? "Sending…" : "Send code"}
              </button>

              {requestOtp.isError && (
                <p className="text-sm text-danger">
                  Couldn&apos;t send a code. Please try again.
                </p>
              )}
            </form>
          </div>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              verifyOtp.mutate();
            }}
          >
            <p className="text-center text-sm">
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
                className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-center text-lg tracking-[0.5em] outline-none transition-shadow focus:shadow-glow"
                placeholder="000000"
              />
            </label>

            <button
              type="submit"
              disabled={verifyOtp.isPending}
              className="rounded-xl bg-accent-gradient px-4 py-2.5 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
            >
              {verifyOtp.isPending ? "Verifying…" : "Verify and continue"}
            </button>

            {verifyOtp.isError && (
              <p className="text-center text-sm text-danger">Invalid or expired code. Try again.</p>
            )}

            <button
              type="button"
              onClick={() => setStep("request")}
              className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
