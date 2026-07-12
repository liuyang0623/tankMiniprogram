import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { View, Editor } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { uploadApi } from '../../services/api'
import { useUiStore } from '../../store/ui'
import EditorToolbar from './EditorToolbar'
import MorePanel from './MorePanel'
import './index.scss'

export interface RichEditorHandle {
  getContents: () => Promise<{ html: string; text: string }>
  setContents: (html: string) => void
  insertImage: (src: string) => void
}

interface Props {
  placeholder?: string
  onInput?: () => void
  onInsertTopic?: () => void
}

const RichEditor = forwardRef<RichEditorHandle, Props>(function RichEditor(
  { placeholder = '记录此刻的摆烂…', onInput, onInsertTopic },
  ref,
) {
  const showToast = useUiStore((s) => s.showToast)
  const ctxRef = useRef<any>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const onEditorReady = () => {
    Taro.createSelectorQuery()
      .select('#editor')
      .context((res) => {
        ctxRef.current = res.context
      })
      .exec()
  }

  const format = (name: string, value?: string) => {
    ctxRef.current?.format(name, value)
  }

  const insertImage = (src: string) => {
    ctxRef.current?.insertImage({ src, width: '100%' })
  }

  const chooseAndInsert = async () => {
    if (uploading) return
    try {
      const res = await Taro.chooseImage({ count: 1 })
      const filePath = res.tempFilePaths?.[0]
      if (!filePath) return
      setUploading(true)
      const { url } = await uploadApi.uploadImage(filePath)
      insertImage(url)
      onInput?.()
    } catch {
      showToast('图片上传失败', 'error')
    } finally {
      setUploading(false)
    }
  }

  useImperativeHandle(ref, () => ({
    getContents: () =>
      new Promise((resolve) => {
        if (!ctxRef.current) return resolve({ html: '', text: '' })
        ctxRef.current.getContents({
          success: ({ html, text }: { html: string; text: string }) => resolve({ html, text }),
          fail: () => resolve({ html: '', text: '' }),
        })
      }),
    setContents: (html: string) => ctxRef.current?.setContents({ html }),
    insertImage,
  }))

  return (
    <View className='rich-editor'>
      <EditorToolbar
        onFormat={format}
        onInsertImage={chooseAndInsert}
        onInsertTopic={() => onInsertTopic?.()}
        onToggleMore={() => setMoreOpen((v) => !v)}
        moreOpen={moreOpen}
        uploading={uploading}
      />
      {moreOpen && <MorePanel onFormat={format} />}
      <Editor
        id='editor'
        className='editor-body'
        placeholder={placeholder}
        onReady={onEditorReady}
        onInput={() => onInput?.()}
      />
    </View>
  )
})

export default RichEditor
