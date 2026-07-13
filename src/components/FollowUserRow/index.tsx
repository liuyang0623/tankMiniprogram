import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Avatar } from '../index'
import FollowButton from '../FollowButton'
import type { FollowUserItem } from '../../types/api'

export interface FollowUserRowProps {
  user: FollowUserItem
  /** 当前登录用户 id，等于该项时不显示关注按钮 */
  currentUserId?: number
}

/** 关注/粉丝列表项：头像+昵称+简介，右侧关注按钮，点击行进他人主页 */
export default function FollowUserRow({ user, currentUserId }: FollowUserRowProps) {
  const goProfile = () => {
    Taro.navigateTo({ url: `/pages/user-profile/index?id=${user.id}` })
  }
  const isSelf = currentUserId != null && currentUserId === user.id

  return (
    <View
      className='press flex items-center bg-card rounded-card shadow-soft px-4 py-3 mb-3'
      onClick={goProfile}
    >
      <Avatar src={user.avatar} size={80} />
      <View className='ml-3 flex-1 min-w-0'>
        <Text className='text-sm text-ink'>{user.nickname || '匿名'}</Text>
        {!!user.bio && (
          <View className='mt-1'>
            <Text className='text-xs text-ink-sub'>{user.bio}</Text>
          </View>
        )}
      </View>
      {!isSelf && <FollowButton userId={user.id} size='small' className='ml-2' />}
    </View>
  )
}
