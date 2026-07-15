import { View, Text } from '@tarojs/components'
import type { Notebook } from '../../types/diary'
import './index.scss'

interface Props {
  open: boolean
  notebooks: Notebook[]
  activeId?: number
  onSelect: (id: number) => void
  onCreate: () => void
  onManage: () => void
  onClose: () => void
}

export default function NotebookDrawer({
  open, notebooks, activeId, onSelect, onCreate, onManage, onClose,
}: Props) {
  if (!open) return null
  return (
    <View className='nb-drawer'>
      <View className='nb-drawer__mask' onClick={onClose} />
      <View className='nb-drawer__panel'>
        {notebooks.map((nb) => (
          <View
            key={nb.id}
            className={`nb-item ${activeId === nb.id ? 'nb-item--active' : ''}`}
            onClick={() => onSelect(nb.id)}
          >
            <View className='nb-item__dot' style={{ background: nb.color }} />
            <Text className='nb-item__name'>{nb.name}</Text>
            <Text className='nb-item__count'>{nb.diaryCount} 篇</Text>
            {activeId === nb.id ? <Text className='nb-item__check'>✓</Text> : null}
          </View>
        ))}
        <View className='nb-divider' />
        <View className='nb-action' onClick={onCreate}>
          <Text className='nb-action__text'>＋ 新建日记本</Text>
        </View>
        <View className='nb-action' onClick={onManage}>
          <Text className='nb-action__text'>⚙ 管理日记本</Text>
        </View>
      </View>
    </View>
  )
}
