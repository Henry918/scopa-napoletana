# Produktentscheidungen und offene Regelpunkte

Dieses Dokument trennt ausdrücklich bestätigte Anforderungen von Vorschlägen, die vor der endgültigen Implementierung der Scoring-Logik geprüft werden sollen.

## 1. Durch den Auftrag bestätigt

| Thema | Festlegung |
|---|---|
| 2-Spieler-Modus | Zwei Einzelspieler gegeneinander |
| 3-Spieler-Modus | Drei Einzelspieler gegeneinander |
| 4-Spieler-Modus | Vier Spieler in zwei Teams gegeneinander |
| Zielpunktzahl | 11 Punkte als Standard |
| Zielpunktzahl ändern | Frei einstellbarer eigener Wert |
| Plattform | Mobile-first Web-App |
| Kartenassets | Vorhandene Kartenbilder aus public/cards/ verwenden |
| Hauptzweck | Scorekeeper für physisch gespielte Partien, kein digitales Kartenspiel |

## 2. Technische Empfehlungen

Diese Entscheidungen sind die vorgeschlagene technische Basis und können bei der Umsetzung angepasst werden:

- React und TypeScript.
- Vite als Build-System.
- PWA-Unterstützung für Installation und Offline-Nutzung.
- lokale Speicherung auf dem jeweiligen Gerät.
- GitHub Pages als bevorzugtes Hosting, sofern Repository-Sichtbarkeit und GitHub-Tarif dies erlauben.
- keine Benutzerkonten und kein Backend in Version 1.0.

## 3. Vorgeschlagener Wertungsstandard

Das Produktkonzept plant zunächst die bekannten fünf Kategorien:

1. Carte: ein Punkt für die Partei mit den meisten Karten.
2. Denari: ein Punkt für die Partei mit den meisten Münzen.
3. Settebello: ein Punkt für den Besitz des Sieben der Münzen.
4. Primiera: ein Punkt für die höchste Primiera-Summe.
5. Scopa: ein Punkt je erzielter Scopa.

Bei Gleichstand in Carte, Denari oder Primiera wird im vorgeschlagenen Standard kein Punkt vergeben. Scope werden direkt gezählt.

Die Primiera-Werte sind im Produktkonzept festgehalten. Der Besitz der höchsten Karte jeder Farbe wird für jede Wertungseinheit erfasst und automatisch berechnet.

## 4. Vor Fertigstellung der Punkteberechnung zu prüfen

- Entspricht die oben beschriebene Standardwertung exakt der am Tisch verwendeten Regel?
- Gibt es bei drei Einzelspielern eine abweichende Zählweise?
- Gibt es im Vier-Spieler-Modus Hausregeln für Teamwertung oder Teamzusammenstellung?
- Zählt die letzte Kartenaufnahme am Ende einer Hand als Scopa? Vorgeschlagener Standard: nein.
- Wie wird ein Gleichstand am Ende der Partie behandelt? Vorgeschlagener Standard: bei Gleichstand an der Spitze wird weitergespielt, bis ein eindeutiger Sieger feststeht.
- Werden die am Ende auf dem Tisch verbliebenen Karten immer der zuletzt Karten nehmenden Partei zugerechnet? Vorgeschlagene Eingabeannahme: ja.

## 5. Eingabemodell der Handwertung

Vorgesehen ist die Erfassung der Gesamtwerte pro Spieler oder Team:

- Karten insgesamt.
- Denari insgesamt.
- Settebello-Besitz.
- höchste Karte jeder Farbe für die Primiera.
- Anzahl der Scope.

Die Anwendung kontrolliert die Summen über alle Wertungseinheiten. Pro Hand müssen 40 Karten und 10 Denari zugeordnet sein. Diese Eingabemethode wird verwendet, solange keine vollständige digitale Erfassung einzelner Stiche oder Karten gewünscht ist.

## 6. Speicher- und Synchronisierungsumfang

Version 1.0 speichert Partien ausschließlich lokal im Browser des verwendeten Geräts. Ein Spielstand wird dadurch nicht automatisch auf weitere Geräte übertragen. Eine spätere Cloud-Synchronisierung ist eine eigenständige Ausbaustufe.

## 7. Implementierungsreihenfolge

1. Projektgerüst und Build einrichten.
2. Kartendaten, Typen und reine Scoring-Funktionen implementieren.
3. Unit-Tests für jede Kategorie und für Gleichstände schreiben.
4. Einrichtung der drei Spielmodi und Spieler-/Teamzuordnung umsetzen.
5. Handwertung, Vorschau, Gesamtstand und Verlauf implementieren.
6. lokale Speicherung, Bearbeiten und Rückgängig ergänzen.
7. Mobile-first Layout und PWA-/Offline-Funktion ergänzen.
8. Testen und Deployment über GitHub Pages konfigurieren.

Die offenen Regelpunkte aus Abschnitt 4 werden vor dem endgültigen Festlegen des Scoring-Verhaltens abgeglichen.
