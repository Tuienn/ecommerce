import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react-native'
import { useState, useEffect } from 'react'
import { View } from 'react-native'

interface SearchInputProps {
    onSearch: (searchTerm: string) => void
    placeholder?: string
    initialValue?: string
}

const SearchInput = ({ onSearch, placeholder = 'Tìm kiếm sản phẩm...', initialValue = '' }: SearchInputProps) => {
    const [searchTerm, setSearchTerm] = useState(initialValue)

    useEffect(() => {
        setSearchTerm(initialValue)
    }, [initialValue])

    const handleSearch = () => {
        onSearch(searchTerm.trim())
    }

    const handleSubmitEditing = () => {
        handleSearch()
    }

    return (
        <View className='flex-1 flex-row items-center gap-2'>
            <View className='flex-1'>
                <Input
                    placeholder={placeholder}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    onSubmitEditing={handleSubmitEditing}
                    returnKeyType='search'
                    className='pr-10'
                />
            </View>
            <Button onPress={handleSearch} size='icon' variant='outline' className='h-10 w-10'>
                <Search size={18} color='#6b7280' />
            </Button>
        </View>
    )
}

export default SearchInput
