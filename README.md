# ctfAutoDeploy
## 1 Einführung
Das System wurde unter Verwendung von Ubuntu 22.04. in einer VM entwickelt und getestet. 
Die Container wurden mit minikube betrieben.
Im folgenden Projekt werden verschiedene Aspekte behandelt:
1. Containerisierung und Ausführung von JS Anwendungen
2. Programmierung und Einsatz eines eigen entwickelten Operators
3. Überschreiben von bestehenden images
 
## 2 Vorraussetzungen:
- Minikube installiert
- skaffold installiert
- kubectl installiert
- ingress addons enabled
- hosts file nach folgendem Schema angepasst:
<table>
    <tr>
        <td>locale IP</td>
        <td>example.com</td>
    </tr>
    <tr>
        <td>locale IP</td>
        <td></td>juicewatcher.com</td>
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

<locale IP> 	ctfd.example.com
<locale IP> 	team1.example.com
<locale IP> 	team2.example.com
<locale IP> 	team3.example.com
<locale IP> 	team4.example.com
<locale IP> 	team5.example.com

## 3 Installation:
git clone https://github.com/xXfrenemyXx/ctfAutoDeploy.git
cd ctfAutoDeploy
skaffold dev
