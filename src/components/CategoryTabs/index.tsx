import { ScrollView, View, Text } from '@tarojs/components'
import { tabToQuery, type CategoryTab } from './helpers'

export { tabToQuery }
export type { CategoryTab }

interface CategoryTabsProps {
  tabs: CategoryTab[]
  activeKey: string
  onChange: (key: string) => void
}

/**
 * 首页分类 tab：横滑胶囊，选中态奶橘。
 */
export default function CategoryTabs({ tabs, activeKey, onChange }: CategoryTabsProps) {
  return (
    <ScrollView scrollX className='whitespace-nowrap' showScrollbar={false}>
      <View className='flex items-center px-4 py-2'>
        {tabs.map((tab) => {
          const active = tab.key === activeKey
          return (
            <View
              key={tab.key}
              className={`press inline-flex items-center justify-center px-4 py-1 mr-2 rounded-full ${
                active ? 'bg-peach' : 'bg-card'
              }`}
              onClick={() => onChange(tab.key)}
            >
              <Text className={`text-sm ${active ? 'text-white' : 'text-ink-sub'}`}>{tab.label}</Text>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}
