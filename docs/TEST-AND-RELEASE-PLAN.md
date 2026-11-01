# Test-, Entwicklungs- und Veröffentlichungsplan

## 1. Lokale Entwicklung

Voraussetzung ist Node.js 26 LTS sowie npm. Die gewünschte Hauptversion steht in der Datei .nvmrc.

Nach Einrichtung des App-Grundgerüsts:

    npm install
    npm run dev

Vite zeigt eine lokale Adresse an, üblicherweise http://localhost:5173.

### Auf einem Smartphone testen

1. Rechner und Smartphone mit demselben WLAN verbinden.
2. Entwicklungsserver mit npm run dev -- --host 0.0.0.0 starten.
3. Lokale IPv4-Adresse des Rechners ermitteln.
4. Auf dem Smartphone http://<RECHNER-IP>:5173 öffnen.

Die lokale Netzwerkadresse ist nur im eigenen WLAN erreichbar. Für PWA-Installations- und Offline-Tests ist zusätzlich der veröffentlichte HTTPS-Build zu prüfen.

## 2. Qualitätsprüfungen

Geplante Befehle:

    npm run test
    npm run build
    npm run preview

Der Produktionsbuild muss vor jedem Deployment erfolgreich sein. Zusätzlich wird die gebaute Website mit npm run preview auf korrekten Asset-Pfaden geprüft.

## 3. Unit-Testfälle für die Wertungslogik

### Primiera

- 7 ergibt 21 Punkte.
- 6 ergibt 18 Punkte.
- Ass ergibt 16 Punkte.
- 5, 4, 3 und 2 ergeben 15, 14, 13 und 12 Punkte.
- Fante, Cavallo und Re ergeben jeweils 10 Punkte.
- Vier Farben werden korrekt addiert.
- Fehlende Farbe wird als 0 behandelt.
- Ungültige Kartenwerte werden zurückgewiesen.

### Carte

- eindeutiger Höchstwert erhält genau einen Punkt.
- Gleichstand auf dem Höchstwert ergibt keinen Punkt.
- niedrigere Werte erhalten keinen Punkt.
- zwei Spieler, drei Spieler und zwei Teams werden unterstützt.

### Denari

- eindeutiger Höchstwert erhält genau einen Punkt.
- Gleichstand ergibt keinen Punkt.
- Wertebereich 0 bis 10 wird validiert.

### Settebello

- genau eine Partei erhält einen Punkt, wenn sie die Karte besitzt.
- niemand erhält den Punkt, wenn die Karte nicht zugeordnet wurde.
- mehr als eine Partei mit Settebello wird als ungültig erkannt.

### Scopa

- null Scope ergeben null Punkte.
- jede zusätzliche Scopa erhöht die Rundepunkte um genau einen Punkt.
- negative oder nicht ganzzahlige Werte werden abgelehnt.

### Spielende

- Standardziel 11 wird korrekt verwendet.
- benutzerdefinierte Zielwerte werden korrekt verwendet.
- ein eindeutiger Führender ab Zielpunktzahl gewinnt.
- bei Gleichstand an der Spitze wird das Spiel nicht fälschlich beendet.
- die Auswertung wird nach einer bearbeiteten Hand vollständig neu berechnet.

## 4. Testfälle für Dateneingabe und Spielablauf

- Partie mit zwei individuellen Spielern anlegen.
- Partie mit drei individuellen Spielern anlegen.
- vier Personen anlegen und zwei Teams zuweisen.
- Namen und Teamnamen ändern.
- Zielpunktzahl auf einen benutzerdefinierten Wert setzen.
- ungültige Eingabe wie negative Kartenanzahl blockieren.
- Kartensumme ungleich 40 blockieren.
- Denari-Summe ungleich 10 blockieren.
- Denari größer als Gesamtzahl blockieren.
- dieselbe Settebello-Karte nicht mehreren Parteien zuweisen.
- Wertungsvorschau prüfen und bestätigen.
- letzte Wertung rückgängig machen.
- frühere Hand bearbeiten und Gesamtstände neu berechnen.
- Seite neu laden und Partie wiederherstellen.
- Partie exportieren und wieder importieren.
- abgeschlossene Partie archivieren und neue Partie starten.

## 5. Responsive- und Gerätetests

Mindestens diese Ansichtsbreiten testen:

- 320 px: kleines Smartphone.
- 375 px: verbreitetes Smartphone-Format.
- 390 bis 430 px: aktuelle Smartphone-Formate.
- 768 px: Tablet oder kleines Tablet im Hochformat.
- 1024 px: Tablet im Querformat.
- 1440 px: Desktop.

Prüfpunkte:

- keine horizontale Scroll-Leiste im normalen Ablauf.
- Punktestände bleiben gut lesbar.
- Primiera-Karten sind antippbar und nicht zu klein.
- Eingabefelder werden beim Öffnen der Bildschirmtastatur nicht verdeckt.
- Modale Dialoge passen auf kleine Displays.
- Buttons besitzen ausreichende Touch-Flächen.
- Layout bleibt bei langen Spieler- und Teamnamen stabil.
- Hoch- und Querformat funktionieren.

## 6. Browser- und PWA-Tests

- aktuelle Safari-Version auf iPhone.
- aktuelle Chrome-Version auf Android.
- Chrome oder Edge auf Desktop.
- Website über HTTPS installieren beziehungsweise zum Startbildschirm hinzufügen.
- App nach erstem vollständigen Online-Ladevorgang offline öffnen.
- Kartenbilder im Offline-Modus prüfen.
- laufende Partie nach App-Schließen und erneutem Öffnen wiederherstellen.
- Service-Worker-Update prüfen, ohne Daten zu verlieren.

## 7. GitHub Pages veröffentlichen

### Wichtige Voraussetzung: Repository-Sichtbarkeit

Das Repository Henry918/scopa-napoletana ist bei der Bestandsprüfung privat.

GitHub Pages ist bei GitHub Free für persönliche Konten und Organisationen an öffentliche Repositories gebunden. Private Repositories sind für Pages mit GitHub Pro, Team oder Enterprise möglich. Die Website selbst ist öffentlich erreichbar, sofern sie als öffentliche Pages-Site veröffentlicht wird.

Vor dem Aktivieren von Pages ist deshalb eine Entscheidung nötig:

**Option A: GitHub Pages mit öffentlichem Repository**
- Vor der Umstellung Repository und vollständige Commit-Historie auf vertrauliche Inhalte prüfen.
- Sichtbarkeit erst nach Freigabe auf Public ändern.
- Nachteil: Quellcode, Historie, Assets, Actions-Historie und Logs werden öffentlich sichtbar.

**Option B: GitHub Pages mit privatem Repository**
- Dafür ist ein passender GitHub-Tarif erforderlich.
- Die veröffentlichte Website kann trotzdem öffentlich sein. Ein privates Repository macht die Website nicht automatisch privat.

**Option C: Externes Hosting**
- Vercel bietet einen kostenlosen Hobby-Tarif für persönliche, nicht kommerzielle Nutzung.
- Vor Nutzung die aktuellen Nutzungsbedingungen und Tarifgrenzen prüfen.
- Bei kommerzieller Nutzung ist der Hobby-Tarif nicht der passende Tarif.

Für die erste Version ist GitHub Pages technisch ausreichend. Die Entscheidung über öffentliche Repository-Sichtbarkeit wird nicht automatisch vorgenommen.

### Deployment-Ablauf

Nach erfolgreichem App-Build:

1. Den vorbereiteten Workflow .github/workflows/deploy.yml nach main übernehmen.
2. Unter Repository Settings → Pages als Quelle „GitHub Actions“ einstellen. Dieser einmalige Settings-Schritt muss manuell erfolgen.
3. Workflow bei Push auf main oder manuell starten.
4. Build mit npm ci, Tests und npm run build.
5. Inhalt von dist/ als Pages-Artefakt veröffentlichen.
6. Nach dem erfolgreichen Workflow die Pages-URL öffnen.
7. Startseite, Kartenpfade, PWA-Installation und Offline-Verhalten prüfen.

Voraussichtliche Projektseiten-Adresse:

    https://henry918.github.io/scopa-napoletana/

Die Adresse wird erst nach Aktivierung von Pages verbindlich.

### Wichtiger Vite-Pfad

Bei einer Projektseite muss Vite mit folgendem Basis-Pfad gebaut werden:

    base: '/scopa-napoletana/'

Alle Karten-, Icon- und PWA-Pfade müssen diesen Unterpfad berücksichtigen. Absolute Pfade wie /cards/... dürfen nicht unüberlegt verwendet werden, wenn sie den Repository-Unterpfad umgehen.

## 8. Versions- und Release-Strategie

- main enthält den freigegebenen Stand.
- Größere Arbeiten werden zunächst auf Feature-Branches umgesetzt.
- Jeder größere Abschnitt wird durch Tests und einen Build geprüft.
- Nach erfolgreichem Test werden Änderungen nach main übernommen.
- GitHub Actions veröffentlicht den neuen Stand automatisch.
- Vor Releases wird eine kurze manuelle Funktionsprüfung auf einem echten Smartphone durchgeführt.

## 9. Release-Checkliste

- [ ] alle Unit-Tests bestanden
- [ ] Produktionsbuild erfolgreich
- [ ] keine defekten Kartenbilder
- [ ] alle drei Spielmodi getestet
- [ ] Punkteberechnung und Gleichstände getestet
- [ ] Spielstand nach Reload vorhanden
- [ ] Bearbeiten und Rückgängig getestet
- [ ] Smartphone-Layouts geprüft
- [ ] PWA-Installation geprüft
- [ ] Offline-Start nach Erstaufruf geprüft
- [ ] GitHub-Pages-Build erfolgreich
- [ ] öffentliche URL und HTTPS geprüft
- [ ] keine sensiblen Daten im Repository oder in Build-Logs
