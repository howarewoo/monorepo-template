import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserList } from "@/components/user-list";
import { ScrollView, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 space-y-6">
        <View className="items-center space-y-2">
          <Text className="text-3xl font-bold text-foreground">Monorepo Template</Text>
          <Text className="text-muted-foreground text-center">
            A modern monorepo with Next.js, Expo, Hono, and oRPC
          </Text>
        </View>

        <View className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Next.js</CardTitle>
              <CardDescription>Web application</CardDescription>
            </CardHeader>
            <CardContent>
              <Text className="text-sm text-muted-foreground">
                React framework with App Router and shadcn/ui components
              </Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expo</CardTitle>
              <CardDescription>Mobile application</CardDescription>
            </CardHeader>
            <CardContent>
              <Text className="text-sm text-muted-foreground">
                React Native with Expo Router and UniWind styling
              </Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hono + oRPC</CardTitle>
              <CardDescription>Type-safe API</CardDescription>
            </CardHeader>
            <CardContent>
              <Text className="text-sm text-muted-foreground">
                End-to-end type safety with oRPC and Hono
              </Text>
            </CardContent>
          </Card>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>Users from API</CardTitle>
            <CardDescription>Data fetched from the Hono API</CardDescription>
          </CardHeader>
          <CardContent>
            <UserList />
          </CardContent>
        </Card>

        <View className="flex-row justify-center gap-4">
          <Button onPress={() => {}}>
            <Text className="text-primary-foreground font-medium">Get Started</Text>
          </Button>
          <Button variant="outline" onPress={() => {}}>
            <Text className="text-foreground font-medium">Documentation</Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
