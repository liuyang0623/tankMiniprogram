import { useEffect, useState } from 'react'
import { View, Text, Input, Textarea, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usersApi, uploadApi } from '../../services/api'
import { PageLayout } from '../../components'
import { collectChanges } from '../../utils/profile'
import { useAuthStore } from '../../store/auth'
import { useUiStore } from '../../store/ui'
import type { User } from '../../types/api'
import './index.scss'

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
  const [uploading, setUploading] = useState(false)

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

  // 微信头像授权：open-type=chooseAvatar 返回临时头像路径，上传取正式 URL
  const onChooseAvatar = async (e: any) => {
    const avatarUrl = e?.detail?.avatarUrl
    if (!avatarUrl || uploading) return
    setUploading(true)
    try {
      const { url } = await uploadApi.uploadImage(avatarUrl)
      setForm((f) => ({ ...f, avatar: url }))
    } catch {
      showToast('头像上传失败', 'error')
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    if (!orig || saving || uploading) return
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
    <PageLayout>
      <View className='min-h-screen bg-bg px-6 pt-8'>
      {/* 头像：微信头像授权 */}
      <View className='flex flex-col items-center mb-8'>
        <Button className='avatar-btn' openType='chooseAvatar' onChooseAvatar={onChooseAvatar}>
          {form.avatar ? (
            <Image className='rounded-pill bg-haze' style={{ width: '160rpx', height: '160rpx' }} src={form.avatar} mode='aspectFill' />
          ) : (
            <View className='rounded-pill bg-haze' style={{ width: '160rpx', height: '160rpx' }} />
          )}
        </Button>
        <View className='mt-2'>
          <Text className='text-xs text-ink-sub'>{uploading ? '上传中…' : '点击使用微信头像'}</Text>
        </View>
      </View>

      {/* 昵称：微信昵称授权 */}
      <View className='bg-card rounded-card shadow-soft p-5 mb-4'>
        <Text className='text-xs text-ink-sub'>昵称</Text>
        <Input
          className='mt-2 text-base text-ink'
          type='nickname'
          value={form.nickname}
          placeholder='点击填写或使用微信昵称'
          onInput={(e) => setForm((f) => ({ ...f, nickname: e.detail.value }))}
          onBlur={(e) => setForm((f) => ({ ...f, nickname: e.detail.value }))}
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
        className={`press bg-peach rounded-pill py-3 flex justify-center items-center ${saving || uploading ? 'opacity-50' : ''}`}
        onClick={save}
      >
        <Text className='text-base text-card'>{saving ? '保存中…' : '保存'}</Text>
      </View>
    </View>
    </PageLayout>
  )
}
