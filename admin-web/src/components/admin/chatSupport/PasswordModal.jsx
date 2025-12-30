import { useState } from 'react'
import { Modal, Form, Input, Button, Typography, Alert } from 'antd'
import { LockOutlined, KeyOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import naclUtil from 'tweetnacl-util'

import ChatService from '../../../services/chat.service'
import {
    generateKeyPair,
    generateSalt,
    deriveKeyFromPassword,
    encryptPrivateKey,
    decryptPrivateKey
} from '../../../lib/tweetnacl'
import { saveSecretChatKey } from '../../../lib/handleStorage'
import { useApp } from '../../provider/AppProvider'

const { Text, Title } = Typography

const PasswordModal = ({ open, userId, myKeyPairRef, onSuccess }) => {
    const [form] = Form.useForm()
    const [authMode, setAuthMode] = useState('login')
    const { showMessage, showNotification } = useApp()

    // Login mutation
    const loginMutation = useMutation({
        mutationFn: async (password) => {
            const res = await ChatService.getEncryptedKey(userId)
            const keyInfo = res.data

            const kdfSalt = naclUtil.decodeBase64(keyInfo.kdfSalt)
            const masterKey = await deriveKeyFromPassword(password, kdfSalt)

            const decryptedPrivateKey = decryptPrivateKey(
                keyInfo.encryptedPrivateKey,
                keyInfo.privateKeyNonce,
                masterKey
            )

            const secretKey = naclUtil.encodeBase64(decryptedPrivateKey)
            saveSecretChatKey(secretKey, userId)

            myKeyPairRef.current = {
                publicKey: keyInfo.publicKey,
                secretKey
            }

            return keyInfo
        },
        onSuccess: () => {
            showNotification('success', 'Đăng nhập E2E thành công!')
            form.resetFields()
            onSuccess()
        },
        onError: (error) => {
            console.error('Login error:', error)
            showNotification('error', 'Sai mật khẩu hoặc chưa đăng ký chat key!')
        }
    })

    // Register mutation
    const registerMutation = useMutation({
        mutationFn: async (password) => {
            const keyPair = generateKeyPair()
            myKeyPairRef.current = keyPair

            const kdfSalt = generateSalt()
            const masterKey = await deriveKeyFromPassword(password, kdfSalt)

            const privateKeyBytes = naclUtil.decodeBase64(keyPair.secretKey)
            const { encryptedPrivateKey, nonce: privateKeyNonce } = encryptPrivateKey(privateKeyBytes, masterKey)

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

            saveSecretChatKey(keyPair.secretKey, userId)
            return keyPair
        },
        onSuccess: () => {
            showNotification('success', 'Đăng ký E2E thành công!')
            form.resetFields()
            onSuccess()
        },
        onError: (error) => {
            console.error('Register error:', error)
            showNotification('error', error.message || 'Đăng ký thất bại!')
        }
    })

    const handleSubmit = (values) => {
        if (!userId) {
            showMessage('error', 'Vui lòng đăng nhập hệ thống trước')
            return
        }
        setAuthMode('login')
        loginMutation.mutate(values.password)
    }

    const handleRegister = () => {
        form.validateFields().then((values) => {
            if (!userId) {
                showMessage('error', 'Vui lòng đăng nhập hệ thống trước')
                return
            }
            setAuthMode('register')
            registerMutation.mutate(values.password)
        })
    }

    const loading = loginMutation.isPending || registerMutation.isPending

    return (
        <Modal open={open} closable={false} footer={null} centered width={400} maskClosable={false}>
            <div className='mb-6 text-center'>
                <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100'>
                    <KeyOutlined className='text-2xl text-blue-500' />
                </div>
                <Title level={4} className='!mb-2'>
                    Xác thực E2E Chat
                </Title>
                <Text type='secondary'>Nhập mật khẩu để mở khóa chat mã hóa đầu cuối</Text>
            </div>

            <Alert
                message='Mật khẩu E2E'
                description='Mật khẩu này dùng để bảo vệ private key chat. Không phải mật khẩu đăng nhập hệ thống.'
                type='info'
                showIcon
                className='mb-4'
            />

            <Form form={form} layout='vertical' onFinish={handleSubmit}>
                <Form.Item
                    name='password'
                    label='Mật khẩu E2E'
                    rules={[
                        { required: true, message: 'Vui lòng nhập mật khẩu' },
                        { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' }
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder='Nhập mật khẩu E2E' size='large' />
                </Form.Item>

                <div className='flex gap-2'>
                    <Button
                        type='primary'
                        htmlType='submit'
                        loading={loading && authMode === 'login'}
                        block
                        size='large'
                    >
                        Đăng nhập
                    </Button>
                    <Button onClick={handleRegister} loading={loading && authMode === 'register'} block size='large'>
                        Đăng ký mới
                    </Button>
                </div>
            </Form>
        </Modal>
    )
}

export default PasswordModal
