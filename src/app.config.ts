export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/publish/index',
    'pages/profile/index',
    'pages/detail/index',
    'pages/profile-edit/index',
    'pages/drafts/index',
    'pages/user-profile/index',
    'pages/follow-list/index',
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
      { pagePath: 'pages/index/index', text: '首页' },
      { pagePath: 'pages/publish/index', text: '发布' },
      { pagePath: 'pages/profile/index', text: '我的' },
    ],
  },
})
