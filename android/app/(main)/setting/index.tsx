import { useState, useEffect } from 'react'
import { View, ScrollView, RefreshControl } from 'react-native'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import UserInfo from '@/components/app/setting/user-info'
import AddressItem from '@/components/app/setting/address-item'
import AddressSkeleton from '@/components/app/setting/address-skeleton'
import AddressFormDialog from '@/components/app/setting/address-form-dialog'
import UserService from '@/services/user.service'
import { IAddress } from '@/types/user'
import { showNotification } from '@/lib/utils'
import { Plus, LogOut, LogIn, UserPlus } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import AuthSerice from '@/services/auth.service'
import { useAuth } from '@/hooks/use-auth'

interface UserProfile {
    _id: string
    name: string
    email: string
    phone: string
    role: string
    addresses: IAddress[]
}

export default function SettingScreen() {
    const router = useRouter()
    const { isAuth, logout } = useAuth()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [addresses, setAddresses] = useState<IAddress[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedAddress, setSelectedAddress] = useState<IAddress | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (isAuth) {
            fetchData()
        } else {
            setLoading(false)
        }
    }, [isAuth])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [profileRes, addressesRes] = await Promise.all([
                AuthSerice.getCurrentUserProfile(),
                UserService.getAddresses()
            ])

            setProfile(profileRes.data)
            setAddresses(addressesRes.data || [])
        } catch (error) {
            console.error('Error fetching data:', error)
            showNotification('error', 'Không thể tải thông tin')
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchData()
        setRefreshing(false)
    }

    const handleAddAddress = () => {
        setSelectedAddress(null)
        setDialogOpen(true)
    }

    const handleEditAddress = (address: IAddress) => {
        setSelectedAddress(address)
        setDialogOpen(true)
    }

    const handleSaveAddress = async (addressData: Omit<IAddress, '_id'> | Partial<IAddress>) => {
        try {
            setSaving(true)

            if (selectedAddress?._id) {
                // Update existing address
                await UserService.updateAddress(selectedAddress._id, addressData as any)
                showNotification('success', 'Cập nhật địa chỉ thành công')
            } else {
                // Add new address
                await UserService.addAddress(addressData as any)
                showNotification('success', 'Thêm địa chỉ thành công')
            }

            setDialogOpen(false)
            await fetchData()
        } catch (error) {
            console.error('Error saving address:', error)
            showNotification('error', 'Không thể lưu địa chỉ')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteAddress = async (addressId: string) => {
        try {
            await UserService.deleteAddress(addressId)
            showNotification('success', 'Xóa địa chỉ thành công')
            await fetchData()
        } catch (error) {
            console.error('Error deleting address:', error)
            showNotification('error', 'Không thể xóa địa chỉ')
        }
    }

    const handleSetDefaultAddress = async (addressId: string) => {
        try {
            await UserService.setDefaultAddress(addressId)
            showNotification('success', 'Đã đặt làm địa chỉ mặc định')
            await fetchData()
        } catch (error) {
            console.error('Error setting default address:', error)
            showNotification('error', 'Không thể đặt địa chỉ mặc định')
        }
    }

    // Guest mode UI
    if (!isAuth) {
        return (
            <View className='flex-1 bg-gray-50'>
                {/* Header */}
                <View className='border-b border-gray-200 bg-white px-4 py-4'>
                    <Text className='text-xl font-bold text-gray-900'>Cài đặt</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
                    <View className='flex-1 items-center justify-center px-4 pt-20'>
                        {/* Welcome Section */}
                        <View className='mb-8 items-center'>
                            <View className='mb-4 h-24 w-24 items-center justify-center rounded-full bg-green-100'>
                                <LogIn size={48} color='#16a34a' />
                            </View>
                            <Text className='mb-2 text-center text-2xl font-bold text-gray-900'>
                                Chào mừng đến với ứng dụng
                            </Text>
                            <Text className='text-center text-base text-gray-600'>
                                Đăng nhập để quản lý đơn hàng, giỏ hàng và địa chỉ giao hàng
                            </Text>
                        </View>

                        {/* Action Buttons */}
                        <View className='w-full max-w-sm gap-3'>
                            <Button onPress={() => router.push('/(auth)/(login)/login-by-email')}>
                                <LogIn size={20} color='white' />
                                <Text>Đăng nhập</Text>
                            </Button>

                            <Button
                                onPress={() => router.push('/(auth)/(register)/register-by-email')}
                                variant='outline'
                            >
                                <UserPlus size={20} color='#16a34a' />
                                <Text>Đăng ký</Text>
                            </Button>
                        </View>

                        {/* Info Cards */}
                        <View className='mt-12 w-full max-w-sm gap-3'>
                            <View className='rounded-lg bg-white p-4 shadow-sm'>
                                <Text className='mb-1 font-semibold text-gray-900'>🛒 Giỏ hàng</Text>
                                <Text className='text-sm text-gray-600'>
                                    Lưu trữ và quản lý sản phẩm yêu thích của bạn
                                </Text>
                            </View>
                            <View className='rounded-lg bg-white p-4 shadow-sm'>
                                <Text className='mb-1 font-semibold text-gray-900'>📦 Đơn hàng</Text>
                                <Text className='text-sm text-gray-600'>Theo dõi trạng thái đơn hàng của bạn</Text>
                            </View>
                            <View className='rounded-lg bg-white p-4 shadow-sm'>
                                <Text className='mb-1 font-semibold text-gray-900'>📍 Địa chỉ</Text>
                                <Text className='text-sm text-gray-600'>Quản lý địa chỉ giao hàng dễ dàng</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        )
    }

    // Authenticated user UI
    return (
        <View className='flex-1 bg-gray-50'>
            {/* Header */}
            <View className='border-b border-gray-200 bg-white px-4 py-4'>
                <View className='flex-row items-center justify-between'>
                    <Text className='text-xl font-bold text-gray-900'>Cài đặt</Text>
                    <Button onPress={logout} className='flex-row items-center gap-2 rounded-lg bg-red-50 px-3 py-2'>
                        <LogOut size={18} color='#dc2626' />
                        <Text className='text-sm font-medium text-red-600'>Đăng xuất</Text>
                    </Button>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#16a34a']} />
                }
                contentContainerStyle={{ paddingBottom: 80 }}
            >
                {loading ? (
                    <View className='pt-4'>
                        {/* User Info Skeleton */}
                        <View className='mx-4 mb-4 rounded-lg border border-gray-200 bg-white p-4'>
                            <View className='h-16 w-16 rounded-full bg-gray-200' />
                        </View>

                        {/* Address Skeletons */}
                        {[1, 2, 3].map((key) => (
                            <AddressSkeleton key={key} />
                        ))}
                    </View>
                ) : (
                    <View className='pt-4'>
                        {/* User Info */}
                        {profile && <UserInfo name={profile.name} email={profile.email} phone={profile.phone} />}

                        {/* Addresses Section */}
                        <View className='mb-4'>
                            <View className='mb-3 flex-row items-center justify-between px-4'>
                                <Text className='text-lg font-bold text-gray-900'>Địa chỉ giao hàng</Text>
                                <Button onPress={handleAddAddress} className='flex-row items-center gap-2 bg-green-600'>
                                    <Plus size={16} color='white' />
                                    <Text className='text-sm font-medium text-white'>Thêm</Text>
                                </Button>
                            </View>

                            {addresses.length === 0 ? (
                                <View className='mx-4 rounded-lg border border-dashed border-gray-300 bg-white py-12'>
                                    <Text className='text-center text-gray-500'>Chưa có địa chỉ nào</Text>
                                    <Text className='mt-1 text-center text-sm text-gray-400'>
                                        Thêm địa chỉ để dễ dàng đặt hàng
                                    </Text>
                                </View>
                            ) : (
                                addresses.map((address) => (
                                    <AddressItem
                                        key={address._id}
                                        address={address}
                                        onEdit={handleEditAddress}
                                        onDelete={handleDeleteAddress}
                                        onSetDefault={handleSetDefaultAddress}
                                    />
                                ))
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Address Form Dialog */}
            <AddressFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                address={selectedAddress}
                onSave={handleSaveAddress}
                saving={saving}
            />
        </View>
    )
}
