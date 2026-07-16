import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";

import { apiClient } from "@/lib/api/client";
import type { ApiPropertySearchResponse } from "@/lib/api/types";

const rentFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const search = useMutation({
    mutationFn: (q: string) =>
      apiClient.get<ApiPropertySearchResponse>(`/properties/search?q=${encodeURIComponent(q)}`),
  });

  const results = search.data?.data;

  return (
    <View className="flex-1 bg-white px-4 pt-4 dark:bg-black">
      <Text className="mb-1 text-2xl font-semibold text-black dark:text-white">AI Search</Text>
      <Text className="mb-4 text-gray-500 dark:text-gray-400">
        Describe the space you need in plain language.
      </Text>

      <View className="mb-4 flex-row gap-2">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="e.g. office in Austin under $5000"
          className="flex-1 rounded-md border border-gray-200 px-3 py-3 text-black dark:border-gray-800 dark:text-white"
        />
        <Pressable
          onPress={() => query.trim() && search.mutate(query)}
          disabled={search.isPending || !query.trim()}
          className="items-center justify-center rounded-md bg-black px-4 disabled:opacity-50 dark:bg-white"
        >
          {search.isPending ? (
            <ActivityIndicator />
          ) : (
            <Text className="font-medium text-white dark:text-black">Search</Text>
          )}
        </Pressable>
      </View>

      {search.isError && (
        <Text className="text-red-500">Something went wrong. Please try again.</Text>
      )}

      {results && (
        <FlatList
          data={results.properties}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-3 pb-8"
          ListHeaderComponent={
            results.criteria.explanation ? (
              <Text className="mb-2 text-gray-500 dark:text-gray-400">
                {results.criteria.explanation}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <Text className="mt-4 text-gray-500 dark:text-gray-400">
              No properties matched that search.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/property/${item.id}`)}
              className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
            >
              <Text className="text-lg font-medium text-black dark:text-white">{item.title}</Text>
              <Text className="mt-1 text-gray-500 dark:text-gray-400">
                {item.city}, {item.state}
              </Text>
              <Text className="mt-1 font-medium text-black dark:text-white">
                {rentFormatter.format(item.monthly_rent)}/mo
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
