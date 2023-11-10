const express = require('express');
const axios = require('axios');
const app = express();
const k8s = require('@kubernetes/client-node');

const PORT = process.env.PORT || 80;

async function fetchData() {
  try {
    const response = await axios.get('http://ctfd.example.com/api/v1/teams');
    const data = response.data; // JSON-Daten aus der Antwort

    if (Array.isArray(data.data)) {
      const teamNames = data.data.map(team => team.name);

      // Überprüfe für jedes Team, ob ein Pod existiert
      const podStatus = await checkPodStatus(teamNames);

      app.locals.html = createHtml(teamNames, podStatus);
    } else {
      console.error('Ungültiges JSON-Format: "data" ist kein Array');
    }
  } catch (error) {
    console.error('Fehler beim Abrufen von Daten:', error);
  }
}

async function checkPodStatus(teamNames) {
  const k8s = require('@kubernetes/client-node');

  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
  const namespace = 'default';

  const podStatus = {};

  for (const teamName of teamNames) {
    const deploymentName = `${teamName}-deployment`;

    try {
      // listNamespacedPod, um alle Pods mit dem Präfix abzurufen
      const response = await k8sApi.listNamespacedPod(namespace, `metadata.name=${deploymentName}`);
      
      if (response.body.items.length > 0) {
        // Es gibt mindestens einen laufenden Pod für das Deployment
        const podPhase = response.body.items[0].status.phase;
        podStatus[teamName] = podPhase;
      } else {
        // Kein Pod gefunden
        podStatus[teamName] = 'Not Found';
      }
    } catch (error) {
      console.error(`Fehler beim Überprüfen des Pods für ${teamName}:`, error);
      podStatus[teamName] = 'Error';
    }
  }

  return podStatus;
}

function createHtml(teamNames, podStatus) {
  let html = '<html><body><ul>';
  teamNames.forEach(name => {
    const status = podStatus[name] || 'Unknown';
    html += `<li>${name} - Pod Status: ${status}</li>`;
  });
  html += '</ul></body></html>';
  return html;
}

fetchData();
setInterval(fetchData, 5000);

app.get('/', (req, res) => {
  const html = app.locals.html || '<html><body>No data available</body></html>';
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
