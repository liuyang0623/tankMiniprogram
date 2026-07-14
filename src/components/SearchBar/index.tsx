import { useState } from 'react'
import { View, Input } from '@tarojs/components'
import { Iconfont } from '../index'

interface SearchBarProps {
  /** 搜索触发（点击搜索键/确认） */
  onSearch: (keyword: string) => void
  /** 点击加号（发布入口） */
  onAdd: () => void
  /** 占位文案 */
  placeholder?: string
}

/**
 * 首页顶部搜索栏：搜索输入框（点击搜索触发）+ 右侧圆形加号（发布入口）。
 */
export default function SearchBar({ onSearch, onAdd, placeholder = '搜索文章标题' }: SearchBarProps) {
  const [value, setValue] = useState('')

  const handleConfirm = () => {
    onSearch(value.trim())
  }

  const handleClear = () => {
    setValue('')
    onSearch('')
  }

  return (
    <View className='flex items-center px-4 py-2'>
      {/* 搜索框 */}
      <View className='flex-1 flex items-center h-9 rounded-full bg-card px-3 mr-3'>
        <Iconfont name='sousuo' size={16} color='#8a7f76' />
        <Input
          className='flex-1 ml-2 text-sm text-ink'
          placeholderClass='text-ink-sub'
          placeholder={placeholder}
          value={value}
          onInput={(e) => setValue(e.detail.value)}
          confirmType='search'
          onConfirm={handleConfirm}
        />
        {value ? (
          <View className='press w-5 h-5 flex items-center justify-center' onClick={handleClear}>
            <Iconfont name='shanchu' size={14} color='#8a7f76' />
          </View>
        ) : null}
      </View>
      {/* 加号发布入口 */}
      <View
        className='press w-9 h-9 rounded-full bg-peach flex items-center justify-center flex-shrink-0'
        onClick={onAdd}
      >
        <Iconfont name='jiahao' size={20} color='#ffffff' />
      </View>
    </View>
  )
}
