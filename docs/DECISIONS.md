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
| UI-Sprache | Vollständig Englisch in Version 1.0 |
| Italienische Begriffe | Etablierte Scopa-Begriffe bleiben italienisch, z. B. Carte, Denari, Settebello, Primiera und Scopa |
| Handwertung | Alle Spieler/Teams gemeinsam auf einer einzigen Eingabeseite |
| Primiera-Standard | Gewinner direkt auswählen, ohne Karten einzeln einzugeben |
| Primiera-Stechen | Kleiner sekundärer Button öffnet optionales Punktevergleichs-Popup |

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

Primiera wird im normalen Ablauf nicht über einzelne Karten erfasst. Die bedienende Person wählt den Gewinner direkt aus. Nur wenn das Ergebnis unklar ist oder ein Stechen nötig wird, öffnet der kleine Button „Compare Primiera“ ein Popup. Dort werden die höchsten Karten je Farbe pro Wertungseinheit ausgewählt und die Primiera-Summen automatisch berechnet.

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
- Primiera-Gewinner direkt auswählen. Optionaler Detailvergleich im Popup, falls ein Stechen nötig ist.
- Anzahl der Scope.

Die Anwendung kontrolliert die Summen über alle Wertungseinheiten. Pro Hand müssen 40 Karten und 10 Denari zugeordnet sein. Diese Eingabemethode wird verwendet, solange keine vollständige digitale Erfassung einzelner Stiche oder Karten gewünscht ist.

## 6. Aktualisierte Rundeneingabe und Partiemetadaten

Die Rundeneingabe verwendet eine kompakte Auswahl innerhalb eines Containers. Für Cards Taken, Denari und Primiera wird ein Spieler oder Team beziehungsweise „Tie“ ausgewählt. Für Settebello wird genau ein Spieler oder Team ausgewählt. Scopa bleibt ein Plus/Minus-Zähler je Spieler oder Team, da mehrere Scope je Hand möglich sind. Jede Partie erhält einen Namen und ein Datum. Einzelne Hände werden automatisch als Round 1 bis Round X bezeichnet.

Die Startseite listet gespeicherte Partien mit automatisch gesetztem Datum und Punktestand. Eine Auswahl öffnet die jeweilige Partie mit vollständigem Rundenverlauf erneut. Einzelne Runden können über ein dezentes Optionsmenü aus der Historie gelöscht werden, danach werden Gesamtpunkte und Spielstatus neu berechnet. Das Logo führt aus einer laufenden Partie zur Startseite.

Spielerfelder sind beim Start leer und zeigen Player 1 bis Player 4 nur als Platzhalter. Im Teammodus werden nur vier Spielernamen erfasst, Teams heißen automatisch Team 1 und Team 2. Auf der Einrichtungsseite bleiben einzelne Spielernamensfelder neutral. Nur die beiden Teamcontainer erhalten unterschiedliche dezente Farbtöne. Gewinneroptionen bleiben neutral, bis eine Option ausgewählt wird. Erst die Auswahl erhält den Farbton des Spielers oder Teams. Auf der Punkteseite werden bei Teams im kleinen gelben Label Team 1 beziehungsweise Team 2 gezeigt, im Hauptbereich stehen direkt die beiden Spielernamen. Bei drei Einzelspielern bleiben die Punktestände auch auf Mobilgeräten nebeneinander. Das Gleichstandssymbol steht im Kopfbereich der Kategorie, außerhalb der Spieleroptionen. Alle Scoring-Kategorien erhalten einheitliche Kartenhöhen.

## 7. Speicher- und Synchronisierungsumfang

Version 1.0 speichert Partien ausschließlich lokal im Browser des verwendeten Geräts. Ein Spielstand wird dadurch nicht automatisch auf weitere Geräte übertragen. Eine spätere Cloud-Synchronisierung ist eine eigenständige Ausbaustufe.

## 8. Implementierungsreihenfolge

1. Projektgerüst und Build einrichten.
2. Kartendaten, Typen und reine Scoring-Funktionen implementieren.
3. Unit-Tests für jede Kategorie und für Gleichstände schreiben.
4. Einrichtung der drei Spielmodi und Spieler-/Teamzuordnung umsetzen.
5. Gemeinsame Ein-Seiten-Handwertung für alle Spieler/Teams implementieren, inklusive direkter Primiera-Gewinnerauswahl und optionalem Primiera-Vergleichs-Popup.
6. Vorschau, Gesamtstand und Verlauf implementieren.
7. lokale Speicherung, Bearbeiten und Rückgängig ergänzen.
8. Englische Mobile-first-Oberfläche und PWA-/Offline-Funktion ergänzen.
9. Testen und Deployment über GitHub Pages konfigurieren.

Die offenen Regelpunkte aus Abschnitt 4 werden vor dem endgültigen Festlegen des Scoring-Verhaltens abgeglichen.
