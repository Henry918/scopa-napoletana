# Scopa Napoletana

Mobile-first Scorekeeper für physische Partien Scopa Napoletana. Die App ist kein digitales Kartenspiel.

## Projektstatus

Das Repository enthält die Karten-Assets und die Projektgrundstruktur. Der eigentliche Anwendungscode wird auf Basis der Konzept- und Architekturunterlagen aufgebaut.

## Festgelegter Spielumfang

- 2 Einzelspieler gegeneinander
- 3 Einzelspieler gegeneinander
- 4 Spieler in 2 Teams
- Sieg bei 11 Punkten als Standard, frei einstellbares Ziel
- Rundenauswertung für Carte, Denari, Settebello, Primiera und Scopa
- Smartphone-optimierte PWA mit lokal gespeicherten Partien

## Projektdokumentation

- [Produktkonzept](docs/PRODUCT-CONCEPT.md)
- [Technische Architektur](docs/TECHNICAL-ARCHITECTURE.md)
- [Test- und Veröffentlichungsplan](docs/TEST-AND-RELEASE-PLAN.md)
- [Karten- und Bilddateien](docs/CARD-ASSETS.md)
- [Produktentscheidungen und offene Regelpunkte](docs/DECISIONS.md)

## Karten-Assets

Die vier Farben liegen in public/cards/. Jede Farbe enthält die Bilddateien 1.jpg bis 10.jpg. public/cards/background/background.jpg ist nur archiviert und wird in Version 1.0 nicht verwendet.

## Geplante technische Basis

React, TypeScript, Vite, vite-plugin-pwa, Vitest und GitHub Pages über GitHub Actions.

Weitere Details stehen in den oben verlinkten Dokumenten.
