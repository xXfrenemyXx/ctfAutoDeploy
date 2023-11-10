const k8s = require('@kubernetes/client-node');
const axios = require('axios');
const namespace = 'default'

main()

async function main() {
  // Load k8s config and create API clients
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  const crAPI = kc.makeApiClient(k8s.CustomObjectsApi)
  const coreAPI = kc.makeApiClient(k8s.CoreV1Api)
  const appsAPI = kc.makeApiClient(k8s.AppsV1Api)
  const netAPI = kc.makeApiClient(k8s.NetworkingV1Api)
  const apis = {
      kc, crAPI, coreAPI, appsAPI, netAPI
  }
  let CTFdTeams; // Variable zum Speichern des Rückgabewerts
  const intervalId = setInterval(async () => {
    try {
      const CTFdTeams = await getCTFdTeams();
      console.log('Daten abgerufen:', CTFdTeams);
  
      if (Array.isArray(CTFdTeams)) {
        for (const teamName of CTFdTeams) {
          createRessources(apis, teamName);
        }
      } else {
        console.error('Kein Array'); // debugging
      }
      deploymentsToBeDeleted = await checkForUnnecessaryDeployments(apis, CTFdTeams)
      console.log(typeof deploymentsToBeDeleted);
      console.log('tobedeleted')
      console.log(deploymentsToBeDeleted)
      console.log(deploymentsToBeDeleted.length)
      if (deploymentsToBeDeleted.length > 0){
        for(const toDelete of deploymentsToBeDeleted){
          deleteResources(apis, toDelete)
        }
      }
    } catch (error) {
      console.error('Fehler beim Abrufen von Daten:', error);
    }
  }, 5000);
}

async function checkForUnnecessaryDeployments(apis, CTFdTeams) {
  try {
    // Lese alle Deployments im Namespace 'default'
    const deploymentList = await apis.appsAPI.listNamespacedDeployment('default');
    
    // Extrahiere die Namen der vorhandenen Deployments und konvertiere zu lowercase
    const existingDeployments = deploymentList.body.items.map(deployment => deployment.metadata.name.toLowerCase());
    // Finde Deployments, die in Kubernetes existieren, "team" enthalten, aber nicht in CTFdTeams
    const deploymentsNotInCTFd = existingDeployments
      .map(deployment => deployment.replace('-deployment', ''))
      .filter(deployment => deployment.includes('team'))
      .filter(deployment => !CTFdTeams.includes(deployment));
      
    return deploymentsNotInCTFd;
  } catch (error) {
    console.error('Fehler beim Überprüfen der Deployments:', error);
  }
}




async function getCTFdTeams() { 
  try {
    const response = await axios.get('http://ctfd.example.com/api/v1/teams'); //holen der Teams
    const data = response.data; // JSON-Daten aus der Antwort

    if (Array.isArray(data.data)) { //prüfen ob es sich um ein array handelt
      const teamNames = data.data.map(team => team.name);
      return teamNames;
      // Überprüfe für jedes Team, ob ein Pod existiert
    } else {
      console.error('Ungültiges JSON-Format: "data" ist kein Array');
      return []; 
    }
  } catch (error) {
    console.error('Fehler beim Abrufen von Daten:', error);
  }
}
  
async function createRessources(apis, teamName) {
    console.log("Handling", teamName, 'default')
    const deploymentName = `${teamName}-deployment`
    const serviceName = `${teamName}-service`
    const ingressName = `${teamName}-ingress`

    const pathPrefix = `/${teamName.replace(/[^a-zA-Z0-9]/g, '-')}`
    const appLabel = `${teamName}-label`

    const deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: `${teamName}-deployment`,
        labels: {
          app: teamName,
          team: teamName,
        },
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: teamName,
          },
        },
        template: {
          metadata: {
            labels: {
              app: teamName,
            },
          },
          spec: {
            containers: [
              {
                name: teamName,
                image: 'bkimminich/juice-shop',
                imagePullPolicy: 'IfNotPresent',
                ports: [
                  {
                    containerPort: 3000,
                  },
                ],
                env: [
                  {
                    name: 'CTF_KEY',
                    value: '123456789abcdef',
                  },
                  {
                    name: 'NODE_ENV',
                    value: 'ctf',
                  },
                ],
              },
            ],
          },
        },
      },
    };
    

    const service = {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
            name: `${teamName}-service`,
          },
          spec: {
            selector: {
              app: teamName,
            },
            ports: [
              {
                name: `${teamName}-port`,
                protocol: 'TCP',
                port: 3000,
                targetPort: 3000,
              },
            ],
          },
        };

    const ingres = {
        apiVersion: 'networking.k8s.io/v1',
        kind: 'Ingress',
        metadata: {
       name: `${teamName}-ingress`,
    },
    spec: {
      rules: [
        {
          host: `${teamName}.example.com`, 
          http: {
            paths: [
              {
                path: '/',
                pathType: 'Prefix',
                backend: {
                  service: {
                    name: `${teamName}-service`,
                    port: {
                      number: 3000,
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };

  try {
    await apis.appsAPI.readNamespacedDeployment(deploymentName, 'default');
    console.log(`Deployment ${deploymentName} existiert bereits.`);
  } catch (error) {
    // Deployment existiert nicht, erstelle es
    console.log(`Deployment ${deploymentName} wird erstellt.`);
      try {
        await apis.appsAPI.createNamespacedDeployment('default', deployment);
  //      console.log('Nach Deployment-Erstellung');
      } catch (error) {
        console.error('Fehler bei der Deployment-Erstellung:', error);
      }
  }

  // Überprüfen, ob Service bereits vorhanden ist
  try {
    await apis.coreAPI.readNamespacedService(serviceName, 'default');
    console.log(`Service ${serviceName} existiert bereits.`);
  } catch (error) {
    // Service existiert nicht, erstelle es
    console.log(`Service ${serviceName} wird erstellt.`);
      try {
        await apis.coreAPI.createNamespacedService('default', service);
  //      console.log('Nach Service-Erstellung');
      } catch (error) {
        console.error('Fehler bei der Service-Erstellung:', error);
      }
  }

  // Überprüfen, ob Ingress bereits vorhanden ist
  try {
    await apis.netAPI.readNamespacedIngress(ingressName, 'default');
    console.log(`Ingress ${ingressName} existiert bereits.`);
  } catch (error) {
    // Ingress existiert nicht, erstelle es
    console.log(`Ingress ${ingressName} wird erstellt.`);
      try {
        await apis.netAPI.createNamespacedIngress('default', ingres);
  //      console.log('Nach Ingress-Erstellung');
      } catch (error) {
        console.error('Fehler bei der Ingress-Erstellung:', error);
      }
  }
}

async function deleteResources(apis, teamName) { // Löschen von Ressourcen
  const deploymentName = `${teamName}-deployment`;
  const serviceName = `${teamName}-service`;
  const ingressName = `${teamName}-ingress`;

  // Löschen des Deployments
  try {
    await apis.appsAPI.deleteNamespacedDeployment(deploymentName, namespace);
    console.log(`Deployment ${deploymentName} erfolgreich gelöscht.`);
  } catch (error) {
    console.error(`Fehler beim Löschen des Deployments ${deploymentName}:`, error);
  }

  // Löschen des Services
  try {
    await apis.coreAPI.deleteNamespacedService(serviceName, namespace);
    console.log(`Service ${serviceName} erfolgreich gelöscht.`);
  } catch (error) {
    console.error(`Fehler beim Löschen des Services ${serviceName}:`, error);
  }

  // Löschen des Ingress
  try {
    await apis.netAPI.deleteNamespacedIngress(ingressName, namespace);
    console.log(`Ingress ${ingressName} erfolgreich gelöscht.`);
  } catch (error) {
    console.error(`Fehler beim Löschen des Ingress ${ingressName}:`, error);
  }
}