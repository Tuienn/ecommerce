import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Text } from '@/components/ui/text'
import { useAuth } from '@/hooks/use-auth'
import { showNotification } from '@/lib/utils'
import { isValidEmail, isValidOTP, isEmpty, isValidVNIPhoneNumber } from '@/lib/validator'
import AuthService from '@/services/auth.service'
import { Stack, useRouter } from 'expo-router'
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, MailIcon, ShieldCheckIcon, UserPlusIcon } from 'lucide-react-native'
import { useState } from 'react'
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'

type RegistrationStep = 'email' | 'otp' | 'password'

const RegisterByEmailScreen: React.FC = () => {
    const router = useRouter()
    const { login } = useAuth()

    // Form state
    const [step, setStep] = useState<RegistrationStep>('email')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [accessTokenVerify, setAccessTokenVerify] = useState('')

    // Validation errors
    const [emailError, setEmailError] = useState('')
    const [otpError, setOtpError] = useState('')
    const [nameError, setNameError] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [confirmPasswordError, setConfirmPasswordError] = useState('')

    // Step 1: Email input and send OTP
    const handleSendOTP = async () => {
        setEmailError('')

        if (isEmpty(email)) {
            setEmailError('Vui lòng nhập email')
            return
        }

        if (!isValidEmail(email)) {
            setEmailError('Email không hợp lệ')
            return
        }

        try {
            setLoading(true)
            const res = await AuthService.registerByEmailOTP(email)

            if (res.code === 200) {
                showNotification('success', 'Mã OTP đã được gửi đến email của bạn')
                setStep('otp')
            } else {
                showNotification('error', res.message || 'Không thể gửi mã OTP')
            }
        } catch (error: any) {
            showNotification('error', error.message || 'Đã xảy ra lỗi')
        } finally {
            setLoading(false)
        }
    }

    // Step 2: Verify OTP
    const handleVerifyOTP = async () => {
        setOtpError('')

        if (isEmpty(otp)) {
            setOtpError('Vui lòng nhập mã OTP')
            return
        }

        if (!isValidOTP(otp)) {
            setOtpError('Mã OTP phải gồm 6 chữ số')
            return
        }

        try {
            setLoading(true)
            const res = await AuthService.verifyByEmailOTP(email, otp)

            if (res.code === 200) {
                showNotification('success', 'Xác thực email thành công')
                setAccessTokenVerify(res.data.accessToken)
                setStep('password')
            } else {
                showNotification('error', res.message || 'Mã OTP không đúng')
            }
        } catch (error: any) {
            showNotification('error', error.message || 'Đã xảy ra lỗi')
        } finally {
            setLoading(false)
        }
    }

    // Step 3: Register with email and password
    const handleRegister = async () => {
        setNameError('')
        setPhoneError('')
        setPasswordError('')
        setConfirmPasswordError('')

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

        if (isEmpty(password)) {
            setPasswordError('Vui lòng nhập mật khẩu')
            return
        }

        if (password.length < 6) {
            setPasswordError('Mật khẩu phải có ít nhất 6 ký tự')
            return
        }

        if (isEmpty(confirmPassword)) {
            setConfirmPasswordError('Vui lòng nhập lại mật khẩu')
            return
        }

        if (password !== confirmPassword) {
            setConfirmPasswordError('Mật khẩu không trùng khớp')
            return
        }

        try {
            setLoading(true)
            const registerRes = await AuthService.registerByEmail(name, email, password, phone, accessTokenVerify)

            if (registerRes.code === 200 || registerRes.code === 201) {
                showNotification('success', 'Đăng ký thành công')
                const res = await AuthService.loginByEmail(email, password)
                await login(res.data.accessToken, res.data.refreshToken, {
                    name: res.data.name,
                    role: res.data.role
                })
                router.replace('/')
            } else {
                showNotification('error', registerRes.message || 'Đăng ký thất bại')
            }
        } catch (error: any) {
            showNotification('error', error.message || 'Đã xảy ra lỗi')
        } finally {
            setLoading(false)
        }
    }

    const handleBack = () => {
        if (step === 'otp') {
            setStep('email')
            setOtp('')
            setOtpError('')
        } else if (step === 'password') {
            setStep('otp')
            setName('')
            setPhone('')
            setPassword('')
            setConfirmPassword('')
            setNameError('')
            setPhoneError('')
            setPasswordError('')
            setConfirmPasswordError('')
        } else {
            router.back()
        }
    }

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Đăng ký',
                    headerLeft: () => (
                        <Button variant='ghost' size='icon' onPress={handleBack} className='mr-2'>
                            <Icon as={ArrowLeftIcon} />
                        </Button>
                    )
                }}
            />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className='flex-1'>
                <ScrollView
                    className='flex-1'
                    contentContainerClassName='flex-grow'
                    keyboardShouldPersistTaps='handled'
                >
                    <View className='flex-1 justify-center gap-6 p-6'>
                        {/* Step 1: Email Input */}
                        {step === 'email' && (
                            <View className='gap-6'>
                                <View className='items-center gap-2'>
                                    <View className='h-20 w-20 items-center justify-center rounded-full bg-primary/10'>
                                        <Icon as={MailIcon} className='h-10 w-10 text-primary' />
                                    </View>
                                    <Text className='text-center text-2xl font-bold'>Nhập Email</Text>
                                    <Text className='text-center text-muted-foreground'>
                                        Chúng tôi sẽ gửi cho bạn mã xác thực
                                    </Text>
                                </View>

                                <View className='gap-2'>
                                    <Label>Địa chỉ Email</Label>
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
                                        editable={!loading}
                                    />
                                    {emailError && <Text className='text-sm text-destructive'>{emailError}</Text>}
                                </View>

                                <Button onPress={handleSendOTP} disabled={loading}>
                                    <Text>{loading ? 'Đang gửi...' : 'Gửi mã OTP'}</Text>
                                    <Icon as={MailIcon} />
                                </Button>
                            </View>
                        )}

                        {/* Step 2: OTP Verification */}
                        {step === 'otp' && (
                            <View className='gap-6'>
                                <View className='items-center gap-2'>
                                    <View className='h-20 w-20 items-center justify-center rounded-full bg-primary/10'>
                                        <Icon as={ShieldCheckIcon} className='h-10 w-10 text-primary' />
                                    </View>
                                    <Text className='text-center text-2xl font-bold'>Xác thực mã OTP</Text>
                                    <Text className='text-center text-muted-foreground'>Nhập mã OTP được gửi đến</Text>
                                    <Text className='text-center font-semibold'>{email}</Text>
                                </View>

                                <View className='gap-2'>
                                    <Label>Mã OTP</Label>
                                    <Input
                                        placeholder='000000'
                                        value={otp}
                                        onChangeText={(text) => {
                                            setOtp(text)
                                            setOtpError('')
                                        }}
                                        keyboardType='number-pad'
                                        maxLength={6}
                                        editable={!loading}
                                        className='text-center text-2xl tracking-widest'
                                    />
                                    {otpError && <Text className='text-sm text-destructive'>{otpError}</Text>}
                                </View>

                                <View className='gap-3'>
                                    <Button onPress={handleVerifyOTP} disabled={loading}>
                                        <Text>{loading ? 'Đang xác thực...' : 'Xác thực mã OTP'}</Text>
                                        <Icon as={ShieldCheckIcon} />
                                    </Button>

                                    <Button variant='outline' onPress={handleSendOTP} disabled={loading}>
                                        <Text>Gửi lại mã OTP</Text>
                                    </Button>
                                </View>
                            </View>
                        )}

                        {/* Step 3: Password Setup */}
                        {step === 'password' && (
                            <View className='gap-6'>
                                <View className='items-center gap-2'>
                                    <View className='h-20 w-20 items-center justify-center rounded-full bg-primary/10'>
                                        <Icon as={UserPlusIcon} className='h-10 w-10 text-primary' />
                                    </View>
                                    <Text className='text-center text-2xl font-bold'>Tạo mật khẩu</Text>
                                    <Text className='text-center text-muted-foreground'>
                                        Tạo mật khẩu cho tài khoản của bạn
                                    </Text>
                                </View>

                                <View className='gap-2'>
                                    <Label>Email</Label>
                                    <Input value={email} editable={false} className='bg-muted' />
                                </View>

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
                                            editable={!loading}
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

                                <View className='gap-2'>
                                    <Label>Nhập lại mật khẩu</Label>
                                    <View className='relative'>
                                        <Input
                                            placeholder='Nhập lại mật khẩu'
                                            value={confirmPassword}
                                            onChangeText={(text) => {
                                                setConfirmPassword(text)
                                                setConfirmPasswordError('')
                                            }}
                                            secureTextEntry={!showConfirmPassword}
                                            autoCapitalize='none'
                                            editable={!loading}
                                        />
                                        <View className='absolute right-0 top-0 h-full justify-center pr-3'>
                                            <Button
                                                variant='ghost'
                                                size='icon'
                                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className='h-8 w-8'
                                            >
                                                <Icon
                                                    as={showConfirmPassword ? EyeOffIcon : EyeIcon}
                                                    className='h-5 w-5 text-muted-foreground'
                                                />
                                            </Button>
                                        </View>
                                    </View>
                                    {confirmPasswordError && (
                                        <Text className='text-sm text-destructive'>{confirmPasswordError}</Text>
                                    )}
                                </View>

                                <Button onPress={handleRegister} disabled={loading}>
                                    <Text>{loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}</Text>
                                    <Icon as={UserPlusIcon} />
                                </Button>
                            </View>
                        )}

                        {/* Progress Indicator */}
                        <View className='flex-row justify-center gap-2'>
                            <View className={`h-2 w-2 rounded-full ${step === 'email' ? 'bg-primary' : 'bg-muted'}`} />
                            <View className={`h-2 w-2 rounded-full ${step === 'otp' ? 'bg-primary' : 'bg-muted'}`} />
                            <View
                                className={`h-2 w-2 rounded-full ${step === 'password' ? 'bg-primary' : 'bg-muted'}`}
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    )
}

export default RegisterByEmailScreen
