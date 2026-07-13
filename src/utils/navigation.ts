import Taro from '@tarojs/taro'
import { useAuthStore } from '../store/auth'

/**
 * 跳转到某用户主页：若是当前登录用户本人，切到「我的」tab；
 * 否则进入他人主页。避免点到自己头像进入「自己的他人主页」并触发自关注。
 */
export function goUserProfile(userId?: number): void {
  if (userId == null) return
  const selfId = useAuthStore.getState().user?.id
  if (selfId != null && selfId === userId) {
    Taro.switchTab({ url: '/pages/profile/index' })
    return
  }
  Taro.navigateTo({ url: `/pages/user-profile/index?id=${userId}` })
}
