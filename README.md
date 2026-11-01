# Scopa Napoletana Scorekeeper

A mobile-first scorekeeper for physical Scopa Napoletana games. The application records results from a real card game. It does not deal virtual cards or simulate turns, hands, tricks, or a digital table.

## First implementation

The application uses React, TypeScript and Vite. The full user interface is in English, while established Scopa terms such as Carte, Denari, Settebello, Primiera and Scopa remain Italian.

### Supported game modes

- Two individual players
- Three individual players
- Four players in two teams
- Target score of 11 by default, with a custom target

### Round scoring

- Carte
- Denari
- Settebello
- Primiera, with direct winner selection and an optional card comparison popup
- Scopa

Each round uses one compact panel with winner selection for Carte, Denari, Settebello and Primiera. Carte, Denari and Primiera can be marked as tied. Scopa is recorded with a simple per-player or per-team counter. Every round is titled sequentially, while the game itself has a name and date. Game data is stored locally in the browser.

## Development

Requires Node.js 26. Commands:

- npm install
- npm run dev
- npm test
- npm run build

## Project documentation

- [Product concept](docs/PRODUCT-CONCEPT.md)
- [Technical architecture](docs/TECHNICAL-ARCHITECTURE.md)
- [Test and release plan](docs/TEST-AND-RELEASE-PLAN.md)
- [Card assets](docs/CARD-ASSETS.md)
- [Product decisions](docs/DECISIONS.md)

## Card assets

The four suits are stored in public/cards, with ranks 1.jpg to 10.jpg for each suit. Card illustrations are used only in the optional Primiera comparison. The background image is retained as an asset and is not used in the interface.