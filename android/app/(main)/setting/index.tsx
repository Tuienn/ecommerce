import { useState, useEffect } from 'react'
import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import UserInfo from '@/components/app/setting/user-info'
import AddressItem from '@/components/app/setting/address-item'
import AddressSkeleton from '@/components/app/setting/address-skeleton'
import AddressFormDialog from '@/components/app/setting/address-form-dialog'
import UserService from '@/services/user.service'
import { IAddress } from '@/types/user'
import { showNotification } from '@/lib/utils'
import { clearAuthToken, getRefreshToken } from '@/lib/secure-store'
import { Plus, LogOut } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import AuthSerice from '@/services/auth.service'

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
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [addresses, setAddresses] = useState<IAddress[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedAddress, setSelectedAddress] = useState<IAddress | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

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

    const handleLogout = async () => {
        try {
            const refreshToken = await getRefreshToken()
            if (!refreshToken) {
                await clearAuthToken()
                return
            }
            await clearAuthToken()
            await AuthSerice.logout(refreshToken)
            showNotification('success', 'Đăng xuất thành công')
            router.replace('/(auth)/(login)/login-by-email')
        } catch (error) {
            console.error('Error logging out:', error)
            showNotification('error', 'Không thể đăng xuất')
        }
    }

    return (
        <View className='flex-1 bg-gray-50'>
            {/* Header */}
            <View className='border-b border-gray-200 bg-white px-4 py-4'>
                <View className='flex-row items-center justify-between'>
                    <Text className='text-xl font-bold text-gray-900'>Cài đặt</Text>
                    <Button
                        onPress={handleLogout}
                        className='flex-row items-center gap-2 rounded-lg bg-red-50 px-3 py-2'
                    >
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
