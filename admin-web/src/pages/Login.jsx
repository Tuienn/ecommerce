import { LoginOutlined } from '@ant-design/icons'
import { Button, Divider, Form, Input, Modal } from 'antd'
import logoXrm from '../assets/svg/xrm.svg'
import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAccessToken, saveAccessToken, saveAuthToken } from '../lib/handleStorage'
import { debounce } from '../lib/utils'
import AuthService from '../services/auth.service'
import { useApp } from '../components/provider/AppProvider'

const Login = () => {
    const navigate = useNavigate()
    const { showNotification } = useApp()

    useEffect(() => {
        const token = getAccessToken()
        if (token) {
            navigate('/')
        }
    }, [])

    const [form] = Form.useForm()

    const mutationLogin = useMutation({
        mutationFn: (data) => AuthService.login(data),
        onSuccess: (data) => {
            console.log('🚀 ~ Login ~ data:', data)
            saveAccessToken(data.data.accessToken)
            saveAuthToken(data.data.refreshToken, {
                role: data.data.role,
                name: data.data.name,
                email: data.data.email
            })
            showNotification('success', 'Đăng nhập thành công')
            debounce(() => {
                window.location.reload()
            }, 1000)()
        },
        onError: (error) => {
            showNotification('error', error.message || 'Đăng nhập thất bại')
        }
    })
    const handleLogin = (values) => {
        mutationLogin.mutate(values)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !mutationLogin.isPending) {
            form.submit()
        }
    }

    return (
        <Modal
            centered
            footer={
                <Button
                    className='mt-4'
                    type='primary'
                    icon={<LoginOutlined />}
                    size='large'
                    block
                    loading={mutationLogin.isPending}
                    onClick={() => form.submit()}
                    htmlType='button'
                >
                    Đăng nhập
                </Button>
            }
            closeIcon={null}
            open
        >
            <Form form={form} colon={false} layout='vertical' onFinish={handleLogin} onKeyDown={handleKeyPress}>
                <div className='flex justify-center'>
                    <img src={logoXrm} className='h-18' />
                </div>
                <h1 className='mb-1'>Đăng nhập</h1>
                <p className='text-gray-500'>Chào mừng bạn quay trở lại</p>
                <Divider className='border border-gray-200' />
                <div>
                    <Form.Item
                        label='Tên đăng nhập'
                        name='email'
                        rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
                    >
                        <Input placeholder='Nhập tên đăng nhập' />
                    </Form.Item>
                    <Form.Item
                        label='Mật khẩu'
                        name='password'
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                        ]}
                    >
                        <Input.Password placeholder='Nhập mật khẩu' />
                    </Form.Item>
                </div>
            </Form>
        </Modal>
    )
}

export default Login
