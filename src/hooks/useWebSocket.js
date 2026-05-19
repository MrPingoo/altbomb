import { useCallback, useEffect, useRef, useState } from 'react'
import { containsSyllable, isValidWord, pickPlayableSyllable } from '../engine/dictionary'
import { pickBotWord } from '../engine/botAI'

const LIVES_PER_PLAYER = 3
const TURN_DURATION    = 10

const BOT_NAMES = [
  'Alex', 'Marie', 'Tom', 'Léa', 'Hugo', 'Camille',
  'Max', 'Sofia', 'Jules', 'Nina', 'Paul', 'Emma',
]

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

function pickBotNames(n, exclude = []) {
  const pool = BOT_NAMES.filter((b) => !exclude.includes(b))
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

export function useWebSocket(onMessage) {
  const onMessageRef  = useRef(onMessage)
  const stateRef      = useRef(null)
  const timerRef      = useRef(null)
  const botTurnRef    = useRef(null)
  const joinTimersRef = useRef([])
  const [connected, setConnected] = useState(false)

  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])

  const emit = (msg) => onMessageRef.current?.(msg)

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  const cancelBotTurn = () => {
    if (botTurnRef.current) clearTimeout(botTurnRef.current)
    botTurnRef.current = null
  }

  const clearJoinTimers = () => {
    joinTimersRef.current.forEach((t) => clearTimeout(t))
    joinTimersRef.current = []
  }

  const clearAll = () => {
    clearTimer()
    cancelBotTurn()
    clearJoinTimers()
  }

  useEffect(() => {
    const t = setTimeout(() => setConnected(true), 250)
    return () => {
      clearTimeout(t)
      clearAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const snapshotPlayers = () =>
    stateRef.current.players.map(({ isBot, ...rest }) => ({ ...rest }))

  const scheduleBotJoins = (count) => {
    const existing = stateRef.current.players.map((p) => p.username)
    const names = pickBotNames(count, existing)
    names.forEach((name, i) => {
      const delay = 800 + Math.random() * 2200 + i * 1400
      const t = setTimeout(() => {
        const s = stateRef.current
        if (!s || s.status !== 'waiting') return
        s.players.push({
          username: name,
          lives:    LIVES_PER_PLAYER,
          isHost:   false,
          active:   true,
          isBot:    true,
        })
        emit({ type: 'player_joined', players: snapshotPlayers() })
      }, delay)
      joinTimersRef.current.push(t)
    })
  }

  const advanceTurn = () => {
    const s = stateRef.current
    s.currentIndex = (s.currentIndex + 1) % s.order.length
    s.syllable     = pickPlayableSyllable()
    s.timeLeft     = TURN_DURATION
  }

  const startTimer = () => {
    clearTimer()
    timerRef.current = setInterval(() => {
      const s = stateRef.current
      if (!s || s.status !== 'playing') return clearTimer()
      s.timeLeft -= 1
      if (s.timeLeft > 0) {
        emit({ type: 'timer_update', timeLeft: s.timeLeft })
      } else {
        handleTimeout()
      }
    }, 1000)
  }

  const scheduleBotTurnIfNeeded = () => {
    const s = stateRef.current
    if (!s || s.status !== 'playing') return
    const username = s.order[s.currentIndex]
    const player   = s.players.find((p) => p.username === username)
    if (!player?.isBot) return

    const delay = 1800 + Math.random() * 4500
    botTurnRef.current = setTimeout(() => {
      const cur = stateRef.current
      if (!cur || cur.status !== 'playing') return
      if (cur.order[cur.currentIndex] !== username) return

      // ~10% chance the bot "panics" and lets the timer expire.
      if (Math.random() < 0.1) return

      const word = pickBotWord(cur.syllable, cur.usedWords)
      if (!word) return

      processSubmit(username, word)
    }, delay)
  }

  const handleTimeout = () => {
    const s = stateRef.current
    cancelBotTurn()
    const username = s.order[s.currentIndex]
    const player   = s.players.find((p) => p.username === username)
    player.lives -= 1

    if (player.lives <= 0) {
      player.active = false
      s.order = s.order.filter((u) => u !== username)

      if (s.order.length <= 1) {
        clearTimer()
        s.status = 'finished'
        const winner = s.order[0] ?? null
        emit({ type: 'game_over', winner, players: snapshotPlayers() })
        return
      }

      s.currentIndex = s.currentIndex % s.order.length
      s.syllable     = pickPlayableSyllable()
      s.timeLeft     = TURN_DURATION
      emit({ type: 'player_eliminated', players: snapshotPlayers() })
    } else {
      advanceTurn()
      emit({ type: 'player_lost_life', players: snapshotPlayers() })
    }

    emit({
      type:          'turn_start',
      currentPlayer: s.order[s.currentIndex],
      syllable:      s.syllable,
      timeLeft:      s.timeLeft,
    })
    scheduleBotTurnIfNeeded()
  }

  const processSubmit = (username, rawWord) => {
    const s = stateRef.current
    if (!s || s.status !== 'playing') return
    if (s.order[s.currentIndex] !== username) return

    const word = (rawWord ?? '').toString().toLowerCase().trim()
    if (!word) return

    if (s.usedWords.has(word)) {
      emit({ type: 'word_rejected', word, reason: 'already_used' })
      return
    }
    if (!containsSyllable(word, s.syllable)) {
      emit({ type: 'word_rejected', word, reason: 'missing_syllable' })
      return
    }
    if (!isValidWord(word)) {
      emit({ type: 'word_rejected', word, reason: 'invalid_word' })
      return
    }

    cancelBotTurn()
    s.usedWords.add(word)
    advanceTurn()

    emit({ type: 'word_accepted', word, players: snapshotPlayers() })
    emit({
      type:          'turn_start',
      currentPlayer: s.order[s.currentIndex],
      syllable:      s.syllable,
      timeLeft:      s.timeLeft,
    })
    startTimer()
    scheduleBotTurnIfNeeded()
  }

  const send = useCallback((payload) => {
    switch (payload.type) {
      case 'create_room': {
        clearAll()
        const code = generateRoomCode()
        const me   = (payload.username ?? '').trim()
        if (!me) {
          emit({ type: 'error', message: 'Pseudo requis.' })
          return
        }
        stateRef.current = {
          roomCode:     code,
          myUsername:   me,
          status:       'waiting',
          players: [{
            username: me,
            lives:    LIVES_PER_PLAYER,
            isHost:   true,
            active:   true,
            isBot:    false,
          }],
          order:        [],
          currentIndex: 0,
          syllable:     '',
          timeLeft:     TURN_DURATION,
          usedWords:    new Set(),
        }
        emit({ type: 'room_created', roomCode: code })
        emit({
          type:     'room_joined',
          roomCode: code,
          username: me,
          players:  snapshotPlayers(),
        })
        scheduleBotJoins(2)
        break
      }

      case 'join_room': {
        clearAll()
        const code = (payload.roomCode ?? '').toUpperCase().trim()
        const me   = (payload.username ?? '').trim()
        if (!code || !me) {
          emit({ type: 'error', message: 'Pseudo et code requis.' })
          return
        }
        const [hostName] = pickBotNames(1, [me])
        stateRef.current = {
          roomCode:   code,
          myUsername: me,
          status:     'waiting',
          players: [
            { username: hostName, lives: LIVES_PER_PLAYER, isHost: true,  active: true, isBot: true  },
            { username: me,       lives: LIVES_PER_PLAYER, isHost: false, active: true, isBot: false },
          ],
          order:        [],
          currentIndex: 0,
          syllable:     '',
          timeLeft:     TURN_DURATION,
          usedWords:    new Set(),
        }
        emit({
          type:     'room_joined',
          roomCode: code,
          username: me,
          players:  snapshotPlayers(),
        })
        scheduleBotJoins(1 + Math.floor(Math.random() * 2))
        break
      }

      case 'start_game': {
        const s = stateRef.current
        if (!s || s.players.length < 2) return
        clearJoinTimers()
        s.status       = 'playing'
        s.order        = s.players.map((p) => p.username).sort(() => Math.random() - 0.5)
        s.currentIndex = 0
        s.syllable     = pickPlayableSyllable()
        s.timeLeft     = TURN_DURATION
        s.usedWords    = new Set()

        emit({ type: 'game_started', players: snapshotPlayers() })
        emit({
          type:          'turn_start',
          currentPlayer: s.order[0],
          syllable:      s.syllable,
          timeLeft:      s.timeLeft,
        })
        startTimer()
        scheduleBotTurnIfNeeded()
        break
      }

      case 'submit_word': {
        const s = stateRef.current
        if (!s) return
        processSubmit(s.myUsername, payload.word)
        break
      }

      default:
        break
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { send, connected }
}
