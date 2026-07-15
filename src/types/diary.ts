import type { Paginated } from './api'

export interface Notebook {
  id: number
  name: string
  color: string
  cover?: string
  diaryCount: number
  createdAt: string
}

export interface Diary {
  id: number
  notebookId: number
  title: string
  content: string
  cover: string
  mood: string
  weather: string
  images?: { id: number; url: string; order: number }[]
  createdAt: string
  updatedAt: string
}

export interface DiaryListItem {
  id: number
  notebookId: number
  title: string
  contentPreview: string
  cover: string
  mood: string
  weather: string
  createdAt: string
}

export type PaginatedDiaries = Paginated<DiaryListItem>

export interface CreateDiaryBody {
  notebookId: number
  title: string
  content: string
  cover?: string
  mood?: string
  weather?: string
  images?: string[]
}
export type UpdateDiaryBody = Partial<CreateDiaryBody>

export interface CreateNotebookBody {
  name: string
  color: string
  cover?: string
}
export type UpdateNotebookBody = Partial<CreateNotebookBody>

export interface MoodOption {
  key: string
  emoji: string
  label: string
}

export const MOODS: MoodOption[] = [
  { key: 'happy', emoji: '😊', label: '开心' },
  { key: 'calm', emoji: '😐', label: '平静' },
  { key: 'sad', emoji: '😢', label: '难过' },
  { key: 'tired', emoji: '😴', label: '疲惫' },
  { key: 'love', emoji: '🥰', label: '幸福' },
]

export const WEATHERS: MoodOption[] = [
  { key: 'sunny', emoji: '☀️', label: '晴' },
  { key: 'cloudy', emoji: '⛅', label: '多云' },
  { key: 'rainy', emoji: '🌧', label: '雨' },
  { key: 'snowy', emoji: '❄️', label: '雪' },
  { key: 'rainbow', emoji: '🌈', label: '彩虹' },
]

/** 心情 key → emoji，未知返回空串 */
export function moodEmoji(key: string): string {
  return MOODS.find((m) => m.key === key)?.emoji ?? ''
}

/** 天气 key → emoji，未知返回空串 */
export function weatherEmoji(key: string): string {
  return WEATHERS.find((w) => w.key === key)?.emoji ?? ''
}
