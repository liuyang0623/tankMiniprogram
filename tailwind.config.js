/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
  // 小程序无 DOM，关闭 preflight 重置
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        bg: 'var(--c-bg)', // 页面背景
        card: 'var(--c-card)', // 卡片
        'card-soft': 'var(--c-card-soft)', // 卡片次色
        peach: 'var(--c-peach)', // 主强调
        taro: 'var(--c-taro)', // 次强调
        haze: 'var(--c-haze)', // 点缀
        ink: 'var(--c-ink)', // 主文字
        'ink-sub': 'var(--c-ink-sub)', // 次文字
        heart: 'var(--c-heart)', // 互动暖红
      },
      borderRadius: {
        card: '24rpx',
        pill: '999rpx',
      },
      boxShadow: {
        soft: '0 8rpx 24rpx var(--c-shadow)',
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
