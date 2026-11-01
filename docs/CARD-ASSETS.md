# Karten- und Bilddateien

## Bestand im Repository

Die Prüfung von main bestätigt 40 Kartenbilder plus ein Hintergrundbild.

| Ordner | Dateien | Anzahl |
|---|---|---:|
| public/cards/coppe/ | 1.jpg bis 10.jpg | 10 |
| public/cards/denari/ | 1.jpg bis 10.jpg | 10 |
| public/cards/spade/ | 1.jpg bis 10.jpg | 10 |
| public/cards/bastoni/ | 1.jpg bis 10.jpg | 10 |
| public/cards/background/ | background.jpg | 1 |

## Farben

| Verzeichnis | Italienisch | Deutsch |
|---|---|---|
| coppe | Coppe | Kelche |
| denari | Denari | Münzen |
| spade | Spade | Schwerter |
| bastoni | Bastoni | Stäbe oder Knüppel |

Coppe sind keine Kreuz-Symbole. Bastoni entsprechen am ehesten der französischen Kreuzfarbe.

## Kartenwerte

| Dateiname | Kartenname |
|---|---|
| 1.jpg | Ass (Asso) |
| 2.jpg bis 7.jpg | Zahlenkarten 2 bis 7 |
| 8.jpg | Fante |
| 9.jpg | Cavallo |
| 10.jpg | Re |

Die Dateinamen bleiben unverändert. Die UI erhält ein zentrales Mapping für Anzeigenamen und Primiera-Werte.

## Pfadkonvention

Kartenbilder werden aus /cards/<farbe>/<rang>.jpg geladen. Beispiel: /cards/denari/7.jpg.

Beim GitHub-Pages-Projektpfad muss /scopa-napoletana/ berücksichtigt werden. Die Implementierung soll Pfade zentral generieren.

## Hintergrund

public/cards/background/background.jpg ist bereits vorhanden. Er kann auf dem Startbildschirm oder dezent als Tischmotiv eingesetzt werden. Lesbarkeit und Kontrast haben Vorrang vor Dekoration.

## Vor Implementierung noch zu prüfen

Die Bestandsaufnahme bestätigt Dateinamen und Anzahl. Eine visuelle Prüfung der Motive und ihrer korrekten Kartenabbildung erfolgt während der UI-Implementierung. Falls Bilddimensionen optimiert werden müssen, bleiben die Originaldateien erhalten.
