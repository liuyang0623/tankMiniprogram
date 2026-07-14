import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { categoriesApi } from '../../services/api'
import type { CategoryInfo } from '../../types/api'

interface CategoryPickerProps {
  /** 当前选中分类 value，空=未选（其他） */
  value: string
  onChange: (value: string) => void
}

/**
 * 发布页分类单选：拉取固定分类，横向单选。可再次点击取消选择（归为其他）。
 */
export default function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const [categories, setCategories] = useState<CategoryInfo[]>([])

  useEffect(() => {
    categoriesApi
      .list()
      .then(setCategories)
      .catch(() => {})
  }, [])

  return (
    <View className='py-2'>
      <View className='flex items-center mb-2'>
        <Text className='text-sm text-ink-sub'>分类</Text>
      </View>
      <View className='flex flex-wrap'>
        {categories.map((c) => {
          const active = c.value === value
          return (
            <View
              key={c.value}
              className={`press inline-flex items-center justify-center px-4 py-1 mr-2 mb-2 rounded-full ${
                active ? 'bg-peach' : 'bg-card'
              }`}
              onClick={() => onChange(active ? '' : c.value)}
            >
              <Text className={`text-sm ${active ? 'text-white' : 'text-ink-sub'}`}>{c.label}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
