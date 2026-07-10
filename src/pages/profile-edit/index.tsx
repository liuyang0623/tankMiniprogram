import { useEffect, useState } from 'react'
import { View, Text, Input, Textarea, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usersApi, uploadApi } from '../../services/api'
import { collectChanges } from '../../utils/profile'
import { useAuthStore } from '../../store/auth'
import { useUiStore } from '../../store/ui'
import type { User } from '../../types/api'

const GENDERS = ['保密', '男', '女']

interface FormState {
  nickname: string
  bio: string
  gender: number
  avatar: string
}

export default function ProfileEdit() {
  const showToast = useUiStore((s) => s.showToast)
  const [orig, setOrig] = useState<FormState | null>(null)
  const [form, setForm] = useState<FormState>({ nickname: '', bio: '', gender: 0, avatar: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    usersApi
      .getProfile()
      .then((u: User) => {
        const init: FormState = {
          nickname: u.nickname || '',
          bio: u.bio || '',
          gender: u.gender || 0,
          avatar: u.avatar || '',
        }
        setOrig(init)
        setForm(init)
      })
      .catch(() => showToast('资料加载失败', 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chooseAvatar = async () => {
    try {
      const res = await Taro.chooseImage({ count: 1, sizeType: ['compressed'] })
      const filePath = res.tempFilePaths[0]
      const { url } = await uploadApi.uploadImage(filePath)
      setForm((f) => ({ ...f, avatar: url }))
    } catch {
      showToast('头像上传失败', 'error')
    }
  }

  const save = async () => {
    if (!orig || saving) return
    const changed = collectChanges(orig as any, form as any)
    if (Object.keys(changed).length === 0) {
      showToast('没有修改', 'info')
      return
    }
    setSaving(true)
    try {
      const updated = await usersApi.updateProfile(changed)
      // 更新登录态的用户信息（保留 token）
      const { token } = useAuthStore.getState()
      useAuthStore.getState().setAuth(token, {
        id: updated.id,
        nickname: updated.nickname,
        avatar: updated.avatar,
      })
      Taro.navigateBack()
    } catch {
      showToast('保存失败，请重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View className='min-h-screen bg-bg px-6 pt-8'>
      {/* 头像 */}
      <View className='flex flex-col items-center mb-8'>
        <View className='press' onClick={chooseAvatar}>
          {form.avatar ? (
            <Image className='rounded-pill bg-haze' style={{ width: '160rpx', height: '160rpx' }} src={form.avatar} mode='aspectFill' />
          ) : (
            <View className='rounded-pill bg-haze' style={{ width: '160rpx', height: '160rpx' }} />
          )}
        </View>
        <View className='mt-2'>
          <Text className='text-xs text-ink-sub'>点击更换头像</Text>
        </View>
      </View>

      {/* 昵称 */}
      <View className='bg-card rounded-card shadow-soft p-5 mb-4'>
        <Text className='text-xs text-ink-sub'>昵称</Text>
        <Input
          className='mt-2 text-base text-ink'
          value={form.nickname}
          placeholder='起个名字吧'
          onInput={(e) => setForm((f) => ({ ...f, nickname: e.detail.value }))}
        />
      </View>

      {/* 简介 */}
      <View className='bg-card rounded-card shadow-soft p-5 mb-4'>
        <Text className='text-xs text-ink-sub'>简介</Text>
        <Textarea
          className='mt-2 text-base text-ink w-full'
          style={{ minHeight: '120rpx' }}
          value={form.bio}
          placeholder='介绍一下自己～'
          maxlength={100}
          onInput={(e) => setForm((f) => ({ ...f, bio: e.detail.value }))}
        />
      </View>

      {/* 性别 */}
      <View className='bg-card rounded-card shadow-soft p-5 mb-8'>
        <Text className='text-xs text-ink-sub'>性别</Text>
        <View className='flex mt-3'>
          {GENDERS.map((g, i) => (
            <View
              key={i}
              className={`press rounded-pill px-5 py-2 mr-3 ${form.gender === i ? 'bg-peach' : 'bg-bg'}`}
              onClick={() => setForm((f) => ({ ...f, gender: i }))}
            >
              <Text className={`text-sm ${form.gender === i ? 'text-card' : 'text-ink-sub'}`}>{g}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 保存 */}
      <View
        className={`press bg-peach rounded-pill py-3 flex justify-center items-center ${saving ? 'opacity-50' : ''}`}
        onClick={save}
      >
        <Text className='text-base text-card'>{saving ? '保存中…' : '保存'}</Text>
      </View>
    </View>
  )
}
