/** 收集 next 相对 orig 的变更字段（浅比较），用于资料部分更新 */
export function collectChanges<T extends Record<string, any>>(orig: T, next: T): Partial<T> {
  const out: Partial<T> = {}
  for (const k in next) {
    if (next[k] !== orig[k]) out[k] = next[k]
  }
  return out
}
