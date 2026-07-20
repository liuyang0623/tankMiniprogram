import { View, Text, ScrollView } from '@tarojs/components'
import type { ReactNode } from 'react'
import './index.scss'

interface Props {
  visible: boolean
  title?: string
  /** 右上角确认按钮文案，传空则不显示 */
  confirmText?: string
  confirmDisabled?: boolean
  onConfirm?: () => void
  onClose: () => void
  children: ReactNode
}

/**
 * 通用底部全屏抽屉：从下往上滑入 + 遮罩淡入，内容区可滚动。
 * 用于富文本提问 / 回答等需要较大输入空间的场景。
 */
export default function BottomSheet({
  visible, title, confirmText, confirmDisabled, onConfirm, onClose, children,
}: Props) {
  return (
    <View className={`bottom-sheet ${visible ? 'bottom-sheet--open' : ''}`}>
      <View className='bottom-sheet__mask' onClick={onClose} />
      <View className='bottom-sheet__panel'>
        <View className='bottom-sheet__bar'>
          <Text className='bottom-sheet__cancel press' onClick={onClose}>取消</Text>
          <Text className='bottom-sheet__title'>{title}</Text>
          {confirmText ? (
            <Text
              className={`bottom-sheet__confirm press ${confirmDisabled ? 'is-disabled' : ''}`}
              onClick={() => { if (!confirmDisabled) onConfirm?.() }}
            >
              {confirmText}
            </Text>
          ) : (
            <View className='bottom-sheet__confirm-placeholder' />
          )}
        </View>
        <ScrollView scrollY className='bottom-sheet__body'>
          {children}
        </ScrollView>
      </View>
    </View>
  )
}
