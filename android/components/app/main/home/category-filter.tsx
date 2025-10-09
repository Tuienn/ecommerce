import { useState, useEffect } from 'react'
import { View, ScrollView } from 'react-native'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { Toggle } from '@/components/ui/toggle'
import { ArrowDown, ArrowUp, Filter } from 'lucide-react-native'
import CategoryService from '@/services/category.service'
import { ICategory, FilterState } from '@/types/product'

interface CategoryFilterProps {
    appliedFilters: FilterState
    onFiltersApply: (filters: FilterState) => void
}

const CategoryFilter = ({ appliedFilters, onFiltersApply }: CategoryFilterProps) => {
    const [categories, setCategories] = useState<ICategory[]>([])
    const [loading, setLoading] = useState(true)

    // Temporary filter state (before applying)
    const [tempFilters, setTempFilters] = useState<FilterState>(appliedFilters)

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        setTempFilters(appliedFilters)
    }, [appliedFilters])

    const fetchCategories = async () => {
        try {
            setLoading(true)
            const response = await CategoryService.getAllCategories()

            setCategories(response || [])
        } catch (error) {
            console.error('Error fetching categories:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleCategory = (categoryId: string) => {
        setTempFilters((prev) => ({
            ...prev,
            categoryIds: prev.categoryIds.includes(categoryId)
                ? prev.categoryIds.filter((id) => id !== categoryId)
                : [...prev.categoryIds, categoryId]
        }))
    }

    const applyFilters = () => {
        onFiltersApply(tempFilters)
    }

    const clearFilters = () => {
        const clearedFilters: FilterState = {
            searchTerm: tempFilters.searchTerm, // Keep search term
            categoryIds: [],
            isFeatured: undefined,
            sortPrice: undefined,
            sortDiscount: undefined
        }
        setTempFilters(clearedFilters)
        onFiltersApply(clearedFilters)
    }

    const handlePriceSortToggle = (value: 'asc' | 'desc') => {
        setTempFilters((prev) => ({
            ...prev,
            sortPrice: prev.sortPrice === value ? undefined : value
        }))
    }

    const handleDiscountSortToggle = (value: 'asc' | 'desc') => {
        setTempFilters((prev) => ({
            ...prev,
            sortDiscount: prev.sortDiscount === value ? undefined : value
        }))
    }

    const handleFeaturedToggle = () => {
        setTempFilters((prev) => ({
            ...prev,
            isFeatured: prev.isFeatured ? undefined : true
        }))
    }

    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <Button variant='secondary' size={'icon'} className='flex-row items-center gap-2'>
                    <Filter size={16} />
                </Button>
            </HoverCardTrigger>
            <HoverCardContent className='w-96 p-4'>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View className='gap-4'>
                        {/* Categories Section */}
                        <View className='gap-3'>
                            <Text className='text-base font-semibold'>Danh mục</Text>
                            {loading ? (
                                <Text className='py-4 text-center'>Đang tải...</Text>
                            ) : (
                                <View className='flex-row flex-wrap gap-2'>
                                    {categories.map((category) => (
                                        <View key={category._id} className='w-[48%]'>
                                            <Toggle
                                                label={category.name}
                                                selected={tempFilters.categoryIds.includes(category._id)}
                                                onPress={() => toggleCategory(category._id)}
                                            />
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Featured Toggle */}
                        <View className='gap-3 border-t border-gray-200 pt-3'>
                            <Text className='text-base font-semibold'>Sản phẩm nổi bật</Text>
                            <Toggle
                                label='Nổi bật'
                                selected={!!tempFilters.isFeatured}
                                onPress={handleFeaturedToggle}
                            />
                        </View>

                        {/* Price Sort Section */}
                        <View className='gap-3 border-t border-gray-200 pt-3'>
                            <Text className='text-base font-semibold'>Sắp xếp theo</Text>
                            <View className='flex-row gap-2'>
                                <Toggle
                                    label='Giá tăng dần'
                                    selected={tempFilters.sortPrice === 'asc'}
                                    onPress={() => handlePriceSortToggle('asc')}
                                    icon={<ArrowUp size={16} />}
                                />

                                <Toggle
                                    label='Giá giảm dần'
                                    selected={tempFilters.sortPrice === 'desc'}
                                    onPress={() => handlePriceSortToggle('desc')}
                                    icon={<ArrowDown size={16} />}
                                />
                            </View>
                            <View className='flex-row gap-2'>
                                <Toggle
                                    label='% giảm tăng dần'
                                    selected={tempFilters.sortDiscount === 'asc'}
                                    onPress={() => handleDiscountSortToggle('asc')}
                                    icon={<ArrowUp size={16} />}
                                />
                                <Toggle
                                    label='% giảm giảm dần'
                                    selected={tempFilters.sortDiscount === 'desc'}
                                    onPress={() => handleDiscountSortToggle('desc')}
                                    icon={<ArrowDown size={16} />}
                                />
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View className='flex-row gap-2 border-t border-gray-200 pt-3'>
                            <HoverCardTrigger asChild>
                                <Button onPress={clearFilters} className='flex-1' variant={'destructive'}>
                                    <Text>Xóa bộ lọc</Text>
                                </Button>
                            </HoverCardTrigger>
                            <HoverCardTrigger asChild>
                                <Button onPress={applyFilters} className='flex-1'>
                                    <Text>Áp dụng</Text>
                                </Button>
                            </HoverCardTrigger>
                        </View>
                    </View>
                </ScrollView>
            </HoverCardContent>
        </HoverCard>
    )
}

export default CategoryFilter
