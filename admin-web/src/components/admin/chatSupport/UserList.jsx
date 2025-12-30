import { Avatar, List, Typography, Spin, Empty, Button } from 'antd'
import { UserOutlined, ReloadOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'

import ChatService from '../../../services/chat.service'

const { Text } = Typography

const UserList = ({ enabled, userId, selectedUserId, onSelectUser }) => {
    const {
        data: users,
        isLoading,
        refetch
    } = useQuery({
        queryKey: ['chatUsers'],
        queryFn: () => ChatService.getUsersWithChatKey(),
        enabled,
        select: (res) => {
            const userList = res.data || []
            return userList.filter((u) => {
                const uid = u.userId?._id || u.userId
                return String(uid) !== String(userId)
            })
        }
    })

    if (isLoading) {
        return (
            <div className='flex h-full items-center justify-center'>
                <Spin tip='Đang tải...' />
            </div>
        )
    }

    if (!users || users.length === 0) {
        return (
            <div className='flex h-full items-center justify-center'>
                <Empty description='Chưa có cuộc hội thoại nào' image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
        )
    }

    return (
        <div className='flex h-full flex-col'>
            <div className='border-b border-gray-200 bg-gray-50 p-4'>
                <div className='flex items-center justify-between'>
                    <Text strong className='text-lg'>
                        Hỗ trợ khách hàng
                    </Text>
                    <Button icon={<ReloadOutlined />} size='small' onClick={() => refetch()} loading={isLoading} />
                </div>
            </div>
            <List
                className='flex-1 overflow-y-auto'
                dataSource={users}
                renderItem={(user) => {
                    const itemUserId = user.userId?._id || user.userId
                    const isSelected = itemUserId === selectedUserId

                    return (
                        <List.Item
                            className={`cursor-pointer border-b border-gray-100 transition-colors hover:bg-blue-50 ${
                                isSelected ? 'border-l-4 border-l-blue-500 bg-blue-100' : ''
                            }`}
                            onClick={() => onSelectUser(user)}
                        >
                            <div className='flex w-full items-center gap-3 px-1'>
                                <Avatar
                                    size={44}
                                    icon={<UserOutlined />}
                                    style={{
                                        backgroundColor: isSelected ? '#1890ff' : '#87d068'
                                    }}
                                />
                                <div className='min-w-0 flex-1'>
                                    <div className='flex items-center justify-between'>
                                        <Text strong className='block truncate'>
                                            {user.userId?.name || user.userId?.email || 'Khách hàng'}
                                        </Text>
                                    </div>
                                    <Text type='secondary' className='block truncate text-xs'>
                                        {user.userId?.email || 'No email'}
                                    </Text>
                                </div>
                            </div>
                        </List.Item>
                    )
                }}
            />
        </div>
    )
}

export default UserList
