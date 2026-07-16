import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-white px-6 dark:bg-black">
      <Text className="text-3xl font-semibold text-black dark:text-white">
        PropLease AI
      </Text>
      <Text className="text-center text-gray-500 dark:text-gray-400">
        Tenant MVP scaffold.
      </Text>
    </View>
  );
}
