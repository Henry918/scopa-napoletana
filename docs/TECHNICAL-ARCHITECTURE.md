# Technische Architektur

**Status:** Implementierungsgrundlage für Version 1.0

## 1. Architekturentscheidung

Die erste Version wird als clientseitige Single-Page-App umgesetzt.

| Bereich | Entscheidung | Begründung |
|---|---|---|
| UI | React | Komponentenbasierte Oberfläche und ausgereiftes Ökosystem |
| Sprache | TypeScript im Strict-Modus | Sichere Datenmodelle und weniger Laufzeitfehler |
| Build und Dev-Server | Vite | Schneller Entwicklungsserver und statischer Produktionsbuild |
| Styling | CSS mit zentralen Design-Tokens | Mobile-first und ohne unnötige UI-Abhängigkeit |
| PWA | vite-plugin-pwa mit Workbox | Web-App-Manifest, Service Worker und Offline-Caching |
| Tests | Vitest, Testing Library, später Playwright | Domain-Tests, Komponenten- und Browser-Tests |
| Persistenz | localStorage in Version 1.0 | Einfach, lokal, ohne Backend |
| Hosting | GitHub Pages über GitHub Actions | Statische Anwendung, direkte GitHub-Integration |

Es wird kein Backend benötigt. Es gibt keine Benutzerkonten, keine serverseitige Datenbank und keine Netzwerk-API für den Spielbetrieb.

## 2. Laufzeit und Abhängigkeiten

- Node.js mindestens 22.12.
- Bevorzugt eine gepflegte Node-LTS-Version, die von der jeweils installierten Vite-Version unterstützt wird.
- npm als Paketmanager.
- package-lock.json wird eingecheckt, damit Installationen und CI-Builds reproduzierbar sind.
- Abhängigkeiten werden bei Projektstart auf stabile, zueinander kompatible Versionen gesetzt. Versionsnummern werden nicht in diesem Konzept eingefroren.

Geplante Laufzeitbefehle:

- npm run dev: lokaler Entwicklungsserver.
- npm run build: TypeScript-Prüfung und Produktionsbuild.
- npm run preview: lokalen Produktionsbuild prüfen.
- npm run test: Unit- und Komponenten-Tests.
- npm run test:watch: Tests im Watch-Modus.

## 3. Geplante Repository-Struktur

    .
    ├── .github/
    │   └── workflows/
    │       └── deploy.yml
    ├── docs/
    │   ├── PRODUCT-CONCEPT.md
    │   ├── TECHNICAL-ARCHITECTURE.md
    │   ├── TEST-AND-RELEASE-PLAN.md
    │   └── CARD-ASSETS.md
    ├── public/
    │   ├── cards/
    │   │   ├── background/
    │   │   ├── bastoni/
    │   │   ├── coppe/
    │   │   ├── denari/
    │   │   └── spade/
    │   ├── icons/
    │   └── ...
    ├── src/
    │   ├── app/
    │   │   ├── App.tsx
    │   │   └── app.css
    │   ├── components/
    │   │   ├── Button/
    │   │   ├── CardImage/
    │   │   ├── Modal/
    │   │   └── ScoreBadge/
    │   ├── features/
    │   │   ├── setup/
    │   │   ├── game/
    │   │   ├── scoring/
    │   │   ├── history/
    │   │   └── settings/
    │   ├── hooks/
    │   ├── lib/
    │   │   ├── persistence/
    │   │   └── utils/
    │   ├── styles/
    │   │   ├── tokens.css
    │   │   ├── global.css
    │   │   └── responsive.css
    │   ├── types/
    │   │   ├── game.ts
    │   │   ├── scoring.ts
    │   │   └── cards.ts
    │   ├── main.tsx
    │   └── vite-env.d.ts
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    └── vite.config.ts

Die Struktur wird erst dann mit Quellcodedateien befüllt, wenn das App-Gerüst erstellt wird. Die bestehenden Kartenordner bleiben unter public/cards/, damit Vite sie unverändert als statische Assets ausliefern kann.

## 4. Fachliche Schichten

### UI-Schicht

React-Komponenten stellen Setup, laufende Partie, Handwertung, Vorschau und Verlauf dar. Komponenten enthalten möglichst wenig Regel- oder Berechnungslogik.

### Domain-Schicht

Reine TypeScript-Funktionen berechnen:

- Primiera-Wert einer Karte.
- Primiera-Summe einer Wertungseinheit.
- Gewinner je Wertungskategorie.
- Rundepunkte.
- neuen Gesamtpunktestand.
- Spielsieger oder Gleichstand.

Diese Funktionen erhalten Daten als Eingabe und geben Ergebnisse zurück. Sie greifen nicht auf React, Browser-Speicher oder DOM zu. Dadurch können sie unabhängig getestet werden.

### State-Schicht

Ein zentraler Reducer verwaltet den Zustand der Partie. Aktionen sind beispielsweise:

- Partie anlegen.
- Namen oder Teamzuordnung ändern.
- Handwertung beginnen.
- Eingabewert ändern.
- Handwertung bestätigen.
- Handwertung bearbeiten.
- letzte Aktion rückgängig machen.
- Partie beenden.

Die Punkte werden aus den gespeicherten Handwertungen abgeleitet oder bei Änderungen deterministisch neu berechnet. Doppelte, voneinander abweichende Punktestände sollen vermieden werden.

### Persistenz-Schicht

Ein Speicheradapter kapselt localStorage:

- Laden beim App-Start.
- Speichern nach jeder gültigen Zustandsänderung.
- Versionierung des gespeicherten Datenformats.
- defensive Behandlung beschädigter oder unbekannter Daten.
- Migration älterer Datenversionen.

Ein zentraler Schlüssel, beispielsweise scopa-napoletana:v1, hält die Persistenz getrennt von UI-Komponenten. Eine JSON-Exportfunktion dient als Sicherung.

## 5. Vorgeschlagene Datenmodelle

Die folgenden Typen sind die fachliche Ausgangsbasis. Details können während der Implementierung angepasst werden.

### Spielmodus

- two-players: zwei individuelle Wertungseinheiten.
- three-players: drei individuelle Wertungseinheiten.
- four-player-teams: vier Personen, zwei Teams, zwei Wertungseinheiten.

### Card

- Farbe: coppe | denari | spade | bastoni.
- Rang: Ganzzahl 1 bis 10.
- Bildpfad: aus Farbe und Rang abgeleitet, zum Beispiel /cards/coppe/7.jpg.

### Competitor

Eine Wertungseinheit, entweder ein einzelner Spieler oder ein Team. Enthält stabile ID, Anzeigename und gegebenenfalls die IDs der Teammitglieder.

### HandScore

Pro Hand und Wertungseinheit:

- cardsCaptured
- denariCaptured
- hasSettebello
- primieraCards, eine höchste Karte je Farbe oder null
- scope

### HandResult

Enthält die bestätigten Eingaben, die berechneten Primiera-Werte, Kategoriegewinner, Rundepunkte und Zeitstempel.

### GameSession

Enthält:

- Schema-Version.
- stabile ID und Erstellungsdatum.
- Spielmodus.
- Spieler und Wertungseinheiten.
- Zielpunktzahl.
- Spielstatus.
- Liste der Handresultate.
- abgeleitete Gesamtstände.

## 6. Fachliche Regeln im Code

Die Scoring-Funktionen liegen isoliert in src/features/scoring/.

Wichtige Funktionen:

- getPrimieraCardValue(rank)
- calculatePrimiera(cardsBySuit)
- findCategoryWinner(values)
- calculateHandPoints(handScores)
- calculateGameTotals(handResults)
- getGameOutcome(totals, targetScore)

Die Funktionen müssen Gleichstände eindeutig behandeln. Bei Kategorie-Gleichstand wird kein Punkt vergeben. Die Settebello-Kategorie wird genau einmal an die zugehörige Wertungseinheit vergeben. Scopa-Punkte werden direkt aus der Anzahl der Scope addiert.

## 7. PWA und Offline-Konzept

- Web-App-Manifest mit Name, Kurzname, Start-URL, Theme- und Hintergrundfarbe.
- Eigene App-Icons in den üblichen Größen.
- Service Worker über vite-plugin-pwa.
- App-Shell, CSS, JavaScript, Manifest und lokale Kartenbilder werden beim Installieren beziehungsweise beim ersten erfolgreichen Online-Aufruf zwischengespeichert.
- Updates werden kontrolliert angezeigt und nach Bestätigung aktiviert, damit ein laufendes Spiel nicht unerwartet unterbrochen wird.
- Spielstände bleiben in localStorage und werden nicht durch den Service Worker gespeichert.
- Offline-Fähigkeit wird nach einem vollständigen ersten Online-Ladevorgang geprüft.

Da die Website als GitHub-Pages-Projekt unter /scopa-napoletana/ läuft, müssen Vite-Basis-Pfad, Manifest-Start-URL, Icons, Service-Worker-Pfad und Offline-Fallback diesen Unterpfad berücksichtigen.

## 8. GitHub-Pages-Build

Vite benötigt einen Build-Schritt vor der Veröffentlichung. Die Veröffentlichung soll über GitHub Actions erfolgen:

1. Checkout des Repositorys.
2. Node-LTS und npm-Cache einrichten.
3. npm ci.
4. Qualitätsprüfungen und npm run build.
5. dist/ als Pages-Artefakt hochladen.
6. Über die GitHub-Pages-Deployment-Aktion veröffentlichen.

Für eine Projektseite muss Vite base: '/scopa-napoletana/' verwenden. Die Pages-Quelle wird auf GitHub Actions gestellt. Die Workflow-Datei wird angelegt, sobald das App-Grundgerüst samt erfolgreichem Produktionsbuild existiert.

## 9. Qualität und Wartbarkeit

- TypeScript strict.
- Keine Berechnungsregeln in JSX.
- Stabile IDs statt Array-Indizes als Identität.
- Keine unkontrollierten direkten localStorage-Zugriffe in UI-Komponenten.
- Zentrale Karten-Metadaten statt mehrfacher hartcodierter Bildpfade.
- Alle Domain-Funktionen mit Unit-Tests.
- Bei Änderung einer Hand den gesamten Punktestand neu berechnen.
- Keine externen Skripte oder Analyse-Dienste in Version 1.0.
- Fehlermeldungen verständlich und handlungsorientiert formulieren.

## 10. Nicht-Ziele der ersten Architektur

Nicht Teil von Version 1.0 sind Benutzerverwaltung, Echtzeit-Synchronisierung, Serverdatenbank, Online-Multiplayer, Zahlungsfunktionen und ein vollständiges digitales Kartenspiel. Die Architektur soll eine spätere Erweiterung ermöglichen, ohne diese Komplexität jetzt einzuführen.
