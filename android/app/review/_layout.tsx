import { Stack } from 'expo-router'

export default function ReviewLayout() {
    return (
        <Stack>
            <Stack.Screen name='create' options={{ headerShown: false }} />
            <Stack.Screen name='view' options={{ headerShown: false }} />
            <Stack.Screen name='edit' options={{ headerShown: false }} />
        </Stack>
    )
}
