import { View, Text } from '@tarojs/components'
import { moodEmoji, weatherEmoji } from '../../types/diary'
import { formatRelativeTime } from '../../utils/time'
import type { DiaryListItem } from '../../types/diary'
import './index.scss'

interface Props {
  diary: DiaryListItem
  notebookColor: string
  onTap: () => void
}

export default function DiaryCard({ diary, notebookColor, onTap }: Props) {
  const hasCover = !!diary.cover
  const bg = hasCover
    ? { backgroundImage: `url(${diary.cover})` }
    : { background: `linear-gradient(135deg, ${notebookColor}, ${notebookColor}cc)` }
  return (
    <View className='diary-card' onClick={onTap}>
      <View className={`diary-card__bg ${hasCover ? '' : 'diary-card__bg--solid'}`} style={bg}>
        <View className='diary-card__mask'>
          <View className='diary-card__meta'>
            {diary.mood ? <Text className='diary-card__emoji'>{moodEmoji(diary.mood)}</Text> : null}
            {diary.weather ? <Text className='diary-card__emoji'>{weatherEmoji(diary.weather)}</Text> : null}
            <Text className='diary-card__date'>{formatRelativeTime(diary.createdAt)}</Text>
          </View>
          <Text className='diary-card__title'>{diary.title || '无标题'}</Text>
        </View>
      </View>
    </View>
  )
}
