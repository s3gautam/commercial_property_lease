import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { apiClient, ApiError } from "@/lib/api/client";
import type { ApiTenantProfile } from "@/lib/api/types";
import { useAuthStore } from "@/lib/store/auth-store";

interface ProfileForm {
  companyName: string;
  businessType: string;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const { control, handleSubmit, reset } = useForm<ProfileForm>({
    defaultValues: { companyName: "", businessType: "" },
  });

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  const existingProfile = useQuery({
    queryKey: ["tenant-profile", "me"],
    queryFn: () => apiClient.get<ApiTenantProfile>("/tenant-profile/me"),
    enabled: Boolean(user),
    retry: false,
  });

  useEffect(() => {
    const profile = existingProfile.data?.data;
    if (profile) {
      reset({
        companyName: profile.company_name ?? "",
        businessType: profile.business_type ?? "",
      });
    }
  }, [existingProfile.data, reset]);

  const saveProfile = useMutation({
    mutationFn: (values: ProfileForm) =>
      apiClient.put<ApiTenantProfile>("/tenant-profile/me", {
        company_name: values.companyName || null,
        business_type: values.businessType || null,
      }),
    onSuccess: () => router.replace("/(tabs)"),
  });

  if (!user) return null;

  return (
    <View className="flex-1 gap-6 bg-white px-6 py-8 dark:bg-black">
      <View>
        <Text className="text-2xl font-semibold text-black dark:text-white">
          Create your profile
        </Text>
        <Text className="mt-1 text-gray-500 dark:text-gray-400">
          Tell us a bit about your business so landlords know who they&apos;re leasing to.
        </Text>
      </View>

      <View className="gap-4">
        <Controller
          control={control}
          name="companyName"
          render={({ field }) => (
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              placeholder="Company name"
              className="rounded-md border border-gray-200 px-3 py-3 text-black dark:border-gray-800 dark:text-white"
            />
          )}
        />

        <Controller
          control={control}
          name="businessType"
          render={({ field }) => (
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              placeholder="Business type (Retail, Office, Restaurant…)"
              className="rounded-md border border-gray-200 px-3 py-3 text-black dark:border-gray-800 dark:text-white"
            />
          )}
        />

        <Pressable
          onPress={handleSubmit((values) => saveProfile.mutate(values))}
          disabled={saveProfile.isPending}
          className="items-center rounded-md bg-black px-4 py-3 disabled:opacity-50 dark:bg-white"
        >
          {saveProfile.isPending ? (
            <ActivityIndicator />
          ) : (
            <Text className="font-medium text-white dark:text-black">Save and continue</Text>
          )}
        </Pressable>

        {saveProfile.isError && (
          <Text className="text-red-500">
            {saveProfile.error instanceof ApiError
              ? saveProfile.error.message
              : "Something went wrong. Please try again."}
          </Text>
        )}

        <Pressable onPress={() => router.replace("/(tabs)")}>
          <Text className="text-center text-gray-500 underline dark:text-gray-400">
            Skip for now
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
