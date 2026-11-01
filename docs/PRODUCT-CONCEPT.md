# Produktkonzept: Scopa Napoletana Scorekeeper

**Status:** Konzept für Version 1.0  
**Produktart:** Mobile-first Web-App und Progressive Web App (PWA)  
**Zweck:** Digitale Punkteverwaltung für eine am Tisch gespielte Partie Scopa Napoletana.

## 1. Produktziel

Die App ist ausschließlich ein digitaler Scorekeeper für eine reale, mit physischen Karten gespielte Scopa-Partie. Sie ersetzt Papier und Taschenrechner, nicht das Kartenspiel selbst. Es werden keine Karten digital ausgeteilt, keine Spielzüge simuliert und keine digitale Partie gespielt. Spielende erfassen nach jeder Runde die erzielten Karten- und Sonderwertungen. Die App berechnet daraus die Rundepunkte, aktualisiert den Gesamtstand und erkennt den Spielsieg.

Die Anwendung soll auf einem Smartphone am Spieltisch schnell, übersichtlich und mit großen Touch-Flächen bedienbar sein. Sie soll nach dem ersten Laden auch ohne Internetverbindung funktionieren. Ein Benutzerkonto und ein Server sind für die erste Version nicht erforderlich.

## 2. Verbindlich festgelegter Umfang

### Spielmodi

1. **Zwei Einzelspieler:** zwei Personen spielen gegeneinander.
2. **Drei Einzelspieler:** drei Personen spielen gegeneinander.
3. **Vier Spieler in zwei Teams:** vier Personen werden zwei Teams mit je zwei Personen zugeordnet. Die Punkte werden auf Teamebene geführt.

Andere Spielerzahlen sind für Version 1.0 nicht vorgesehen.

### Zielpunktzahl

- Standardwert: **11 Punkte**.
- Die Zielpunktzahl kann vor Spielbeginn frei eingestellt werden.
- Die App akzeptiert ausschließlich positive ganze Zahlen.
- Die Zielpunktzahl wird für die laufende Partie gespeichert.

### Sprache

Die gesamte Benutzeroberfläche von Version 1.0 ist Englisch. Alle Navigationselemente, Buttons, Beschriftungen, Hinweise, Fehlermeldungen und Dialoge werden auf Englisch formuliert. Ausschließlich fest etablierte Scopa-Fachbegriffe bleiben italienisch, insbesondere Carte, Denari, Settebello, Primiera und Scopa. Es gibt in Version 1.0 keine deutsche UI-Variante.

## 3. Zielgruppen und Nutzungssituation

- Personen, die Scopa Napoletana mit einem physischen Kartenspiel spielen.
- Zwei oder drei Einzelspielende.
- Vier Personen, die als zwei Teams spielen.
- Nutzung überwiegend auf Smartphones, gelegentlich auf Tablets oder Desktop-PCs.
- Die App liegt während einer Runde meist offen auf einem Gerät in der Tischmitte.

## 4. Kernablauf

1. Startbildschirm öffnen und „Neue Partie“ wählen.
2. Spielmodus auswählen.
3. Spielernamen eingeben. Im Vier-Spieler-Modus zusätzlich Teamnamen und Teamzuordnung festlegen.
4. Zielpunktzahl kontrollieren oder anpassen. Standard ist 11.
5. Partie starten.
6. Beim Start einen Namen und ein Datum für die Partie festlegen. Nach jeder gespielten Hand die Wertung für alle Spieler beziehungsweise Teams gemeinsam in einem einzigen kompakten Container erfassen. Die Hände werden automatisch als Round 1 bis Round X nummeriert.
7. Die App prüft die Eingaben, berechnet die Rundepunkte und zeigt eine Vorschau.
8. Wertung bestätigen. Gesamtstand und Rundenverlauf werden aktualisiert.
9. Sobald die Zielpunktzahl erreicht ist, zeigt die App den Sieger an. Bei Gleichstand an der Spitze wird eine weitere Runde gespielt.
10. Partie kann gespeichert, fortgesetzt, exportiert oder beendet werden.

## 5. Wertung pro Hand

Die Standardwertung der ersten Version umfasst die folgenden fünf Kategorien. Die App berechnet die Punkte aus einer Gewinnerauswahl je Kategorie. Für Carte, Denari und Primiera kann ausdrücklich ein Gleichstand gewählt werden.

| Kategorie | Regel | Punkte |
|---|---|---:|
| Carte | Die Partei mit den meisten erbeuteten Karten erhält den Punkt. Bei Gleichstand erhält niemand den Punkt. | 1 |
| Denari | Die Partei mit den meisten Münzkarten erhält den Punkt. Bei Gleichstand erhält niemand den Punkt. | 1 |
| Settebello | Die Partei mit dem Sieben der Münzen erhält den Punkt. | 1 |
| Primiera | Die Partei mit der höchsten Primiera-Summe erhält den Punkt. Bei Gleichstand erhält niemand den Punkt. | 1 |
| Scopa | Jede Scopa zählt einen Punkt für die Partei, die sie erzielt hat. | 1 je Scopa |

### Erfassung je Spieler oder Team

Die Rundeneingabe besteht aus einem gemeinsamen Container mit klar getrennten Kategorien:

- **Cards Taken:** Gewinner direkt auswählen oder „Tie“.
- **Denari:** Gewinner direkt auswählen oder „Tie“.
- **Settebello:** Spieler oder Team auswählen, das den Sieben der Münzen besitzt.
- **Primiera:** Gewinner direkt auswählen oder „Tie“. Optional öffnet „Compare“ den Detailvergleich.
- **Scopa:** Anzahl der Scope je Spieler oder Team über Plus/Minus-Steuerung erfassen.

Für Cards Taken und Denari werden keine Karten- oder Münzzahlen eingegeben. Im Teammodus werden die Wertungen auf Teamebene ausgewählt. Die vier Gewinnerkategorien vergeben je einen Punkt. Jede Scopa zählt zusätzlich einen Punkt.

### Primiera-Werte

Die Primiera wird je Farbe mit der höchsten vorhandenen Karte gebildet. Die Werte sind:

| Karte | Primiera-Wert |
|---|---:|
| 7 | 21 |
| 6 | 18 |
| Ass (1) | 16 |
| 5 | 15 |
| 4 | 14 |
| 3 | 13 |
| 2 | 12 |
| Fante (8) | 10 |
| Cavallo (9) | 10 |
| Re (10) | 10 |

Die vier Kartenwerte werden addiert. Die normale Rundeneingabe verlangt keine Kartenauswahl für die Primiera. Da das Ergebnis am Spieltisch meistens direkt feststeht, wählt die bedienende Person den Primiera-Gewinner unmittelbar aus. Bei einem unklaren Ergebnis oder einem erforderlichen Stechen öffnet ein kleiner sekundärer Button „Compare Primiera“. Dieser öffnet ein separates Popup, in dem die höchste Karte jeder Farbe für jede Wertungseinheit ausgewählt wird. Die App berechnet die Primiera-Summen automatisch und zeigt den Vergleich transparent an. Aus dem Vergleich wird der Gewinner übernommen. Bei tatsächlichem Gleichstand wird kein Primiera-Punkt vergeben.

### Plausibilitätsprüfungen

- Für Cards Taken, Denari und Primiera muss eine Wertungseinheit oder ausdrücklich „Tie“ gewählt werden.
- Für Settebello muss genau ein Spieler oder Team ausgewählt werden.
- Scopa-Anzahlen müssen nichtnegative ganze Zahlen sein.
- Im optionalen Primiera-Vergleich dürfen nur Kartenwerte der jeweils zugehörigen Farbe ausgewählt werden.
- Bei unvollständigen Eingaben wird die Wertung nicht bestätigt.

**Hinweis zu Restkarten:** Bei der Erfassung ist die in der gespielten Partie übliche Zuordnung der am Ende auf dem Tisch verbliebenen Karten an die zuletzt Karten nehmende Partei zu berücksichtigen. So können die Summen aller Karten und Denari vollständig erfasst werden.

### Letzte Kartenaufnahme und Scopa

Als Standard gilt: Eine letzte Kartenaufnahme, mit der am Handende lediglich die letzten Tischkarten eingesammelt werden, zählt nicht als Scopa. Da am Tisch unterschiedliche Varianten gespielt werden können, wird diese Regel als spätere Partieeinstellung vorgesehen. Der Standardwert bleibt ausgeschaltet.

## 6. Bildschirmkonzept

### A. Startbildschirm

- Produktname und kompakte visuelle Gestaltung mit Kartenmotiv.
- Primäre Aktion „Neue Partie“.
- Aktion „Partie fortsetzen“, sofern ein laufendes Spiel gespeichert ist.
- Zugang zu abgeschlossenen Partien und Einstellungen.

### B. Partie einrichten

- Auswahl der drei unterstützten Spielmodi.
- Dynamische Namensfelder entsprechend der Spielerzahl.
- Im Teammodus Zuordnung der vier Personen zu Team 1 oder Team 2.
- Bearbeitbare Teamnamen.
- Zielpunktzahl mit voreingestellten schnellen Werten und freier Zahleneingabe.
- Zusammenfassung vor dem Start.

### C. Laufende Partie

- Partiename und Datum als einzige Partiemetadaten.
- Große, gut erkennbare Gesamtpunktstände.
- Spieler- oder Teamnamen und Fortschritt bis zur Zielpunktzahl.
- Schaltfläche „Enter round“.
- Schaltfläche „Verlauf“.
- Schaltfläche „Partie beenden“ mit Sicherheitsabfrage.

### D. Handwertung

- Alle Spieler beziehungsweise Teams werden gemeinsam auf einer einzigen Eingabeseite angezeigt, entsprechend dem ursprünglich festgelegten Ein-Seiten-Konzept.
- Die Eingabebereiche sind klar voneinander abgegrenzt und auf kleinen Displays gut untereinander erfassbar.
- Eine kompakte Auswahl pro Kategorie für alle Spieler beziehungsweise Teams gemeinsam.
- Gewinnerauswahl für Cards Taken, Denari, Settebello und Primiera. Bei Cards Taken, Denari und Primiera ist „Tie“ möglich.
- Kleiner sekundärer Button „Compare“ zum Öffnen des optionalen Primiera-Kartenvergleichs.
- Scopa-Zähler mit Plus/Minus-Steuerung.
- Live-Vorschau der Rundepunkte.
- Bestätigung erst, wenn jede Kategorie ausgewählt wurde.

### E. Wertungsvorschau

- Gewinner jeder Wertungskategorie.
- Rundepunkte pro Spieler oder Team.
- Neuer Gesamtpunktestand.
- Bestätigung vor dem endgültigen Speichern.

### F. Partieabschluss

- Sieger deutlich anzeigen.
- Endstand und Zusammenfassung.
- Neue Partie starten.
- Partie lokal archivieren.
- Ergebnis als Text oder JSON exportieren.

### G. Verlauf

- Alle bisherigen Hände mit Kategorieergebnissen.
- Nachträgliches Bearbeiten einer Hand.
- Letzte Aktion rückgängig machen.
- Nach einer Bearbeitung alle Folge-Gesamtstände neu berechnen.

## 7. Bedien- und Designprinzipien

- Mobile-first, zunächst für schmale Smartphone-Displays entwerfen.
- Keine horizontale Seitenbewegung im normalen Spielablauf.
- Große Touch-Ziele, Richtwert mindestens 44 × 44 CSS-Pixel.
- Hoher Kontrast und große Punktzahlen.
- Farben dienen nicht allein als Informationsträger. Team und Wertungskategorien erhalten zusätzliche Beschriftungen oder Symbole.
- Wenige Schritte zwischen laufendem Spiel und Handwertung.
- Kritische Aktionen wie Partie löschen oder Wertung überschreiben benötigen eine Bestätigung.
- Die Kartenbilder dienen ausschließlich als visuelle Hilfen bei der Punkteeingabe, insbesondere bei der Primiera-Auswahl. Es gibt keine interaktive Tisch-, Handkarten- oder Stichansicht.
- Die Spielfläche soll ruhig und hochwertig wirken, angelehnt an einen grünen Kartentisch. Die Karten bleiben das visuelle Hauptelement.

## 8. Speicherung und Datenschutz

- Name und Datum der Partie sowie der Rundenverlauf werden automatisch lokal im Browser gespeichert. Die einzelnen Hände werden fortlaufend als „Round 1“ bis „Round X“ bezeichnet und erhalten keine eigene Datumsanzeige.
- Kein Benutzerkonto, keine Cloud und keine Übertragung von Spielständen in Version 1.0.
- Spielstände bleiben auf dem jeweiligen Browser beziehungsweise Gerät.
- Eine Export- und Importfunktion für Sicherungen ist vorgesehen.
- Die App informiert, dass das Löschen der Browserdaten lokale Spielstände entfernen kann.

## 9. Funktionsumfang nach Priorität

### Version 1.0, Startumfang

- Drei definierte Spielmodi.
- Namen und Teamzuordnung.
- Konfigurierbare Zielpunktzahl, Default 11.
- Rundenerfassung für alle fünf Wertungskategorien.
- Direkte Auswahl des Primiera-Gewinners sowie optionaler Primiera-Detailvergleich im Popup mit den vorhandenen Kartenbildern.
- Automatische Punkteberechnung.
- Validierung der Karten- und Denari-Summen.
- Gesamtstand, Rundenvorschau und Verlauf.
- Rückgängig und Bearbeiten.
- Automatische lokale Speicherung.
- Smartphone-optimiertes Layout.
- PWA-Installation und Offline-Verfügbarkeit.
- GitHub-Pages-Deployment.

### Spätere Ausbaustufen

- Spielerprofile und Statistiken über mehrere Partien.
- Export als PDF oder CSV.
- Weitere UI-Sprachen zusätzlich zu Englisch.
- Zusätzliche Hausregeln als konfigurierbare Optionen.
- Cloud-Synchronisierung über mehrere Geräte.
- Teilen einer Partie per Link.
- Live-Mehrgeräte-Spiel.
- Digitales Kartenspiel, Austeilen digitaler Karten, virtuelle Handkarten, simulierte Spielzüge, Tisch- oder Stichverwaltung. Dies ist ausdrücklich nicht Teil des Produkts.

## 10. Abnahmekriterien

Version 1.0 ist bereit zur Veröffentlichung, wenn:

- alle drei Spielmodi korrekt eingerichtet werden können,
- die Wertung für zwei, drei und vier Spielende korrekt funktioniert,
- Teamwerte im Vier-Spieler-Modus korrekt aggregiert werden,
- Gewinnerauswahl und Gleichstände für Carte, Denari und Primiera korrekt gespeichert und berechnet werden,
- Settebello genau einem Spieler oder Team zugeordnet wird,
- Primiera direkt ausgewählt werden kann und der optionale Detailvergleich korrekt funktioniert,
- Zielpunktzahl 11 voreingestellt und frei änderbar ist,
- Gleichstände am Spielende korrekt behandelt werden,
- Spielstände nach Neuladen wiederhergestellt werden,
- eine Partie bearbeitet und die Punkte danach neu berechnet werden können,
- die App auf kleinen Smartphone-Displays ohne horizontales Scrollen bedienbar ist,
- die App nach dem ersten erfolgreichen Laden offline startet und die lokalen Kartenbilder verfügbar sind,
- der Produktionsbuild erfolgreich ist und die veröffentlichte Website auf GitHub Pages funktioniert.
