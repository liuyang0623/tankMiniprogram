import { View, Text } from '@tarojs/components'

export default function Publish() {
  return (
    <View style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#8a7f76' }}>发布（占位，后续 change 实现富文本编辑）</Text>
    </View>
  )
}
