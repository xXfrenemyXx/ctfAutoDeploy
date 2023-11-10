# ctfAutoDeploy
## 1 Einführung
Das Projekt wurde ausschließlich von mir, Florian Spohn erstellt.

Das System wurde unter Verwendung von Ubuntu 22.04. in einer VM entwickelt und getestet. 
Die Container wurden mit minikube betrieben.
Capture the Flags (CTFs) sind typische Spiele im Bereich der Cybersecurity, in dem Hacker flags bei vulnerablen Anwendungen (bspw. der Juiceshop) ergattern und diese bei einem Scoreboard, wie dem CTFd, gegen Punkte einlösen können.

## 2 Zielsetzung
Ziel dieses Projekts war es, einen Operator zu schreiben, der das Handling mit Pods im Hintergrund übernimmt. Genauer sollte ein CTFd Server (ctfd.example.com) eingesetzt werden, an dem sich Teams frei registrieren können. Anhand der registrierten Teams soll der Operator im Hintergrund (Juiceshop) Instanzen starten. Diese Instanzen sind für jedes Team über die Subdomain zu erreichen (z.B. team1.example.com).
Weiterhin sollte eine kleine Status-Seite eingerichtet werden, welche Auskunft über die Deployments der (Juiceshop) Instanzen gibt. In diesem Projekt wurde diese Software juicewatcher genannt und diese ist unter juicewatcher.example.com zu erreichen.

Das folgende Projekt besteht aus drei Hauptkomponenten
1. Den CTFd Server, welcher für diese Szenario bereits vorkonfiguriert ist und ein eigenes image erstellt wurde (ghcr.io/xxfrenemyxx/cloudinfrastructure/configuredctfd:latest)
2. Dem "juicewatcher", eine selbstgeschriebene JS Anwendung, welches regelmäßig die API abfrägt und  
3. Überschreiben von bestehenden images (CTFd), sodass die Anwendung für den Test bereits entsprechend konfiguriert ist

## 3 Architektur
Die Architektur dieser Systeme lässt sich wie folgt beschreiben:
Grundsätzlich läuft in diesem Projekt alles innerhalb von Minikube und verwendet werden dementsprechend Container. Die Eigenentwicklungen basieren alle auf JavaScript. 

Der CTFd wird gemeinsam mit dem juicewatcher und dem Operator bereits zu Beginn gestartet, zusammen mit den dazugehörigen Ingresse und Services. Weiterhin werden Berechtigungen und Rollen für juicewatcher und operator gesetzt, sodass diese Status abfragen dürfen und Deployments, Ingresse und Services starten und stoppen dürfen.

Am CTFd können sich Nutzer registrieren und Teams erstellen. Sobald ein Team erstellt wurde, erfährt das der Operator. Dieser frägt alle 5 Sekunden die API des CTFd an und erhält eine JSON mit den Teamnamen. Daraufhin erstellt der Operator im Hintergrund Deployment, Ingress und Services pro Team für eine Juiceshop Instanz bereit. Diese Instanz ist dann über die Subdomain (bspw. team1.example.com) erreichbar.
Sollte Teams gelöscht werden, werden auch die dazugehörigen Ressourcen gelöscht.

Parallel zeigt der juicewatcher (juicewatcher.example.com) den aktuellen Status der Deployments der einzelnen Instanzen an. Hier können Teams prüfen, ob ihre Instanz läuft oder ob es Probleme gibt.

Da der CTFd entsprechend der Challenges der verwundbaren Software eingerichtet werden muss, wird hier ein für den Juiceshop konfiguriertes Image zur Verfügung gestellt (ghcr.io/xxfrenemyxx/cloudinfrastructure/configuredctfd:latest) und wird verwendet.

## 4 Installation:
### 4.1 Vorraussetzungen
- Minikube installiert
- skaffold installiert
- kubectl installiert
- ingress addons enabled
- hosts file nachfolgendem Schema anpassen:
<table>
    <tr>
        <td>locale IP</td>
        <td>example.com</td>
    </tr>
    <tr>
        <td>locale IP</td>
        <td>juicewatcher.com</td>
    </tr>
    <tr>
            <td>locale IP</td>
            <td>ctfd.example.com</td>
        </tr>
        <tr>
            <td>locale IP</td>
            <td>team1.example.com</td>
        </tr>
        <tr>
            <td>locale IP</td>
            <td>team2.example.com</td>
        </tr>
        <tr>
            <td>locale IP</td>
            <td>team3.example.com</td>
        </tr>
        <tr>
            <td>locale IP</td>
            <td>team4.example.com</td>
        </tr>
        <tr>
            <td>locale IP</td>
            <td>team5.example.com</td>
        </tr>
</table>

### 4.2 Applikationen starten:
Github Repositor klonen:
`git clone https://github.com/xXfrenemyXx/ctfAutoDeploy.git`
In das entsprechende Verzeichnis wechseln:
`cd ctfAutoDeploy`
Mithilfe von beispielsweise skaffold (skaffold.yaml ist im repo vorhanden) die Container starten:
`skaffold dev`

Um die Applikationen zu stoppen, kann man mit STRG+C skaffold beendet werden.

## 5 Screencast
Der Screencast ist in der ZIP im Abgabe-Bereich zu finden.

## 6 Vorteile und Nachteile der Cloud-Native-Realisierung:
### Vorteile:
- Skalierbarkeit: Cloud Native Apps bieten elastische Skalierbarkeit, um auf veränderte Lasten zu reagieren. Gerade wenn sich wie in diesem Projekt unter Umständen extrem viele Teams anmelden, ist das eine Stärke der Cloud Umsetzung
- Flexibilität: Containerisierung ermöglicht eine konsistente Umgebung über verschiedene Bereitstellungsumgebungen hinweg.
- Schnelle Bereitstellung: Durch den Einsatz von Containern können Updates schnell bereitgestellt werden.
- Automatisierung: Durch den Operator und den APIs in der Cloud ist der Automatisierungsgrad sehr hoch und ein manueller Eingriff ist fast nicht notwendig.

### Nachteile:
- Komplexität: Die Einführung von Cloud Native kann zu einer erhöhten Komplexität bei der Entwicklung und Wartung führen. Gerade bei Operatoren, die im Hintergrund laufen, ist das Debugging nicht ganz so trivial.
- Sicherheitsbedenken: Öffentliche Clouds können Sicherheitsbedenken aufwerfen, obwohl viele Cloud-Provider umfassende Sicherheitsmaßnahmen anbieten. In diesem Fall jedoch melden sich die Teilnehmer in aller Regel mit Benutzernamen an und es werden in aller Regel keine personenbezogenen Daten verarbeitet.
## 7 Alternative Realisierungsmöglichkeiten:
- Monolithische Architektur: Eine monolithische Anwendung könnte für einfachere Anwendungen ohne komplexe Anforderungen geeignet sein. Obwohl das in diesem Fall schwierig wäre, der CTFd und der Juiceshop bereits getrennte Systeme sind.
- Traditionelle Bereitstellung: Traditionelle, nicht-containerisierte Bereitstellungsmethoden wäre hier als Alternative möglich. Jedoch überwiegen bei diesem Anwendungsfall klar die Vorteile der Cloud.

## 8 Datenschutz und Datensicherheit
### 8. Datenschutz
Grundsätzlich ist gerade der Datenschutz ein nicht zu vernachlässigendes Thema, gerade in der Cloud. Hier ist es nicht transparent, wo welche Daten wann wie und für was verarbeitet werden. Daher sollte hier immer auf Datensparsamkeit geachtet und bestmöglich der Datenschutz garantiert werden. 
Dabei sollten folgende Aspekte berücksichtigt werden:
- Rechtskonformität
- Allgemeine Betrachtung:
--- Rechtskonformität in der Cloud bezieht sich darauf, dass die Datenverarbeitung den geltenden Datenschutzgesetzen entspricht, unabhängig davon, ob die Daten lokal oder in der Cloud gespeichert sind.
-- Spezifische Maßnahmen:
--- Einhaltung lokaler Datenschutzgesetze und internationaler Standards wie der DSGVO.
--- Klare Identifizierung und Dokumentation der Verarbeitung personenbezogener Daten.
- Transparenz und Einwilligung
- Datenvermeidung und -minimierung

