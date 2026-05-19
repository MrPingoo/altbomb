import { WORDS } from '../data/words.js'

const WORD_SET = new Set(WORDS.map((w) => w.toLowerCase()))

const SYLLABLES = [
  'AT', 'ON', 'AN', 'EN', 'OU', 'AI', 'AU', 'ER', 'ES',
  'IN', 'LE', 'LA', 'DE', 'RE', 'MA', 'PA', 'BO', 'ME',
  'FO', 'VE', 'OUR', 'EUR', 'ANT', 'ENT', 'AIN',
  'OIN', 'EAU', 'IEN', 'ION', 'QUE', 'CHE', 'TRE', 'BLE',
  'PLE', 'CLE', 'GNE', 'PHO', 'THE', 'SER', 'VER', 'MER',
  'TER', 'PER', 'BER', 'GER', 'LER', 'NER', 'SUR',
  'COM', 'CON', 'COR', 'PAR', 'PAL', 'PAN',
  'BAR', 'BAL', 'BAN', 'BAT', 'FAR', 'FAI', 'FAC',
  'GAR', 'MAR', 'MAL', 'MAN',
  'NAT', 'NAV',
]

const norm = (s) => s.toLowerCase().trim()

export function isValidWord(word) {
  return WORD_SET.has(norm(word))
}

export function containsSyllable(word, syllable) {
  return norm(word).includes(syllable.toLowerCase())
}

export function getRandomSyllable() {
  return SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)]
}

export function pickPlayableSyllable() {
  // Try to pick a syllable that has at least one word in the dict.
  for (let i = 0; i < 30; i++) {
    const s = getRandomSyllable()
    const lower = s.toLowerCase()
    if (WORDS.some((w) => w.includes(lower))) return s
  }
  return getRandomSyllable()
}
