import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { apiClient } from "@/lib/api/client";
import type { ApiTenantProfile } from "@/lib/api/types";
import { useAuthStore } from "@/lib/store/auth-store";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const profileQuery = useQuery({
    queryKey: ["tenant-profile", "me"],
    queryFn: () => apiClient.get<ApiTenantProfile>("/tenant-profile/me"),
    enabled: Boolean(user),
    retry: false,
  });

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-white px-6 dark:bg-black">
        <Text className="text-center text-gray-500 dark:text-gray-400">
          Log in to manage your profile, KYC, and leases.
        </Text>
        <Pressable
          onPress={() => router.push("/login")}
          className="rounded-md bg-black px-5 py-2.5 dark:bg-white"
        >
          <Text className="font-medium text-white dark:text-black">Log in</Text>
        </Pressable>
      </View>
    );
  }

  const profile = profileQuery.data?.data;

  return (
    <View className="flex-1 gap-6 bg-white px-6 py-8 dark:bg-black">
      <View>
        <Text className="text-2xl font-semibold text-black dark:text-white">Your account</Text>
        <Text className="mt-1 text-gray-500 dark:text-gray-400">{user.email ?? user.phone}</Text>
      </View>

      <View className="gap-1 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        <Text className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Company
        </Text>
        <Text className="text-black dark:text-white">
          {profile?.company_name ?? "Not set yet"}
        </Text>
      </View>

      <View className="gap-1 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        <Text className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Business type
        </Text>
        <Text className="text-black dark:text-white">
          {profile?.business_type ?? "Not set yet"}
        </Text>
      </View>

      <Pressable
        onPress={() => router.push("/onboarding")}
        className="items-center rounded-md border border-gray-200 px-4 py-3 dark:border-gray-800"
      >
        <Text className="font-medium text-black dark:text-white">Edit profile</Text>
      </Pressable>

      <Pressable
        onPress={clearSession}
        className="items-center rounded-md bg-black px-4 py-3 dark:bg-white"
      >
        <Text className="font-medium text-white dark:text-black">Log out</Text>
      </Pressable>
    </View>
  );
}
