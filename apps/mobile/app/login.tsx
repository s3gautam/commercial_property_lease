import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { apiClient } from "@/lib/api/client";
import type { ApiAuthResponse } from "@/lib/api/types";
import { useAuthStore } from "@/lib/store/auth-store";

type Step = "request" | "verify";

interface RequestForm {
  email: string;
}

interface VerifyForm {
  code: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");

  const requestForm = useForm<RequestForm>({ defaultValues: { email: "" } });
  const verifyForm = useForm<VerifyForm>({ defaultValues: { code: "" } });

  const requestOtp = useMutation({
    mutationFn: (values: RequestForm) =>
      apiClient.post<{ status: string }>("/auth/otp/request", { email: values.email }),
    onSuccess: (_response, values) => {
      setEmail(values.email);
      setStep("verify");
    },
  });

  const verifyOtp = useMutation({
    mutationFn: (values: VerifyForm) =>
      apiClient.post<ApiAuthResponse>("/auth/otp/verify", { email, code: values.code }),
    onSuccess: (response) => {
      if (!response.data) return;
      setSession(response.data.user, response.data.tokens);
      router.replace("/onboarding");
    },
  });

  return (
    <View className="flex-1 gap-6 bg-white px-6 py-8 dark:bg-black">
      <View>
        <Text className="text-2xl font-semibold text-black dark:text-white">Log in</Text>
        <Text className="mt-1 text-gray-500 dark:text-gray-400">
          We&apos;ll email you a one-time code — no password needed.
        </Text>
      </View>

      {step === "request" ? (
        <View className="gap-4">
          <Controller
            control={requestForm.control}
            name="email"
            rules={{ required: true }}
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                placeholder="you@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                className="rounded-md border border-gray-200 px-3 py-3 text-black dark:border-gray-800 dark:text-white"
              />
            )}
          />

          <Pressable
            onPress={requestForm.handleSubmit((values) => requestOtp.mutate(values))}
            disabled={requestOtp.isPending}
            className="items-center rounded-md bg-black px-4 py-3 disabled:opacity-50 dark:bg-white"
          >
            {requestOtp.isPending ? (
              <ActivityIndicator />
            ) : (
              <Text className="font-medium text-white dark:text-black">Send code</Text>
            )}
          </Pressable>

          {requestOtp.isError && (
            <Text className="text-red-500">Couldn&apos;t send a code. Please try again.</Text>
          )}
        </View>
      ) : (
        <View className="gap-4">
          <Text className="text-black dark:text-white">
            Enter the 6-digit code sent to <Text className="font-medium">{email}</Text>
          </Text>

          <Controller
            control={verifyForm.control}
            name="code"
            rules={{ required: true, minLength: 6, maxLength: 6 }}
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                className="rounded-md border border-gray-200 px-3 py-3 tracking-[8px] text-black dark:border-gray-800 dark:text-white"
              />
            )}
          />

          <Pressable
            onPress={verifyForm.handleSubmit((values) => verifyOtp.mutate(values))}
            disabled={verifyOtp.isPending}
            className="items-center rounded-md bg-black px-4 py-3 disabled:opacity-50 dark:bg-white"
          >
            {verifyOtp.isPending ? (
              <ActivityIndicator />
            ) : (
              <Text className="font-medium text-white dark:text-black">Verify and continue</Text>
            )}
          </Pressable>

          {verifyOtp.isError && (
            <Text className="text-red-500">Invalid or expired code. Try again.</Text>
          )}

          <Pressable onPress={() => setStep("request")}>
            <Text className="text-gray-500 underline dark:text-gray-400">
              Use a different email
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
