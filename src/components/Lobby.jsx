import { useState } from 'react'
import '../styles/Lobby.css'

export default function Lobby({ onCreateRoom, onJoinRoom, connected, error }) {
  const [username, setUsername]   = useState('')
  const [roomCode, setRoomCode]   = useState('')
  const [mode, setMode]           = useState(null) // 'create' | 'join'

  const handleCreate = (e) => {
    e.preventDefault()
    if (username.trim()) onCreateRoom(username.trim())
  }

  const handleJoin = (e) => {
    e.preventDefault()
    if (username.trim() && roomCode.trim()) {
      onJoinRoom(roomCode.trim().toUpperCase(), username.trim())
    }
  }

  return (
    <div className="lobby">
      <div className="lobby__hero">
        <span className="lobby__bomb">💣</span>
        <h1 className="lobby__title">AltBomb</h1>
        <p className="lobby__subtitle">Tape un mot contenant la syllabe avant que la bombe explose !</p>
        <span className={`lobby__status ${connected ? 'lobby__status--ok' : 'lobby__status--err'}`}>
          {connected ? '● Connecté' : '● Connexion…'}
        </span>
      </div>

      {error && <div className="lobby__error">{error}</div>}

      {!mode && (
        <div className="lobby__actions">
          <button className="btn btn--primary" onClick={() => setMode('create')}>
            Créer une partie
          </button>
          <button className="btn btn--secondary" onClick={() => setMode('join')}>
            Rejoindre une partie
          </button>
        </div>
      )}

      {mode === 'create' && (
        <form className="lobby__form" onSubmit={handleCreate}>
          <h2>Créer une partie</h2>
          <input
            className="input"
            type="text"
            placeholder="Ton pseudo"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            autoFocus
          />
          <div className="lobby__form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setMode(null)}>
              Retour
            </button>
            <button type="submit" className="btn btn--primary" disabled={!connected || !username.trim()}>
              Créer
            </button>
          </div>
        </form>
      )}

      {mode === 'join' && (
        <form className="lobby__form" onSubmit={handleJoin}>
          <h2>Rejoindre une partie</h2>
          <input
            className="input"
            type="text"
            placeholder="Ton pseudo"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            autoFocus
          />
          <input
            className="input input--code"
            type="text"
            placeholder="Code de la partie"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <div className="lobby__form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setMode(null)}>
              Retour
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={!connected || !username.trim() || !roomCode.trim()}
            >
              Rejoindre
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
