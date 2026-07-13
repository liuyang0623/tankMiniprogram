/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
  // 小程序无 DOM，关闭 preflight 重置
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        bg: 'var(--c-bg)', // 页面背景 奶油米白（spike 探针）
        card: '#FFFFFF', // 卡片
        'card-soft': '#FEFCF9', // 卡片次色
        peach: '#F0A868', // 主强调 奶橘
        taro: '#E4A9BE', // 次强调 藕粉
        haze: '#A6C0CE', // 点缀 雾霾蓝
        ink: '#4A413A', // 主文字 深棕灰
        'ink-sub': '#8A7F76', // 次文字
        heart: '#EF8A7F', // 互动暖红
      },
      borderRadius: {
        card: '24rpx',
        pill: '999rpx',
      },
      boxShadow: {
        soft: '0 8rpx 24rpx rgba(74,65,58,0.08)',
      },
      fontSize: {
        xs: '24rpx',
        sm: '28rpx',
        base: '32rpx',
        lg: '36rpx',
        xl: '44rpx',
        '2xl': '56rpx',
      },
    },
  },
  plugins: [],
}
