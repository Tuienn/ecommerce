import { useState, useEffect, useRef } from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import { Text } from '@/components/ui/text'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowLeft, Phone, Mail, Lock, User, Copy, CheckCircle2 } from 'lucide-react-native'
import AuthService from '@/services/auth.service'
import { showNotification } from '@/lib/utils'
import * as Clipboard from 'expo-clipboard'
import { useAuth } from '@/hooks/use-auth'

export default function RegisterByPhoneScreen() {
    const router = useRouter()
    const [step, setStep] = useState<'phone' | 'verify' | 'register'>('phone')

    // Phone step
    const [phone, setPhone] = useState('')
    const [otpCode, setOtpCode] = useState('')
    const [loadingOTP, setLoadingOTP] = useState(false)

    // Verify step (polling)
    const [polling, setPolling] = useState(false)
    const [timeLeft, setTimeLeft] = useState(120) // 2 minutes
    const pollingIntervalRef = useRef<any>(null)
    const timerIntervalRef = useRef<any>(null)
    const { login } = useAuth()
    // Register step
    const [accessToken, setAccessToken] = useState('')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [registering, setRegistering] = useState(false)

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
            }
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current)
            }
        }
    }, [])

    const handleRequestOTP = async () => {
        if (!phone || phone.length < 10) {
            showNotification('error', 'Vui lòng nhập số điện thoại hợp lệ')
            return
        }

        try {
            setLoadingOTP(true)
            const response = await AuthService.registerPhoneOTP(phone)
            setOtpCode(response.data.code)
            setStep('verify')
            startPolling()
            showNotification('success', 'Mã OTP đã được tạo. Vui lòng gửi SMS với mã này.')
        } catch (error: any) {
            console.error('Error requesting OTP:', error)
            showNotification('error', error?.message || 'Không thể tạo mã OTP')
        } finally {
            setLoadingOTP(false)
        }
    }

    const startPolling = () => {
        setPolling(true)
        setTimeLeft(120)

        // Start countdown timer
        timerIntervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    stopPolling()
                    showNotification('error', 'Hết thời gian xác thực. Vui lòng thử lại.')
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        // Start polling verify status
        pollingIntervalRef.current = setInterval(async () => {
            try {
                const response = await AuthService.getVerifyStatus(phone)
                if (response.data.verified) {
                    stopPolling()
                    setAccessToken(response.data.accessToken)
                    setStep('register')
                    showNotification('success', 'Xác thực thành công! Vui lòng hoàn tất đăng ký.')
                }
            } catch (error) {
                console.error('Error checking verify status:', error)
            }
        }, 3000) // Poll every 3 seconds
    }

    const stopPolling = () => {
        setPolling(false)
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
        }
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current)
            timerIntervalRef.current = null
        }
    }

    const handleCopyOTP = async () => {
        await Clipboard.setStringAsync(otpCode)
        showNotification('success', 'Đã sao chép mã OTP')
    }

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            showNotification('error', 'Vui lòng điền đầy đủ thông tin')
            return
        }

        if (password !== confirmPassword) {
            showNotification('error', 'Mật khẩu xác nhận không khớp')
            return
        }

        if (password.length < 6) {
            showNotification('error', 'Mật khẩu phải có ít nhất 6 ký tự')
            return
        }

        try {
            setRegistering(true)
            const response = await AuthService.registerAccount(name, email, password, phone, accessToken)
            showNotification('success', 'Đăng ký thành công')
            const res = await AuthService.loginByEmail(email, password)
            await login(res.data.accessToken, res.data.refreshToken, {
                name: res.data.name,
                role: res.data.role
            })
            router.replace('/')
        } catch (error: any) {
            console.error('Error registering:', error)
            showNotification('error', error?.message || 'Không thể đăng ký tài khoản')
        } finally {
            setRegistering(false)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <SafeAreaView className='flex-1 bg-white'>
            {/* Header */}
            <View className='flex-row items-center border-b border-gray-200 px-4 py-3'>
                <TouchableOpacity onPress={() => router.back()} className='mr-3'>
                    <ArrowLeft size={24} color='#374151' />
                </TouchableOpacity>
                <Text className='text-xl font-bold text-gray-900'>
                    {step === 'phone' && 'Đăng ký bằng SĐT'}
                    {step === 'verify' && 'Xác thực OTP'}
                    {step === 'register' && 'Hoàn tất đăng ký'}
                </Text>
            </View>

            <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
                <View className='px-6 py-8'>
                    {/* Phone Step */}
                    {step === 'phone' && (
                        <View className='gap-6'>
                            <View>
                                <Text className='mb-2 text-3xl font-bold text-gray-900'>Nhập số điện thoại</Text>
                                <Text className='text-gray-600'>
                                    Chúng tôi sẽ gửi mã OTP để xác thực số điện thoại của bạn
                                </Text>
                            </View>

                            <View className='gap-2'>
                                <Label className='text-sm font-medium'>Số điện thoại</Label>
                                <View className='relative'>
                                    <View className='absolute left-3 top-3.5 z-10'>
                                        <Phone size={20} color='#9ca3af' />
                                    </View>
                                    <Input
                                        value={phone}
                                        onChangeText={setPhone}
                                        placeholder='Nhập số điện thoại'
                                        keyboardType='phone-pad'
                                        className='pl-12'
                                    />
                                </View>
                            </View>

                            <Button onPress={handleRequestOTP} disabled={loadingOTP} className='bg-green-600'>
                                <Text className='font-semibold text-white'>
                                    {loadingOTP ? 'Đang tạo mã...' : 'Gửi mã OTP'}
                                </Text>
                            </Button>

                            <View className='relative items-center'>
                                <View className='absolute left-0 right-0 top-1/2 h-px bg-gray-300' />
                                <Text className='relative bg-white px-4 text-sm text-gray-500'>Hoặc</Text>
                            </View>

                            <Button
                                variant='outline'
                                onPress={() => router.push('/(auth)/(register)/register-by-email')}
                                disabled={loadingOTP}
                            >
                                <Text>Đăng ký bằng email</Text>
                            </Button>
                        </View>
                    )}

                    {/* Verify Step */}
                    {step === 'verify' && (
                        <View className='gap-6'>
                            <View>
                                <Text className='mb-2 text-3xl font-bold text-gray-900'>Xác thực OTP</Text>
                                <Text className='text-gray-600'>
                                    Gửi tin nhắn SMS với nội dung mã OTP bên dưới để xác thực
                                </Text>
                            </View>

                            {/* OTP Display */}
                            <View className='rounded-lg border-2 border-green-500 bg-green-50 p-6'>
                                <Text className='mb-2 text-center text-sm font-medium text-gray-600'>
                                    Mã OTP của bạn
                                </Text>
                                <View className='flex-row items-center justify-center gap-3'>
                                    <Text className='text-4xl font-bold tracking-widest text-green-600'>{otpCode}</Text>
                                    <TouchableOpacity onPress={handleCopyOTP} className='rounded-lg bg-green-600 p-2'>
                                        <Copy size={20} color='white' />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Instructions */}
                            <View className='gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4'>
                                <Text className='font-semibold text-blue-900'>Hướng dẫn:</Text>
                                <Text className='text-sm text-blue-800'>1. Sao chép mã OTP ở trên</Text>
                                <Text className='text-sm text-blue-800'>
                                    2. Gửi tin nhắn SMS với nội dung là mã OTP này
                                </Text>
                                <Text className='text-sm text-blue-800'>
                                    3. Hệ thống sẽ tự động xác thực trong vài giây
                                </Text>
                            </View>

                            {/* Polling Status */}
                            {polling && (
                                <View className='items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-6'>
                                    <View className='h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-green-600' />
                                    <View className='items-center gap-1'>
                                        <Text className='font-medium text-gray-900'>Đang chờ xác thực...</Text>
                                        <Text className='text-sm text-gray-600'>
                                            Thời gian còn lại: {formatTime(timeLeft)}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            <Button
                                onPress={() => {
                                    stopPolling()
                                    setStep('phone')
                                    setOtpCode('')
                                }}
                                variant='outline'
                            >
                                <Text>Quay lại</Text>
                            </Button>
                        </View>
                    )}

                    {/* Register Step */}
                    {step === 'register' && (
                        <View className='gap-6'>
                            <View className='items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4'>
                                <CheckCircle2 size={48} color='#16a34a' />
                                <View>
                                    <Text className='text-center text-lg font-bold text-green-900'>
                                        Xác thực thành công!
                                    </Text>
                                    <Text className='text-center text-sm text-green-700'>
                                        Vui lòng hoàn tất thông tin đăng ký
                                    </Text>
                                </View>
                            </View>

                            <View className='gap-4'>
                                <View className='gap-2'>
                                    <Label className='text-sm font-medium'>Họ và tên</Label>
                                    <View className='relative'>
                                        <View className='absolute left-3 top-3.5 z-10'>
                                            <User size={20} color='#9ca3af' />
                                        </View>
                                        <Input
                                            value={name}
                                            onChangeText={setName}
                                            placeholder='Nhập họ và tên'
                                            className='pl-12'
                                        />
                                    </View>
                                </View>

                                <View className='gap-2'>
                                    <Label className='text-sm font-medium'>Email</Label>
                                    <View className='relative'>
                                        <View className='absolute left-3 top-3.5 z-10'>
                                            <Mail size={20} color='#9ca3af' />
                                        </View>
                                        <Input
                                            value={email}
                                            onChangeText={setEmail}
                                            placeholder='Nhập email'
                                            keyboardType='email-address'
                                            autoCapitalize='none'
                                            className='pl-12'
                                        />
                                    </View>
                                </View>

                                <View className='gap-2'>
                                    <Label className='text-sm font-medium'>Số điện thoại</Label>
                                    <View className='relative'>
                                        <View className='absolute left-3 top-3.5 z-10'>
                                            <Phone size={20} color='#9ca3af' />
                                        </View>
                                        <Input value={phone} editable={false} className='bg-gray-100 pl-12' />
                                    </View>
                                </View>

                                <View className='gap-2'>
                                    <Label className='text-sm font-medium'>Mật khẩu</Label>
                                    <View className='relative'>
                                        <View className='absolute left-3 top-3.5 z-10'>
                                            <Lock size={20} color='#9ca3af' />
                                        </View>
                                        <Input
                                            value={password}
                                            onChangeText={setPassword}
                                            placeholder='Nhập mật khẩu (tối thiểu 6 ký tự)'
                                            secureTextEntry
                                            className='pl-12'
                                        />
                                    </View>
                                </View>

                                <View className='gap-2'>
                                    <Label className='text-sm font-medium'>Xác nhận mật khẩu</Label>
                                    <View className='relative'>
                                        <View className='absolute left-3 top-3.5 z-10'>
                                            <Lock size={20} color='#9ca3af' />
                                        </View>
                                        <Input
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            placeholder='Nhập lại mật khẩu'
                                            secureTextEntry
                                            className='pl-12'
                                        />
                                    </View>
                                </View>
                            </View>

                            <Button onPress={handleRegister} disabled={registering} className='bg-green-600'>
                                <Text className='font-semibold text-white'>
                                    {registering ? 'Đang đăng ký...' : 'Hoàn tất đăng ký'}
                                </Text>
                            </Button>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}
