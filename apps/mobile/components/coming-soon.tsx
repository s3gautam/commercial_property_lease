import { Text, View } from "react-native";

export function ComingSoon({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <View className="flex-1 gap-2 bg-white px-6 py-8 dark:bg-black">
      <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">{phase}</Text>
      <Text className="text-2xl font-semibold text-black dark:text-white">{title}</Text>
      <Text className="mt-2 leading-relaxed text-gray-500 dark:text-gray-400">{description}</Text>
    </View>
  );
}
