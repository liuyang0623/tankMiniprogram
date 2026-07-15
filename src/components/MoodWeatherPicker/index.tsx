import { View, Text } from '@tarojs/components'
import { MOODS, WEATHERS } from '../../types/diary'
import './index.scss'

interface Props {
  mood: string
  weather: string
  onChange: (mood: string, weather: string) => void
}

export default function MoodWeatherPicker({ mood, weather, onChange }: Props) {
  return (
    <View className='mw-picker'>
      <View className='mw-row'>
        <Text className='mw-label'>心情</Text>
        <View className='mw-opts'>
          {MOODS.map((m) => (
            <View
              key={m.key}
              className={`mw-opt ${mood === m.key ? 'mw-opt--active' : ''}`}
              onClick={() => onChange(m.key, weather)}
            >
              <Text className='mw-emoji'>{m.emoji}</Text>
            </View>
          ))}
        </View>
      </View>
      <View className='mw-row'>
        <Text className='mw-label'>天气</Text>
        <View className='mw-opts'>
          {WEATHERS.map((w) => (
            <View
              key={w.key}
              className={`mw-opt ${weather === w.key ? 'mw-opt--active' : ''}`}
              onClick={() => onChange(mood, w.key)}
            >
              <Text className='mw-emoji'>{w.emoji}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
