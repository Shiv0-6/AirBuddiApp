const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt');

const awsDir = path.resolve('src/config/AWS');
const rootCA = fs.readFileSync(path.join(awsDir, 'AmazonRootCA1.pem'), 'utf8').trim();
const deviceCert = fs.readFileSync(path.join(awsDir, 'Device Certificate.crt'), 'utf8').trim();
const privateKey = fs.readFileSync(path.join(awsDir, 'Private key.key'), 'utf8').trim();

console.log('Testing AWS IoT connection with local cert files...');
console.log('endpoint:', 'a1qe87k6xy75k4-ats.iot.eu-north-1.amazonaws.com');

const client = mqtt.connect({
  host: 'a1qe87k6xy75k4-ats.iot.eu-north-1.amazonaws.com',
  port: 8883,
  protocol: 'mqtts',
  clientId: 'airbuddi-check-' + Date.now(),
  clean: true,
  keepalive: 30,
  reconnectPeriod: 0,
  connectTimeout: 10000,
  rejectUnauthorized: true,
  ca: rootCA,
  cert: deviceCert,
  key: privateKey,
});

client.on('connect', () => {
  console.log('RESULT: SUCCESS - MQTT connection established');
  client.end(true);
  process.exit(0);
});

client.on('error', err => {
  console.error('RESULT: FAILED - MQTT error');
  console.error(err && err.message ? err.message : err);
  client.end(true);
  process.exit(1);
});

setTimeout(() => {
  console.error('RESULT: FAILED - connection timed out');
  client.end(true);
  process.exit(2);
}, 25000);
