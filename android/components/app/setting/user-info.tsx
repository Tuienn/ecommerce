import { View } from 'react-native'
import { Text } from '@/components/ui/text'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Mail, Phone } from 'lucide-react-native'

interface UserInfoProps {
    name: string
    email: string
    phone: string
}

export default function UserInfo({ name, email, phone }: UserInfoProps) {
    const getInitials = (name: string) => {
        const parts = name.split(' ')
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        }
        return name.slice(0, 2).toUpperCase()
    }

    return (
        <View className='mx-4 mb-4 rounded-lg border border-gray-200 bg-white p-4'>
            <View className='flex-row items-center gap-4'>
                {/* Avatar */}
                <Avatar alt={name} className='h-16 w-16'>
                    <AvatarFallback>
                        <Text className='text-xl font-bold text-white'>{getInitials(name)}</Text>
                    </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <View className='flex-1'>
                    <Text className='text-lg font-bold text-gray-900'>{name}</Text>
                    <View className='mt-2 gap-1'>
                        <View className='flex-row items-center gap-2'>
                            <Mail size={14} color='#6b7280' />
                            <Text className='text-sm text-gray-600'>{email}</Text>
                        </View>
                        <View className='flex-row items-center gap-2'>
                            <Phone size={14} color='#6b7280' />
                            <Text className='text-sm text-gray-600'>{phone}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    )
}
