const mqtt = require('mqtt');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateClientId(length = 20) {
    return crypto.randomBytes(length).reduce((t, i) => {
        i &= 63;
        if (i < 36) {
            t += i.toString(36);
        } else if (i < 62) {
            t += (i - 26).toString(36).toUpperCase();
        } else if (i > 62) {
            t += "-";
        } else {
            t += "_";
        }
        return t;
    }, "");
}

// Configuration MQTT
const config = {
    host: 'wss.mqtt.digibox.app',
    port: 443,
    protocol: 'wss',
    path: '/mqtt',
    username: 'digiPoulpe',
    password: 'WyumfcItTe2ZJ1HhOovJ',
    clientId: generateClientId(20), // 20 caractères comme dans tes exemples
    protocolId: 'MQIsdp',
    protocolVersion: 3
};

// Topic à écouter
const topic = 'poulpe/DigiSnow/valmeinier/snow/latest';
// const topic = 'poulpe/DigiSnow/valmeinier/assets/all';

// Fichier de sortie pour sauvegarder les résultats
const outputDir = path.join(__dirname, '../test');
const outputFile = path.join(outputDir, 'mqtt_results.json');

// Créer le dossier test s'il n'existe pas
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Initialiser le fichier avec un array vide s'il n'existe pas
let results = [];
if (fs.existsSync(outputFile)) {
    try {
        results = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
    } catch (e) {
        results = [];
    }
}


console.log('🔌 Connexion au broker MQTT...');
console.log(`   Host: wss://${config.host}${config.path}`);
console.log(`   Client ID: ${config.clientId}`);
console.log(`   Topic: ${topic}`);
console.log(`   📁 Résultats sauvegardés dans: ${outputFile}\n`);

// Création du client MQTT
const client = mqtt.connect(`wss://${config.host}:${config.port}${config.path}`, {
    username: config.username,
    password: config.password,
    clientId: config.clientId,
    protocolId: config.protocolId,
    protocolVersion: config.protocolVersion,
    keepalive: 60,
    reconnectPeriod: 5000,
    clean: true,
    wsOptions: {
        headers: {
            'Origin': 'https://valmeinier.digisnow.app'
        }
    }
});

// Event: Connexion établie
client.on('connect', () => {
    console.log('✅ Connecté au broker MQTT!\n');
    
    // Abonnement au topic
    client.subscribe(topic, { qos: 0 }, (err) => {
        if (err) {
            console.error('❌ Erreur lors de l\'abonnement:', err);
        } else {
            console.log(`📡 Abonné au topic: ${topic}`);
            console.log('⏳ En attente de messages...\n');
        }
    });
});

// Event: Message reçu
client.on('message', (receivedTopic, message) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📨 Message reçu sur: ${receivedTopic}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log('─────────────────────────────────────────');

    let parsedData;
    try {
        // Tentative de parsing JSON
        parsedData = JSON.parse(message.toString());
        console.log('📊 Données (JSON):');
        console.log(JSON.stringify(parsedData, null, 2));
    } catch (e) {
        // Si ce n'est pas du JSON, afficher le message brut
        parsedData = message.toString();
        console.log('📄 Données (brut):');
        console.log(parsedData);
    }

    // Sauvegarder le résultat dans le fichier
    const result = {
        timestamp: new Date().toISOString(),
        topic: receivedTopic,
        data: parsedData
    };
    results.push(result);

    try {
        fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf-8');
        console.log(`💾 Sauvegardé dans: ${outputFile}`);
    } catch (err) {
        console.error('❌ Erreur lors de la sauvegarde:', err);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

// Event: Erreur
client.on('error', (error) => {
    console.error('❌ Erreur MQTT:', error);
});

// Event: Déconnexion
client.on('close', () => {
    console.log('🔌 Déconnecté du broker MQTT');
});

// Event: Reconnexion
client.on('reconnect', () => {
    console.log('🔄 Tentative de reconnexion...');
});

// Event: Offline
client.on('offline', () => {
    console.log('📴 Client hors ligne');
});

// Gestion de l'arrêt propre du script
process.on('SIGINT', () => {
    console.log('\n\n🛑 Arrêt du client...');
    client.end(() => {
        console.log('👋 Client MQTT arrêté proprement');
        process.exit(0);
    });
});

console.log('💡 Appuyez sur Ctrl+C pour arrêter le client\n');