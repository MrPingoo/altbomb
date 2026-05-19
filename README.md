# AltBomb — react-front

Front-end React du jeu **AltBomb** (clone de BombParty en français) en version **autonome** : aucune API ni backend requis. Les données réseau sont simulées côté client par un moteur de jeu interne et des bots qui rejoignent la salle et jouent automatiquement.

---

## Sommaire

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Scripts disponibles](#scripts-disponibles)
- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
- [Fonctionnement](#fonctionnement)
- [Règles du jeu](#règles-du-jeu)
- [Personnalisation](#personnalisation)

---

## Prérequis

- **Node.js** ≥ 18
- **npm** ≥ 9 (livré avec Node)

Vérifie les versions :

```bash
node -v
npm -v
```

---

## Installation

Depuis la racine du projet :

```bash
cd react-front
npm install
```

L'installation récupère React 18, Vite 6 et le plugin React de Vite.

---

## Scripts disponibles

| Commande          | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `npm run dev`     | Lance le serveur de développement Vite sur le port 5173. |
| `npm run build`   | Compile l'application en mode production dans `dist/`.   |
| `npm run preview` | Sert le build de production localement pour le tester.   |

Une fois `npm run dev` lancé, ouvre [http://localhost:5173](http://localhost:5173).

---

## Stack technique

| Outil                      | Rôle                                                  |
| -------------------------- | ----------------------------------------------------- |
| **React 18**               | Bibliothèque UI (hooks, `useReducer`, `forwardRef`).  |
| **Vite 6**                 | Bundler / serveur de dev avec HMR.                    |
| **@vitejs/plugin-react**   | Transformation JSX et Fast Refresh.                   |
| **CSS natif**              | Un fichier par composant + un `global.css` (variables CSS, BEM-like). |

Aucune dépendance runtime supplémentaire : pas de router, pas de state-manager global, pas de framework UI.

---

## Structure du projet

```
react-front/
├── index.html               Point d'entrée HTML (favicon 💣 inline)
├── package.json             Dépendances et scripts
├── vite.config.js           Config Vite (host 0.0.0.0, port 5173)
└── src/
    ├── main.jsx             Bootstrap React (createRoot + StrictMode)
    ├── App.jsx              State machine (lobby → waiting → game → gameover)
    ├── components/
    │   ├── Lobby.jsx        Écran 1 : créer ou rejoindre une partie
    │   ├── Game.jsx         Écrans 2 & 3 : salle d'attente + partie + fin
    │   ├── PlayerList.jsx   Liste joueurs (vies en cœurs, host, joueur actif)
    │   ├── BombDisplay.jsx  Bombe centrale avec syllabe et animation
    │   ├── Timer.jsx         Barre + compteur 10 s (couleur dégradée)
    │   └── WordInput.jsx    Champ de saisie avec validation visuelle
    ├── hooks/
    │   └── useWebSocket.js  Faux WebSocket : moteur de jeu en mémoire
    ├── engine/
    │   ├── dictionary.js    Validation des mots + tirage de syllabes
    │   └── botAI.js         Choix d'un mot valide pour un bot
    ├── data/
    │   └── words.js         Dictionnaire embarqué (314 mots FR)
    └── styles/
        ├── global.css       Variables, boutons, inputs
        ├── Lobby.css
        ├── Game.css
        ├── PlayerList.css
        ├── BombDisplay.css
        ├── Timer.css
        └── WordInput.css
```

---

## Fonctionnement

### Trois écrans

1. **Lobby** — Choix entre *Créer une partie* ou *Rejoindre une partie*. Demande un pseudo et (pour rejoindre) un code de salon.
2. **Salle d'attente** — Affiche le code du salon, la liste des joueurs et un bouton **Lancer la partie** (actif à partir de 2 joueurs).
3. **Partie** — Header avec le code en haut, `PlayerList` à gauche, zone de jeu (timer, bombe, syllabe, saisie) au centre.

### Faux moteur réseau

`src/hooks/useWebSocket.js` expose la **même API** qu'un vrai client WebSocket :

```js
const { send, connected } = useWebSocket(onMessage)
```

`App.jsx` envoie les mêmes messages que vers un backend (`create_room`, `join_room`, `start_game`, `submit_word`) et reçoit en retour les mêmes événements (`room_joined`, `player_joined`, `turn_start`, `timer_update`, `word_accepted`, `word_rejected`, `player_lost_life`, `player_eliminated`, `game_over`). L'interface client reste donc **strictement identique** à une version branchée sur une vraie socket : il suffit de remplacer le hook pour rebrancher un backend.

### Bots

- Quand tu **crées** un salon : 2 bots rejoignent automatiquement (délai aléatoire 1 à 6 s).
- Quand tu **rejoins** un salon : un bot "host" fictif est déjà présent, plus 1 à 2 bots supplémentaires arrivent.
- Pendant la partie : à leur tour, les bots soumettent un mot valide après 1,8–6,3 s. Ils ont **10 % de chances de paniquer** et de laisser le timer expirer (perte de vie).

Les noms de bots sont pris dans un pool (`Alex`, `Marie`, `Tom`, `Léa`, `Hugo`, `Camille`, `Max`, `Sofia`, `Jules`, `Nina`, `Paul`, `Emma`).

### Dictionnaire et syllabes

- **Mots** : 314 mots français courants embarqués dans `src/data/words.js` (Set pour validation O(1)).
- **Syllabes** : ~65 syllabes/digrammes choisis au hasard (`ON`, `AT`, `OUR`, `EAU`, `CHE`, etc.). Le moteur n'utilise que celles présentes dans au moins un mot du dictionnaire.

---

## Règles du jeu

- Chaque joueur a **3 vies**.
- À chaque tour, une **syllabe** est tirée au hasard ; le joueur actif a **10 secondes** pour taper un mot la contenant.
- Le mot doit être :
  - dans le dictionnaire,
  - contenir la syllabe,
  - ne pas avoir déjà été utilisé dans la partie.
- Timer écoulé → -1 vie et la syllabe change pour le joueur suivant.
- 0 vie → éliminé.
- Le dernier joueur en vie gagne.

---

## Personnalisation

### Changer le dictionnaire

Le fichier `src/data/words.js` exporte un simple tableau :

```js
export const WORDS = ["abandon", "abricot", ...]
```

Tu peux le régénérer depuis une liste texte :

```bash
awk 'BEGIN{printf "export const WORDS = ["} NR>1{printf ","} {printf "\"%s\"", $0} END{print "]"}' \
  mon-dico.txt > src/data/words.js
```

### Ajuster la difficulté des bots

Dans `src/hooks/useWebSocket.js` :

- **Vitesse de réaction** : modifier `delay = 1800 + Math.random() * 4500` (millisecondes).
- **Taux d'échec** : modifier `if (Math.random() < 0.1)` (10 % par défaut).

### Modifier les paramètres de jeu

Dans `src/hooks/useWebSocket.js` :

```js
const LIVES_PER_PLAYER = 3   // vies par joueur
const TURN_DURATION    = 10  // secondes par tour
```

### Brancher un vrai backend WebSocket

Remplace le contenu de `src/hooks/useWebSocket.js` par une vraie connexion (`new WebSocket(url)`) qui émet les mêmes événements. Aucune modification dans `App.jsx` ou les composants n'est nécessaire.
