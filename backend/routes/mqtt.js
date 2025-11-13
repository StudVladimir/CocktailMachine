const mqtt = require('mqtt');

// MQTT connection parameters taken from backend/arduino.cpp
const MQTT_HOST = process.env.MQTT_HOST || '172.20.53.121';
const MQTT_PORT = process.env.MQTT_PORT || 1883;
const MQTT_USER = process.env.MQTT_USER || 'student';
const MQTT_PASS = process.env.MQTT_PASS || 'student';

// base topic as used in Arduino sketch
const BASE_TOPIC = process.env.MQTT_BASE_TOPIC || 'Group5/ReactNative';

let client;
let connected = false;

function ensureClient() {
  if (client) return client;
  const url = `mqtt://${MQTT_HOST}:${MQTT_PORT}`;
  const opts = {
    username: MQTT_USER,
    password: MQTT_PASS,
    reconnectPeriod: 2000,
  };
  client = mqtt.connect(url, opts);
  client.on('connect', () => {
    connected = true;
    console.log('MQTT publisher connected to', url);
  });
  client.on('reconnect', () => {
    console.log('MQTT publisher reconnecting...');
  });
  client.on('error', (err) => {
    console.error('MQTT publisher error', err);
  });
  client.on('close', () => {
    connected = false;
    console.log('MQTT publisher connection closed');
  });
  return client;
}

module.exports = function registerMqttRoutes(app) {
  // ensure client created on startup
  ensureClient();

  // health/status
  app.get('/api/mqtt/status', (req, res) => {
    res.json({ connected });
  });

  // POST /api/makecocktail
  // body: array of objects: [{ "pump": 1, "seconds": 5 }, ...]
  app.post('/api/makecocktail', (req, res) => {
    const c = ensureClient();
    const payload = req.body;
    if (!Array.isArray(payload)) {
      return res.status(400).json({ error: 'Payload must be an array' });
    }

    // Validate entries
    for (const item of payload) {
      if (typeof item !== 'object' || item === null) {
        return res.status(400).json({ error: 'Each item must be an object {pump:int, seconds:int}' });
      }
      if (typeof item.pump !== 'number' || typeof item.seconds !== 'number') {
        return res.status(400).json({ error: 'Each item must contain numeric pump and seconds' });
      }
    }

    const topic = `${BASE_TOPIC}/MakeCocktail`;
    const message = JSON.stringify(payload);

    // publish with qos 1
    c.publish(topic, message, { qos: 1 }, (err) => {
      if (err) {
        console.error('Failed to publish MakeCocktail', err);
        return res.status(500).json({ error: 'Publish failed' });
      }
      res.json({ ok: true, topic, message });
    });
  });
};
