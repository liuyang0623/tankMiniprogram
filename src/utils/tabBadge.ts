import Taro from '@tarojs/taro'

/**
 * 刷新消息 tab 角标（index 3）。合并私信未读 + 系统通知未读，任一 store 更新后调用，
 * 内部读两个 store 的当前值求和，避免相互覆盖。
 * 动态 import 打破与 store 的循环依赖（store 调本工具，本工具读 store）。
 */
export function refreshMessageTabBadge() {
  Promise.all([import('../store/message'), import('../store/notification')])
    .then(([{ useMessageStore }, { useNotificationStore }]) => {
      const dm = useMessageStore.getState().unreadTotal
      const notif = useNotificationStore.getState().unreadCount
      const total = dm + notif
      if (total > 0) {
        Taro.setTabBarBadge({ index: 3, text: total > 99 ? '99+' : String(total) }).catch(() => {})
      } else {
        Taro.removeTabBarBadge({ index: 3 }).catch(() => {})
      }
    })
    .catch(() => {})
}
