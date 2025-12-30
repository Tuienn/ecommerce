import { useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { KeyRound, Info } from 'lucide-react-native'
import naclUtil from 'tweetnacl-util'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { Input } from '@/components/ui/input'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import ChatService from '@/services/chat.service'
import { saveSecretChatKey } from '@/lib/secure-store'
import { showNotification } from '@/lib/utils'
import {
    generateKeyPair,
    generateSalt,
    deriveKeyFromPassword,
    encryptPrivateKey,
    decryptPrivateKey
} from '@/lib/tweetnacl'

interface PasswordDialogProps {
    open: boolean
    userId: string
    onSuccess: (keyPair: { publicKey: string; secretKey: string }) => void
}

export default function PasswordDialog({ open, userId, onSuccess }: PasswordDialogProps) {
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

    const handleLogin = async () => {
        if (!password || password.length < 6) {
            showNotification('error', 'Mật khẩu phải có ít nhất 6 ký tự')
            return
        }

        try {
            setLoading(true)
            setAuthMode('login')

            // Get encrypted key from server
            const res = await ChatService.getEncryptedKey(userId)
            const keyInfo = res.data

            // Derive master key from password
            const kdfSalt = naclUtil.decodeBase64(keyInfo.kdfSalt)
            const masterKey = await deriveKeyFromPassword(password, kdfSalt)

            // Decrypt private key
            const decryptedPrivateKey = decryptPrivateKey(
                keyInfo.encryptedPrivateKey,
                keyInfo.privateKeyNonce,
                masterKey
            )

            const secretKey = naclUtil.encodeBase64(decryptedPrivateKey)

            // Save to secure store
            await saveSecretChatKey(secretKey, userId)

            const keyPair = {
                publicKey: keyInfo.publicKey,
                secretKey
            }

            showNotification('success', 'Đăng nhập E2E thành công!')
            setPassword('')
            onSuccess(keyPair)
        } catch (error: any) {
            console.error('Login error:', error)
            showNotification('error', 'Sai mật khẩu hoặc chưa đăng ký chat key!')
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async () => {
        if (!password || password.length < 6) {
            showNotification('error', 'Mật khẩu phải có ít nhất 6 ký tự')
            return
        }

        try {
            setLoading(true)
            setAuthMode('register')

            // Generate new key pair
            const keyPair = generateKeyPair()

            // Generate salt and derive master key
            const kdfSalt = generateSalt()
            const masterKey = await deriveKeyFromPassword(password, kdfSalt)

            // Encrypt private key
            const privateKeyBytes = naclUtil.decodeBase64(keyPair.secretKey)
            const { encryptedPrivateKey, nonce: privateKeyNonce } = encryptPrivateKey(privateKeyBytes, masterKey)

            // Register on server
            await ChatService.registerChatKey({
                publicKey: keyPair.publicKey,
                encryptedPrivateKey,
                privateKeyNonce,
                kdfSalt: naclUtil.encodeBase64(kdfSalt),
                kdfParams: {
                    algorithm: 'pbkdf2',
                    iterations: 600000,
                    hash: 'SHA-256'
                }
            })

            // Save to secure store
            await saveSecretChatKey(keyPair.secretKey, userId)

            showNotification('success', 'Đăng ký E2E thành công!')
            setPassword('')
            onSuccess(keyPair)
        } catch (error: any) {
            console.error('Register error:', error)
            showNotification('error', error.message || 'Đăng ký thất bại!')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open}>
            <DialogContent className='w-[95%] space-y-2'>
                <DialogHeader>
                    <View className='items-center'>
                        <View className='mb-3 h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
                            <KeyRound size={32} className='text-primary' />
                        </View>
                        <DialogTitle className='text-center text-xl'>Xác thực E2E Chat</DialogTitle>
                        <DialogDescription className='text-center'>
                            Nhập mật khẩu để mở khóa chat mã hóa đầu cuối
                        </DialogDescription>
                    </View>
                </DialogHeader>

                {/* Info alert */}
                <Alert icon={Info}>
                    <AlertTitle>Mật khẩu E2E</AlertTitle>
                    <AlertDescription>
                        Mật khẩu này dùng để bảo vệ private key chat. Không phải mật khẩu đăng nhập hệ thống.
                    </AlertDescription>
                </Alert>

                {/* Password input */}
                <View>
                    <Text className='mb-2 font-medium'>Mật khẩu E2E</Text>
                    <Input
                        placeholder='Nhập mật khẩu E2E (tối thiểu 6 ký tự)'
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        editable={!loading}
                    />
                </View>

                {/* Buttons */}
                <View className='flex-row gap-2'>
                    <Button className='flex-1' onPress={handleLogin} disabled={loading || !password.trim()}>
                        {loading && authMode === 'login' ? (
                            <ActivityIndicator size='small' color='white' />
                        ) : (
                            <Text className='font-medium text-primary-foreground'>Đăng nhập</Text>
                        )}
                    </Button>
                    <Button
                        className='flex-1'
                        variant='outline'
                        onPress={handleRegister}
                        disabled={loading || !password.trim()}
                    >
                        {loading && authMode === 'register' ? (
                            <ActivityIndicator size='small' />
                        ) : (
                            <Text className='font-medium'>Đăng ký mới</Text>
                        )}
                    </Button>
                </View>
            </DialogContent>
        </Dialog>
    )
}
