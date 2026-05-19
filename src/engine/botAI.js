import { WORDS } from '../data/words.js'

export function pickBotWord(syllable, usedWords) {
  const syl = syllable.toLowerCase()
  const pool = WORDS.filter((w) => w.includes(syl) && !usedWords.has(w))
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}
