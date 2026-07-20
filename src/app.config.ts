export default defineAppConfig({
  // 组件按需注入：仅注入页面实际用到的组件，提审代码质量必查项
  lazyCodeLoading: 'requiredComponents',
  pages: [
    'pages/index/index',
    'pages/messages/index',
    'pages/publish/index',
    'pages/profile/index',
    'pages/detail/index',
    'pages/profile-edit/index',
    'pages/drafts/index',
    'pages/user-profile/index',
    'pages/follow-list/index',
    'pages/chat/index',
    'pages/diary/index',
    'pages/diary/edit',
    'pages/diary/detail',
    'pages/notifications/index',
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#FAF6F0',
    navigationBarTitleText: '摆烂随笔',
    navigationBarTextStyle: 'black',
    backgroundColor: '#FAF6F0',
  },
  tabBar: {
    color: '#8A7F76',
    selectedColor: '#F0A868',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-active.png',
      },
      {
        pagePath: 'pages/diary/index',
        text: '日记',
        iconPath: 'assets/tabbar/diary.png',
        selectedIconPath: 'assets/tabbar/diary-active.png',
      },
      {
        pagePath: 'pages/messages/index',
        text: '消息',
        iconPath: 'assets/tabbar/message.png',
        selectedIconPath: 'assets/tabbar/message-active.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/tabbar/profile.png',
        selectedIconPath: 'assets/tabbar/profile-active.png',
      },
    ],
  },
})
