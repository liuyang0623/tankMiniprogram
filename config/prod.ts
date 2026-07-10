import type { UserConfigExport } from '@tarojs/cli'

export default {
  mini: {},
  h5: {
    /**
     * 生产环境可开启 optimizeMainPackage 等优化
     */
  },
} satisfies UserConfigExport<'webpack5'>
