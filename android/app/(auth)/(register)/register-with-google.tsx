import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Text } from '@/components/ui/text'
import { useAuth } from '@/hooks/use-auth'
import { showNotification } from '@/lib/utils'
import { isEmpty, isValidVNIPhoneNumber } from '@/lib/validator'
import AuthService from '@/services/auth.service'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { UserPlusIcon } from 'lucide-react-native'
import { useState } from 'react'
import { View, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native'

const RegisterWithGoogleScreen: React.FC = () => {
    const router = useRouter()
    const { login } = useAuth()
    const params = useLocalSearchParams<{ googleId: string; email: string; name: string }>()

    // Form state
    const [name, setName] = useState(params.name || '')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)

    // Validation errors
    const [nameError, setNameError] = useState('')
    const [phoneError, setPhoneError] = useState('')

    const handleRegister = async () => {
        setNameError('')
        setPhoneError('')

        if (isEmpty(name)) {
            setNameError('Vui lòng nhập họ tên')
            return
        }

        if (isEmpty(phone)) {
            setPhoneError('Vui lòng nhập số điện thoại')
            return
        }

        if (!isValidVNIPhoneNumber(phone)) {
            setPhoneError('Số điện thoại không hợp lệ')
            return
        }

        try {
            setLoading(true)
            const res = await AuthService.registerWithGoogle({
                googleId: params.googleId || '',
                email: params.email || '',
                name,
                phone
            })

            if (res.code === 200 || res.code === 201) {
                showNotification('success', 'Đăng ký thành công')
                await login(res.data.accessToken, res.data.refreshToken, {
                    name: res.data.name,
                    role: res.data.role
                })
                router.replace('/')
            } else {
                showNotification('error', res.message || 'Đăng ký thất bại')
            }
        } catch (error: any) {
            showNotification('error', error.message || 'Đã xảy ra lỗi')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Hoàn tất đăng ký'
                }}
            />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className='flex-1'>
                <ScrollView
                    className='flex-1'
                    contentContainerClassName='flex-grow'
                    keyboardShouldPersistTaps='handled'
                >
                    <View className='flex-1 justify-center gap-6 p-6'>
                        {/* Header */}
                        <View className='items-center gap-4'>
                            <View className='h-20 w-20 items-center justify-center rounded-full bg-primary/10'>
                                <Image
                                    source={{ uri: 'https://www.google.com/favicon.ico' }}
                                    style={{ width: 40, height: 40 }}
                                />
                            </View>
                            <View className='gap-2'>
                                <Text className='text-center text-2xl font-bold'>Hoàn tất đăng ký</Text>
                                <Text className='text-center text-muted-foreground'>
                                    Nhập thêm thông tin để hoàn tất đăng ký với Google
                                </Text>
                            </View>
                        </View>

                        {/* Form */}
                        <View className='gap-4'>
                            {/* Email (readonly) */}
                            <View className='gap-2'>
                                <Label>Email</Label>
                                <Input value={params.email || ''} editable={false} className='bg-muted' />
                            </View>

                            {/* Name */}
                            <View className='gap-2'>
                                <Label>Họ tên</Label>
                                <Input
                                    placeholder='Nhập họ tên của bạn'
                                    value={name}
                                    onChangeText={(text) => {
                                        setName(text)
                                        setNameError('')
                                    }}
                                    autoCapitalize='words'
                                    editable={!loading}
                                />
                                {nameError && <Text className='text-sm text-destructive'>{nameError}</Text>}
                            </View>

                            {/* Phone */}
                            <View className='gap-2'>
                                <Label>Số điện thoại</Label>
                                <Input
                                    placeholder='Nhập số điện thoại'
                                    value={phone}
                                    onChangeText={(text) => {
                                        setPhone(text)
                                        setPhoneError('')
                                    }}
                                    keyboardType='phone-pad'
                                    editable={!loading}
                                />
                                {phoneError && <Text className='text-sm text-destructive'>{phoneError}</Text>}
                            </View>

                            {/* Register Button */}
                            <Button onPress={handleRegister} disabled={loading} className='mt-4'>
                                <Text>{loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}</Text>
                                <Icon as={UserPlusIcon} />
                            </Button>
                        </View>

                        {/* Info */}
                        <View className='rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950'>
                            <Text className='text-center text-sm text-blue-700 dark:text-blue-300'>
                                Bạn đang đăng ký với tài khoản Google: {params.email}
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    )
}

export default RegisterWithGoogleScreen
