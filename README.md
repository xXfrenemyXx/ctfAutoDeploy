# ctfAutoDeploy
Vorraussetzungen:
- Minikube installiert
- skaffold installiert
- kubectl installiert
- ingress addons enabled
- hosts file nach folgendem Schema angepasst:
<locale IP> 	example.com
<locale IP> 	juicewatcher.com
<locale IP> 	ctfd.example.com
<locale IP> 	team1.example.com
<locale IP> 	team2.example.com
<locale IP> 	team3.example.com
<locale IP> 	team4.example.com
<locale IP> 	team5.example.com

Installation:
git clone https://github.com/xXfrenemyXx/ctfAutoDeploy.git
cd ctfAutoDeploy
skaffold dev
