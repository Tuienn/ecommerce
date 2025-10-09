import React from 'react'
import { TouchableOpacity, Text } from 'react-native'

interface ToggleProps {
  label: string
  selected: boolean
  onPress: () => void
  icon?: React.ReactNode
}

export const Toggle: React.FC<ToggleProps> = ({ label, selected, onPress, icon }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`
        px-4 py-2 rounded-xl border flex items-center gap-2 flex-row justify-center
        ${selected ? 'border-primary' : 'border-gray-300'}
      `}
    >
      {icon}
      <Text className={`${selected ? 'text-primary' : 'text-gray-600'} text-center font-medium`}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}
