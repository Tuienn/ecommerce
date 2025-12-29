import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Text } from '@/components/ui/text'
import { useAuth } from '@/hooks/use-auth'
import { showNotification } from '@/lib/utils'
import { isValidEmail, isEmpty } from '@/lib/validator'
import AuthService from '@/services/auth.service'
import { configureGoogleSignIn, signInWithGoogle } from '@/services/google-auth.service'
import { Link, Stack, useRouter } from 'expo-router'
import { EyeIcon, EyeOffIcon, LogInIcon, MailIcon } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { View, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native'

const LoginByEmailScreen: React.FC = () => {
    const router = useRouter()
    const { login } = useAuth()

    // Form state
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)

    // Validation errors
    const [emailError, setEmailError] = useState('')
    const [passwordError, setPasswordError] = useState('')

    useEffect(() => {
        configureGoogleSignIn()
    }, [])

    const handleLogin = async () => {
        setEmailError('')
        setPasswordError('')

        // Validation
        if (isEmpty(email)) {
            setEmailError('Vui lòng nhập email')
            return
        }

        if (!isValidEmail(email)) {
            setEmailError('Email không hợp lệ')
            return
        }

        if (isEmpty(password)) {
            setPasswordError('Vui lòng nhập mật khẩu')
            return
        }

        if (password.length < 6) {
            setPasswordError('Mật khẩu phải có ít nhất 6 ký tự')
            return
        }

        try {
            setLoading(true)
            const res = await AuthService.loginByEmail(email, password)

            if (res.code === 200) {
                showNotification('success', 'Đăng nhập thành công')
                await login(res.data.accessToken, res.data.refreshToken, {
                    name: res.data.name,
                    role: res.data.role
                })
                router.replace('/')
            } else {
                showNotification('error', res.message || 'Đăng nhập thất bại')
            }
        } catch (error: any) {
            showNotification('error', error.message || 'Đã xảy ra lỗi')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true)
        try {
            // Step 1: Google Sign-In
            const result = await signInWithGoogle()

            if (!result.success || !result.user) {
                if (!result.cancelled) {
                    showNotification('error', result.error || 'Đăng nhập Google thất bại')
                }
                return
            }

            const { id: googleId, email: googleEmail, name: googleName } = result.user

            // Step 2: Check if account exists
            const checkRes = await AuthService.checkGoogleAccount(googleId, googleEmail)

            if (checkRes.code !== 200) {
                showNotification('error', checkRes.message || 'Không thể kiểm tra tài khoản')
                return
            }

            if (checkRes.data.exists) {
                // Account exists -> Login
                const loginRes = await AuthService.loginWithGoogle(googleId, googleEmail)

                if (loginRes.code === 200) {
                    showNotification('success', 'Đăng nhập thành công')
                    await login(loginRes.data.accessToken, loginRes.data.refreshToken, {
                        name: loginRes.data.name,
                        role: loginRes.data.role
                    })
                    router.replace('/')
                } else {
                    showNotification('error', loginRes.message || 'Đăng nhập thất bại')
                }
            } else {
                // Account doesn't exist -> Redirect to register
                router.push({
                    pathname: '/(auth)/(register)/register-with-google',
                    params: {
                        googleId,
                        email: googleEmail,
                        name: googleName || ''
                    }
                } as any)
            }
        } catch (error: any) {
            showNotification('error', error.message || 'Đã xảy ra lỗi')
        } finally {
            setGoogleLoading(false)
        }
    }

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Đăng nhập',
                    headerShown: false
                }}
            />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className='flex-1'>
                <ScrollView
                    className='flex-1'
                    contentContainerClassName='flex-grow'
                    keyboardShouldPersistTaps='handled'
                >
                    <View className='flex-1 justify-center gap-8 p-6'>
                        {/* Header */}
                        <View className='items-center gap-4'>
                            <View className='h-24 w-24 items-center justify-center rounded-full bg-primary/10'>
                                <Icon as={LogInIcon} className='h-12 w-12 text-primary' />
                            </View>
                            <View className='gap-2'>
                                <Text className='text-center text-3xl font-bold'>Chào mừng trở lại</Text>
                                <Text className='text-center text-muted-foreground'>
                                    Đăng nhập vào tài khoản của bạn
                                </Text>
                            </View>
                        </View>

                        {/* Login Form */}
                        <View className='gap-6'>
                            {/* Email Input */}
                            <View className='gap-2'>
                                <Label>Địa chỉ Email</Label>
                                <View className='relative'>
                                    <Input
                                        placeholder='vidu@email.com'
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text)
                                            setEmailError('')
                                        }}
                                        keyboardType='email-address'
                                        autoCapitalize='none'
                                        autoCorrect={false}
                                        editable={!loading && !googleLoading}
                                    />
                                    <View className='absolute right-0 top-0 h-full justify-center pr-3'>
                                        <Icon as={MailIcon} className='h-5 w-5 text-muted-foreground' />
                                    </View>
                                </View>
                                {emailError && <Text className='text-sm text-destructive'>{emailError}</Text>}
                            </View>

                            {/* Password Input */}
                            <View className='gap-2'>
                                <Label>Mật khẩu</Label>
                                <View className='relative'>
                                    <Input
                                        placeholder='Nhập mật khẩu'
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text)
                                            setPasswordError('')
                                        }}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize='none'
                                        editable={!loading && !googleLoading}
                                    />
                                    <View className='absolute right-0 top-0 h-full justify-center pr-3'>
                                        <Button
                                            variant='ghost'
                                            size='icon'
                                            onPress={() => setShowPassword(!showPassword)}
                                            className='h-8 w-8'
                                        >
                                            <Icon
                                                as={showPassword ? EyeOffIcon : EyeIcon}
                                                className='h-5 w-5 text-muted-foreground'
                                            />
                                        </Button>
                                    </View>
                                </View>
                                {passwordError && <Text className='text-sm text-destructive'>{passwordError}</Text>}
                            </View>

                            {/* Login Button */}
                            <Button onPress={handleLogin} disabled={loading || googleLoading} className='mt-2'>
                                <Text>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
                                <Icon as={LogInIcon} />
                            </Button>
                        </View>

                        {/* Divider */}
                        <View className='flex-row items-center gap-4'>
                            <View className='h-px flex-1 bg-border' />
                            <Text className='text-sm text-muted-foreground'>HOẶC</Text>
                            <View className='h-px flex-1 bg-border' />
                        </View>

                        {/* Google Sign-In Button */}
                        <Button
                            variant='outline'
                            className='w-full flex-row items-center gap-3'
                            onPress={handleGoogleSignIn}
                            disabled={loading || googleLoading}
                        >
                            <Image
                                source={{ uri: 'https://www.google.com/favicon.ico' }}
                                style={{ width: 20, height: 20 }}
                            />
                            <Text>{googleLoading ? 'Đang xử lý...' : 'Tiếp tục với Google'}</Text>
                        </Button>

                        {/* Register Link */}
                        <View className='flex-row items-center justify-center gap-2'>
                            <Text className='text-muted-foreground'>Chưa có tài khoản?</Text>
                            <Link href='/(auth)/(register)/register-by-email' asChild>
                                <Button variant='link' className='h-auto p-0'>
                                    <Text className='font-semibold text-primary'>Đăng ký</Text>
                                </Button>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    )
}

export default LoginByEmailScreen
