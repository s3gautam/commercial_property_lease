import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0a0a0a",
        headerShown: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Browse" }} />
      <Tabs.Screen name="search" options={{ title: "AI Search" }} />
      <Tabs.Screen name="kyc" options={{ title: "KYC" }} />
      <Tabs.Screen name="lease" options={{ title: "Lease" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
