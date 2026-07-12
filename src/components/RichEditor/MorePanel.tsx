import { View, Text } from '@tarojs/components'

// 预设色板（设计 token 主题色）
const COLORS = ['#F0A868', '#E4A9BE', '#8FBF9F', '#7FA9C9', '#C9A9E4', '#8A7F76', '#333333']
// S/M/L 字号映射
const FONT_SIZES: Array<{ label: string; value: string }> = [
  { label: 'S', value: '14px' },
  { label: 'M', value: '17px' },
  { label: 'L', value: '20px' },
]

interface Props {
  onFormat: (name: string, value?: string) => void
}

// catchTouchStart 阻止 editor 失焦丢光标
const stop = (e: any) => e.stopPropagation?.()

export default function MorePanel({ onFormat }: Props) {
  return (
    <View className='more-panel bg-card' catchMove onTouchStart={stop}>
      {/* 行内格式 */}
      <View className='panel-row'>
        <View className='panel-btn press' onClick={() => onFormat('italic')}>
          <Text className='panel-btn-txt'>斜体</Text>
        </View>
        <View className='panel-btn press' onClick={() => onFormat('underline')}>
          <Text className='panel-btn-txt'>下划线</Text>
        </View>
        <View className='panel-btn press' onClick={() => onFormat('strike')}>
          <Text className='panel-btn-txt'>删除线</Text>
        </View>
        <View className='panel-btn press' onClick={() => onFormat('list', 'ordered')}>
          <Text className='panel-btn-txt'>有序</Text>
        </View>
      </View>
      {/* 对齐 / 引用 / 分割线 / 缩进 */}
      <View className='panel-row'>
        <View className='panel-btn press' onClick={() => onFormat('align', 'left')}>
          <Text className='panel-btn-txt'>左</Text>
        </View>
        <View className='panel-btn press' onClick={() => onFormat('align', 'center')}>
          <Text className='panel-btn-txt'>中</Text>
        </View>
        <View className='panel-btn press' onClick={() => onFormat('align', 'right')}>
          <Text className='panel-btn-txt'>右</Text>
        </View>
        <View className='panel-btn press' onClick={() => onFormat('blockquote')}>
          <Text className='panel-btn-txt'>引用</Text>
        </View>
        <View className='panel-btn press' onClick={() => onFormat('indent', '+1')}>
          <Text className='panel-btn-txt'>缩进</Text>
        </View>
      </View>
      {/* 字号 S/M/L */}
      <View className='panel-row'>
        <Text className='panel-label text-ink-sub'>字号</Text>
        {FONT_SIZES.map((f) => (
          <View key={f.value} className='panel-btn press' onClick={() => onFormat('fontSize', f.value)}>
            <Text className='panel-btn-txt'>{f.label}</Text>
          </View>
        ))}
      </View>
      {/* 颜色预设色板 */}
      <View className='panel-row'>
        <Text className='panel-label text-ink-sub'>文字</Text>
        {COLORS.map((c) => (
          <View
            key={`fg-${c}`}
            className='color-dot press'
            style={{ background: c }}
            onClick={() => onFormat('color', c)}
          />
        ))}
      </View>
      {/* 背景色预设色板 */}
      <View className='panel-row'>
        <Text className='panel-label text-ink-sub'>背景</Text>
        {COLORS.map((c) => (
          <View
            key={`bg-${c}`}
            className='color-dot press'
            style={{ background: c }}
            onClick={() => onFormat('backgroundColor', c)}
          />
        ))}
      </View>
    </View>
  )
}
