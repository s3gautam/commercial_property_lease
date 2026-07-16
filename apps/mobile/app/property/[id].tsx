import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { apiClient } from "@/lib/api/client";
import type { ApiProperty } from "@/lib/api/types";

const rentFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

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
        <Stat label="Monthly rent" value={`${rentFormatter.format(property.monthly_rent)}/mo`} />
        <Stat label="Area" value={`${property.area_sqft.toLocaleString()} sqft`} />
        <Stat label="Status" value={property.status} />
      </View>

      <Text className="mt-6 leading-relaxed text-black dark:text-white">
        {property.description}
      </Text>

      <View className="mt-8 rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-700">
        <Text className="font-medium text-black dark:text-white">AI Verification Report</Text>
        <Text className="mt-1 text-gray-500 dark:text-gray-400">
          Coming in Phase 5 (AI Services) — a VerificationAgent will surface risk signals and a
          confidence score for this listing here.
        </Text>
      </View>

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
