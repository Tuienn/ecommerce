import { View, TouchableOpacity, Alert } from 'react-native'
import { Text } from '@/components/ui/text'
import { Badge } from '@/components/ui/badge'
import { IAddress } from '@/types/user'
import { MapPin, Phone, Edit, Trash2, Star } from 'lucide-react-native'

interface AddressItemProps {
    address: IAddress
    onEdit: (address: IAddress) => void
    onDelete: (addressId: string) => void
    onSetDefault: (addressId: string) => void
}

export default function AddressItem({ address, onEdit, onDelete, onSetDefault }: AddressItemProps) {
    const handleDelete = () => {
        Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa địa chỉ này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: () => onDelete(address._id!)
            }
        ])
    }

    return (
        <View className='mx-4 mb-3 rounded-lg border border-gray-200 bg-white p-4'>
            {/* Header */}
            <View className='mb-3 flex-row items-start justify-between'>
                <View className='flex-1'>
                    <View className='flex-row items-center gap-2'>
                        <Text className='text-base font-semibold text-gray-900'>{address.name}</Text>
                        {address.isDefault && (
                            <Badge className='border-green-500 bg-green-100'>
                                <Text className='text-xs font-medium text-green-700'>Mặc định</Text>
                            </Badge>
                        )}
                    </View>
                    <View className='mt-1 flex-row items-center gap-1'>
                        <Phone size={14} color='#6b7280' />
                        <Text className='text-sm text-gray-600'>{address.phone}</Text>
                    </View>
                </View>
            </View>

            {/* Address */}
            <View className='mb-3 flex-row items-start gap-2'>
                <MapPin size={16} color='#6b7280' className='mt-1' />
                <Text className='flex-1 text-sm text-gray-700'>
                    {address.addressLine}, {address.ward}, {address.city}
                </Text>
            </View>

            {/* Actions */}
            <View className='flex-row gap-2 border-t border-gray-100 pt-3'>
                {!address.isDefault && (
                    <TouchableOpacity
                        onPress={() => onSetDefault(address._id!)}
                        className='flex-1 flex-row items-center justify-center gap-2 rounded-md border border-green-500 bg-green-50 py-2'
                    >
                        <Star size={16} color='#16a34a' />
                        <Text className='text-sm font-medium text-green-600'>Mặc định</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={() => onEdit(address)}
                    className='flex-1 flex-row items-center justify-center gap-2 rounded-md border border-blue-500 bg-blue-50 py-2'
                >
                    <Edit size={16} color='#2563eb' />
                    <Text className='text-sm font-medium text-blue-600'>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleDelete}
                    className='flex-1 flex-row items-center justify-center gap-2 rounded-md border border-red-500 bg-red-50 py-2'
                >
                    <Trash2 size={16} color='#dc2626' />
                    <Text className='text-sm font-medium text-red-600'>Xóa</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}
