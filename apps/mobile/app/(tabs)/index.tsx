import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";

import { apiClient } from "@/lib/api/client";
import type { ApiProperty } from "@/lib/api/types";

const PAGE_SIZE = 20;

const rentFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function BrowseScreen() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [city, setCity] = useState("");

  const propertiesQuery = useQuery({
    queryKey: ["properties", page, city],
    queryFn: () =>
      apiClient.get<ApiProperty[]>(
        `/properties?page=${page}&page_size=${PAGE_SIZE}${city ? `&city=${encodeURIComponent(city)}` : ""}`,
      ),
  });

  const properties = propertiesQuery.data?.data ?? [];
  const total = (propertiesQuery.data?.meta?.total as number | undefined) ?? 0;
  const hasNextPage = page * PAGE_SIZE < total;

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <View className="px-4 pt-4">
        <TextInput
          value={city}
          onChangeText={(text) => {
            setCity(text);
            setPage(1);
          }}
          placeholder="Filter by city…"
          className="mb-4 rounded-md border border-gray-200 px-3 py-3 text-black dark:border-gray-800 dark:text-white"
        />
      </View>

      {propertiesQuery.isLoading ? (
        <ActivityIndicator className="mt-8" />
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-3 px-4 pb-8"
          ListEmptyComponent={
            <Text className="mt-8 text-center text-gray-500 dark:text-gray-400">
              No properties match your search yet.
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
          ListFooterComponent={
            total > PAGE_SIZE ? (
              <View className="mt-2 flex-row items-center justify-center gap-4">
                <Pressable
                  disabled={page === 1}
                  onPress={() => setPage((p) => p - 1)}
                  className="rounded-md border border-gray-200 px-3 py-1.5 disabled:opacity-40 dark:border-gray-800"
                >
                  <Text className="text-black dark:text-white">Previous</Text>
                </Pressable>
                <Text className="text-gray-500 dark:text-gray-400">Page {page}</Text>
                <Pressable
                  disabled={!hasNextPage}
                  onPress={() => setPage((p) => p + 1)}
                  className="rounded-md border border-gray-200 px-3 py-1.5 disabled:opacity-40 dark:border-gray-800"
                >
                  <Text className="text-black dark:text-white">Next</Text>
                </Pressable>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
