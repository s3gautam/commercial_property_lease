import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatInr } from "@proplease/utils";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { apiClient } from "@/lib/api/client";
import type { ApiProperty, ApiVerificationReport } from "@/lib/api/types";
import { useAuthStore } from "@/lib/store/auth-store";

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const propertyQuery = useQuery({
    queryKey: ["properties", id],
    queryFn: () => apiClient.get<ApiProperty>(`/properties/${id}`),
  });

  if (propertyQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator />
      </View>
    );
  }

  if (propertyQuery.isError || !propertyQuery.data?.data) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6 dark:bg-black">
        <Text className="text-gray-500 dark:text-gray-400">
          We couldn&apos;t find that property.
        </Text>
      </View>
    );
  }

  const property = propertyQuery.data.data;

  return (
    <ScrollView className="flex-1 bg-white dark:bg-black" contentContainerClassName="px-6 py-6">
      <Text className="text-2xl font-semibold text-black dark:text-white">{property.title}</Text>
      <Text className="mt-1 text-gray-500 dark:text-gray-400">
        {property.address}, {property.city}, {property.state}, {property.country}
      </Text>

      <View className="mt-6 flex-row flex-wrap gap-3">
        <Stat label="Monthly rent" value={`${formatInr(property.monthly_rent)}/mo`} />
        <Stat label="Area" value={`${property.area_sqft.toLocaleString()} sqft`} />
        <Stat label="Status" value={property.status} />
      </View>

      <Text className="mt-6 leading-relaxed text-black dark:text-white">
        {property.description}
      </Text>

      <VerificationSection propertyId={property.id} />

      <View className="mt-4 rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-700">
        <Text className="font-medium text-black dark:text-white">Chat with landlord</Text>
        <Text className="mt-1 text-gray-500 dark:text-gray-400">
          Chat threads are not implemented yet — this listing will let you message the landlord
          directly once that lands.
        </Text>
      </View>
    </ScrollView>
  );
}

function VerificationSection({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const reportQuery = useQuery({
    queryKey: ["verification", propertyId],
    queryFn: () => apiClient.get<ApiVerificationReport>(`/properties/${propertyId}/verification`),
    retry: false,
  });

  const generate = useMutation({
    mutationFn: () =>
      apiClient.post<ApiVerificationReport>(`/properties/${propertyId}/verification`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification", propertyId] });
    },
  });

  const report = reportQuery.data?.data;

  return (
    <View className="mt-8 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <Text className="font-medium text-black dark:text-white">AI Verification Report</Text>

      {reportQuery.isLoading && <ActivityIndicator className="mt-2" />}

      {report ? (
        <View className="mt-2">
          <Text className="leading-relaxed text-black dark:text-white">{report.summary}</Text>
          {report.risk_score !== null && (
            <Text className="mt-2 text-gray-500 dark:text-gray-400">
              Risk score: {report.risk_score}/100
            </Text>
          )}
        </View>
      ) : (
        !reportQuery.isLoading && (
          <View className="mt-2">
            <Text className="text-gray-500 dark:text-gray-400">
              No verification report yet for this listing.
            </Text>
            {user ? (
              <Pressable
                onPress={() => generate.mutate()}
                disabled={generate.isPending}
                className="mt-3 items-center rounded-md border border-gray-200 px-3 py-2 disabled:opacity-50 dark:border-gray-700"
              >
                {generate.isPending ? (
                  <ActivityIndicator />
                ) : (
                  <Text className="text-black dark:text-white">Generate verification report</Text>
                )}
              </Pressable>
            ) : (
              <Pressable onPress={() => router.push("/login")} className="mt-2">
                <Text className="text-black underline dark:text-white">
                  Log in to generate a verification report.
                </Text>
              </Pressable>
            )}
            {generate.isError && (
              <Text className="mt-2 text-red-500">
                Couldn&apos;t generate a report right now. Please try again.
              </Text>
            )}
          </View>
        )
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
      <Text className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </Text>
      <Text className="mt-1 font-medium capitalize text-black dark:text-white">{value}</Text>
    </View>
  );
}
