import { useState, useEffect } from 'react'
import { View, ScrollView } from 'react-native'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { IAddress } from '@/types/user'

interface AddressFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    address: IAddress | null
    onSave: (addressData: Omit<IAddress, '_id'> | Partial<IAddress>) => void
    saving: boolean
}

export default function AddressFormDialog({ open, onOpenChange, address, onSave, saving }: AddressFormDialogProps) {
    const [formData, setFormData] = useState<Omit<IAddress, '_id'>>({
        name: '',
        phone: '',
        addressLine: '',
        city: '',
        ward: '',
        isDefault: false,
        location: {
            type: 'Point',
            coordinates: [106.6297, 10.8231]
        }
    })

    useEffect(() => {
        if (address) {
            setFormData({
                name: address.name,
                phone: address.phone,
                addressLine: address.addressLine,
                city: address.city,
                ward: address.ward,
                isDefault: address.isDefault,
                location: address.location || {
                    type: 'Point',
                    coordinates: [106.6297, 10.8231]
                }
            })
        } else {
            setFormData({
                name: '',
                phone: '',
                addressLine: '',
                city: '',
                ward: '',
                isDefault: false,
                location: {
                    type: 'Point',
                    coordinates: [106.6297, 10.8231]
                }
            })
        }
    }, [address, open])

    const handleSave = () => {
        onSave(formData)
    }

    const isValid = formData.name && formData.phone && formData.addressLine && formData.city && formData.ward

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='w-[90vw]'>
                <DialogHeader>
                    <DialogTitle>{address ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}</DialogTitle>
                    <DialogDescription>Nhập thông tin địa chỉ giao hàng</DialogDescription>
                </DialogHeader>

                <ScrollView showsVerticalScrollIndicator={false} className='max-h-96'>
                    <View className='gap-4'>
                        {/* Name */}
                        <View className='gap-2'>
                            <Label className='text-sm font-medium'>Tên người nhận *</Label>
                            <Input
                                value={formData.name}
                                onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
                                placeholder='Nhập tên người nhận'
                            />
                        </View>

                        {/* Phone */}
                        <View className='gap-2'>
                            <Label className='text-sm font-medium'>Số điện thoại *</Label>
                            <Input
                                value={formData.phone}
                                onChangeText={(text) => setFormData((prev) => ({ ...prev, phone: text }))}
                                placeholder='Nhập số điện thoại'
                                keyboardType='phone-pad'
                            />
                        </View>

                        {/* Address Line */}
                        <View className='gap-2'>
                            <Label className='text-sm font-medium'>Địa chỉ *</Label>
                            <Input
                                value={formData.addressLine}
                                onChangeText={(text) => setFormData((prev) => ({ ...prev, addressLine: text }))}
                                placeholder='Số nhà, tên đường'
                                multiline
                                numberOfLines={2}
                            />
                        </View>

                        {/* Ward */}
                        <View className='gap-2'>
                            <Label className='text-sm font-medium'>Phường/Xã *</Label>
                            <Input
                                value={formData.ward}
                                onChangeText={(text) => setFormData((prev) => ({ ...prev, ward: text }))}
                                placeholder='Nhập phường/xã'
                            />
                        </View>

                        {/* City */}
                        <View className='gap-2'>
                            <Label className='text-sm font-medium'>Tỉnh/Thành phố *</Label>
                            <Input
                                value={formData.city}
                                onChangeText={(text) => setFormData((prev) => ({ ...prev, city: text }))}
                                placeholder='Nhập tỉnh/thành phố'
                            />
                        </View>

                        {/* Is Default */}
                        <View className='flex-row items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3'>
                            <Label className='text-sm font-medium'>Đặt làm địa chỉ mặc định</Label>
                            <Switch
                                checked={formData.isDefault}
                                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isDefault: checked }))}
                            />
                        </View>
                    </View>
                </ScrollView>

                <DialogFooter className='flex-row gap-2'>
                    <DialogClose asChild>
                        <Button variant='outline' className='flex-1' disabled={saving}>
                            <Text>Hủy</Text>
                        </Button>
                    </DialogClose>
                    <Button className='flex-1 bg-green-600' onPress={handleSave} disabled={!isValid || saving}>
                        <Text className='text-white'>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
