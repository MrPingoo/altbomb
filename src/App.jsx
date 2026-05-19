import { useCallback, useReducer } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import Lobby from './components/Lobby'
import Game  from './components/Game'

const initialState = {
  screen:        'lobby',   // 'lobby' | 'waiting' | 'game' | 'gameover'
  roomCode:      null,
  username:      null,
  players:       [],
  gameStatus:    'waiting', // 'waiting' | 'playing'
  currentPlayer: null,
  syllable:      '',
  timeLeft:      10,
  lastWord:      null,
  lastWordValid: null,
  winner:        null,
  error:         null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'room_created':
      return { ...state, roomCode: action.roomCode }

    case 'room_joined':
      return {
        ...state,
        screen:   'waiting',
        roomCode: action.roomCode,
        username: action.username,
        players:  action.players,
        error:    null,
      }

    case 'player_joined':
    case 'player_left':
    case 'player_lost_life':
    case 'player_eliminated':
      return { ...state, players: action.players }

    case 'game_started':
      return { ...state, screen: 'game', gameStatus: 'playing', players: action.players }

    case 'turn_start':
      return {
        ...state,
        currentPlayer: action.currentPlayer,
        syllable:      action.syllable,
        timeLeft:      action.timeLeft,
        lastWord:      null,
        lastWordValid: null,
      }

    case 'timer_update':
      return { ...state, timeLeft: action.timeLeft }

    case 'word_accepted':
      return { ...state, lastWord: action.word, lastWordValid: true, players: action.players }

    case 'word_rejected':
      return { ...state, lastWord: action.word, lastWordValid: false }

    case 'game_over':
      return {
        ...state,
        screen:  'gameover',
        winner:  action.winner,
        players: action.players,
      }

    case 'error':
      return { ...state, error: action.message }

    case 'reset':
      return { ...initialState }

    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const handleMessage = useCallback((msg) => {
    dispatch(msg)
  }, [])

  const { send, connected } = useWebSocket(handleMessage)

  const handleCreateRoom = (username) => {
    send({ type: 'create_room', username })
  }

  const handleJoinRoom = (roomCode, username) => {
    send({ type: 'join_room', roomCode, username })
  }

  const handleStartGame = () => {
    send({ type: 'start_game' })
  }

  const handleSubmitWord = (word) => {
    send({ type: 'submit_word', word })
  }

  const handleReset = () => {
    dispatch({ type: 'reset' })
  }

  if (state.screen === 'lobby') {
    return (
      <Lobby
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        connected={connected}
        error={state.error}
      />
    )
  }

  return (
    <Game
      state={state}
      onStartGame={handleStartGame}
      onSubmitWord={handleSubmitWord}
      onReset={handleReset}
      connected={connected}
    />
  )
}
