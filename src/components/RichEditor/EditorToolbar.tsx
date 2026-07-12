import { View, Text } from '@tarojs/components'

interface Props {
  onFormat: (name: string, value?: string) => void
  onInsertImage: () => void
  onInsertTopic: () => void
  onToggleMore: () => void
  moreOpen: boolean
  uploading: boolean
}

// catchTouchStart 阻止 editor 失焦丢光标
const stop = (e: any) => e.stopPropagation?.()

export default function EditorToolbar({
  onFormat,
  onInsertImage,
  onInsertTopic,
  onToggleMore,
  moreOpen,
  uploading,
}: Props) {
  return (
    <View className='editor-toolbar bg-card' onTouchStart={stop}>
      <View className='tool-btn press' onClick={() => onFormat('bold')}>
        <Text className='tool-txt font-bold'>B</Text>
      </View>
      <View className='tool-btn press' onClick={() => onFormat('header', 'H2')}>
        <Text className='tool-txt'>H2</Text>
      </View>
      <View className='tool-btn press' onClick={() => onFormat('list', 'bullet')}>
        <Text className='tool-txt'>• 列表</Text>
      </View>
      <View className={`tool-btn press ${uploading ? 'opacity-50' : ''}`} onClick={onInsertImage}>
        <Text className='tool-txt'>{uploading ? '上传…' : '图片'}</Text>
      </View>
      <View className='tool-btn press' onClick={onInsertTopic}>
        <Text className='tool-txt'>#话题</Text>
      </View>
      <View className='tool-btn press' onClick={onToggleMore}>
        <Text className='tool-txt'>{moreOpen ? '收起' : '更多'}</Text>
      </View>
    </View>
  )
}
