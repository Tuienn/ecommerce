import { useState, useEffect } from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { SafeAreaView } from 'react-native-safe-area-context'
import ImgCarousel from '@/components/app/product/img-carousel'
import ProductInfo from '@/components/app/product/product-item'
import ProductDetailSkeleton from '@/components/app/product/product-skeleton'
import PaymentDialog from '@/components/app/common/payment-dialog'
import ReviewList from '@/components/app/product/review-list'
import ProductService from '@/services/product.service'
import CartService from '@/services/cart.service'
import { IProduct } from '@/types/product'
import { CheckoutData } from '@/types/cart'
import { showNotification } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()
    const { isAuth } = useAuth()
    const [product, setProduct] = useState<IProduct | null>(null)
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [quantity, setQuantity] = useState('1')
    const [addingToCart, setAddingToCart] = useState(false)
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
    const [buyNowData, setBuyNowData] = useState<CheckoutData | null>(null)

    useEffect(() => {
        if (id) {
            fetchProductDetail()
        }
    }, [id])

    const fetchProductDetail = async () => {
        try {
            setLoading(true)
            const response = await ProductService.getProductById(id as string)
            setProduct(response.data)
        } catch (error) {
            console.error('Error fetching product:', error)
            showNotification('error', 'Không thể tải thông tin sản phẩm')
        } finally {
            setLoading(false)
        }
    }

    const handleBack = () => {
        router.back()
    }

    const handleOpenDialog = () => {
        // Check authentication before opening dialog
        if (!isAuth) {
            showNotification('error', 'Vui lòng đăng nhập để thêm vào giỏ hàng')
            router.push('/(auth)/(login)/login-by-email')
            return
        }
        setQuantity('1')
        setDialogOpen(true)
    }

    const handleAddToCart = async () => {
        if (!product) return

        const qty = parseInt(quantity)

        // Validate quantity
        if (isNaN(qty) || qty <= 0) {
            showNotification('error', 'Vui lòng nhập số lượng hợp lệ')
            return
        }

        if (qty > product.stock) {
            showNotification('error', `Số lượng không được vượt quá ${product.stock}`)
            return
        }

        try {
            setAddingToCart(true)
            await CartService.addToCart(product._id, qty)
            showNotification('success', `Đã thêm ${qty} ${product.unit} ${product.name} vào giỏ hàng`)
            setDialogOpen(false)
            setQuantity('1')
        } catch (error) {
            console.error('Error adding to cart:', error)
            showNotification('error', 'Không thể thêm vào giỏ hàng')
        } finally {
            setAddingToCart(false)
        }
    }

    const handleBuyNow = () => {
        // Check authentication before buying
        if (!isAuth) {
            showNotification('error', 'Vui lòng đăng nhập để mua hàng')
            router.push('/(auth)/(login)/login-by-email')
            return
        }

        if (!product) return

        // Create checkout data for single product
        const checkoutData: CheckoutData = {
            items: [
                {
                    productId: product._id,
                    name: product.name,
                    price: product.price,
                    basePrice: product.basePrice,
                    unit: product.unit,
                    quantity: 1,
                    total: product.price,
                    baseTotal: product.basePrice
                }
            ],
            totalAmount: product.price,
            baseTotalAmount: product.basePrice
        }

        setBuyNowData(checkoutData)
        setPaymentDialogOpen(true)
    }

    const handleBuyNowSuccess = () => {
        showNotification('success', 'Đơn hàng đã được tạo thành công')
        router.push('/(main)/order')
    }

    return (
        <SafeAreaView className='flex-1 bg-white'>
            {/* Header with Back Button */}
            <View className='flex-row items-center border-b border-gray-200 px-4 py-3'>
                <TouchableOpacity onPress={handleBack} className='mr-3'>
                    <ArrowLeft color='#000' size={24} />
                </TouchableOpacity>
                <Text className='text-lg font-semibold'>Chi tiết sản phẩm</Text>
            </View>

            {/* Content */}
            {loading ? (
                <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
                    <ProductDetailSkeleton />
                </ScrollView>
            ) : product ? (
                <View className='flex-1'>
                    <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
                        {/* Product Images Carousel */}
                        <ImgCarousel images={product.images} />

                        {/* Product Info */}
                        <ProductInfo product={product} />

                        {/* Reviews */}
                        <ReviewList productId={product._id} />
                    </ScrollView>

                    {/* Bottom Action Buttons */}
                    <View className='flex-row gap-3 border-t border-gray-200 bg-white px-4 py-3'>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    onPress={handleOpenDialog}
                                    variant='outline'
                                    className='flex-1 border-green-600'
                                    disabled={product.stock === 0}
                                >
                                    <Text className='font-semibold text-green-600'>Thêm vào giỏ</Text>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className='w-[90vw]'>
                                <DialogHeader>
                                    <DialogTitle>Thêm vào giỏ hàng</DialogTitle>
                                    <DialogDescription>
                                        {product.name} - Còn lại: {product.stock} {product.unit}
                                    </DialogDescription>
                                </DialogHeader>
                                <View className='gap-2'>
                                    <Text className='text-sm font-medium'>Số lượng ({product.unit})</Text>
                                    <Input
                                        value={quantity}
                                        onChangeText={setQuantity}
                                        keyboardType='numeric'
                                        placeholder='Nhập số lượng'
                                        maxLength={10}
                                    />
                                    <Text className='text-xs text-gray-500'>
                                        Tối đa: {product.stock} {product.unit}
                                    </Text>
                                </View>
                                <DialogFooter className='flex-row gap-3'>
                                    <DialogClose asChild>
                                        <Button variant='outline' className='flex-1' disabled={addingToCart}>
                                            <Text>Hủy</Text>
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        onPress={handleAddToCart}
                                        className='flex-1 bg-green-600'
                                        disabled={addingToCart}
                                    >
                                        <Text className='text-white'>{addingToCart ? 'Đang thêm...' : 'Xác nhận'}</Text>
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Button onPress={handleBuyNow} className='flex-1 bg-green-600' disabled={product.stock === 0}>
                            <Text className='font-semibold text-white'>Mua ngay</Text>
                        </Button>
                    </View>
                </View>
            ) : (
                <View className='flex-1 items-center justify-center'>
                    <Text className='text-gray-500'>Không tìm thấy sản phẩm</Text>
                </View>
            )}

            {/* Payment Dialog */}
            <PaymentDialog
                open={paymentDialogOpen}
                onOpenChange={setPaymentDialogOpen}
                checkoutData={buyNowData}
                onSuccess={handleBuyNowSuccess}
            />
        </SafeAreaView>
    )
}
