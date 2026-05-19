import '../styles/PlayerList.css'

const HEART_FULL  = '❤️'
const HEART_EMPTY = '🖤'

export default function PlayerList({ players, currentPlayer, username }) {
  return (
    <ul className="player-list">
      {players.map((p) => (
        <li
          key={p.username}
          className={[
            'player-list__item',
            p.username === currentPlayer   ? 'player-list__item--active'   : '',
            p.username === username        ? 'player-list__item--me'       : '',
            !p.active                      ? 'player-list__item--dead'     : '',
          ].join(' ')}
        >
          <span className="player-list__name">
            {p.isHost && <span className="player-list__crown">👑</span>}
            {p.username}
            {p.username === username && <span className="player-list__you"> (toi)</span>}
          </span>
          <span className="player-list__lives">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i}>
                {i < p.lives ? HEART_FULL : HEART_EMPTY}
              </span>
            ))}
          </span>
        </li>
      ))}
    </ul>
  )
}
