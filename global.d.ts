/// <reference types="@tarojs/taro" />

declare module '*.png'
declare module '*.gif'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.svg'
declare module '*.css'
declare module '*.scss'

declare namespace NodeJS {
  interface ProcessEnv {
    /** NODE_ENV */
    NODE_ENV: 'development' | 'production'
    /** 当前编译的平台 */
    TARO_ENV: 'weapp' | 'h5' | string
    /** 后端环境标识 */
    TARO_APP_ENV?: string
  }
}
