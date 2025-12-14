import { Redirect } from 'expo-router'

export default function Screen() {
    // Allow both authenticated and guest users to access the main app
    // Individual screens will handle authentication checks
    return <Redirect href='/(main)/home' />
}
