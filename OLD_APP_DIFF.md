# Old vs New App — Why real data shows in old_app but not in new app

## Summary
The old Flutter app connects to AWS IoT Core using **certificate-based mutual TLS (MQTT on port 8883)** and subscribes to **fixed MQTT topics**. The new React Native/TS app connects using **IAM access keys signed for WSS (WebSocket MQTT over /mqtt)** and subscribes to **deviceId-derived topics** (`airbuddi/<deviceId>/...`).

If your ESP32 is publishing to the same topics expected by the old app (e.g. `AQMG_5`), then the new app won’t see telemetry because it’s listening to different topic names. Additionally, if your AWS IoT policy/certificate setup expects mTLS, the new IAM/SigV4 approach may not connect or may not receive data.

---

## What the old app does (old_app/airbuddi)

### 1) Connection/auth: MQTT over TLS with device certificates (mTLS)
File: `old_app/airbuddi/lib/services/mqtt_service.dart`

Key behaviors:
- Uses `MqttServerClient.withPort(AwsConfig.endpoint, AwsConfig.clientId, AwsConfig.port)`
- Uses TCP port **8883** (`AwsConfig.port = 8883`)
- Enables TLS: `_client!.secure = true`
- Builds a `SecurityContext` and loads:
  - `AwsConfig.rootCA`
  - `AwsConfig.deviceCert`
  - `AwsConfig.privateKey`
- Then connects and listens for inbound MQTT messages.

### 2) MQTT topics: fixed topic names
File: `old_app/airbuddi/lib/core/constants/aws_config.dart`

- Sensor topic: `static const String sensorTopic = 'AQMG_5';`
- Control topic: `static const String controlTopic = 'esp32/control';`

File: `old_app/airbuddi/lib/repositories/mqtt_repository.dart`

- Subscribes to `AwsConfig.sensorTopic` (i.e. `AQMG_5`)
- Publishes commands to `AwsConfig.controlTopic` (i.e. `esp32/control`)

---

## What the new app does (current TS/React Native)

### 1) Connection/auth: MQTT over WebSockets (WSS) + SigV4 signing
File: `src/services/awsIot/awsIotClient.ts`

Key behaviors:
- Builds a signed URL for WebSocket MQTT:
  - HTTP request uses `protocol: 'wss:'`
  - path: `/mqtt`
  - signer service: `iotdevicegateway`
- Uses IAM credentials from `src/config/awsIotCredentials.ts` via:
  - `credentialsProvider()` returning `{ accessKeyId, secretAccessKey, sessionToken? }`
- Connects using `mqtt.connect(signedUrl, { ... })`

### 2) MQTT topics: generated from deviceId
File: `src/config/awsIotConfig.ts`

`createAwsIotTopics(deviceId)` generates:
- telemetry: `airbuddi/${deviceId}/telemetry`
- status: `airbuddi/${deviceId}/status`
- command: `airbuddi/${deviceId}/command`
- connection: `airbuddi/${deviceId}/connection`

File: `src/services/awsIot/awsIotClient.ts`

- Subscribes to `[telemetry, status, connection]` after `connect`.

---

## The likely root causes (most probable first)

### Root cause #1: Topic naming mismatch
Old app expects telemetry on:
- `AQMG_5`

New app listens on:
- `airbuddi/<deviceId>/telemetry` (and other deviceId-prefixed topics)

If your ESP32 continues publishing to `AQMG_5`, the new app will show “connected/offline” but won’t receive telemetry.

**Fix options:**
- Update new app topic generation/subscriptions to match the real published topics (e.g. subscribe to `AQMG_5` and publish commands to `esp32/control`).
- Or update ESP32 firmware / AWS IoT rules / topic mapping so that it publishes to `airbuddi/<deviceId>/telemetry`.

### Root cause #2: Auth method mismatch (mTLS vs IAM SigV4)
Old app uses certificate-based TLS (root CA + device cert + private key).
New app uses IAM access keys signed for WSS.

If your AWS IoT Core and device are configured around certificate-based connections (typical for IoT device identity), then the new app may not connect properly or may not have permission to subscribe.

**Fix options:**
- Implement certificate-based MQTT (8883) in the new app as the old one does.
- Or update AWS IoT policies/roles and IoT Core configuration so the mobile app’s IAM identity can connect and subscribe to the same topics.

---

## Tech / AWS features used by old app
- **AWS IoT Core MQTT**
- **Mutual TLS (mTLS)** via:
  - device certificate
  - private key
  - root CA
- MQTT topics are hardcoded constants (`AQMG_5`, `esp32/control`)

---

## What to verify next (quick checklist)
1. In AWS IoT Core → MQTT Test Client, subscribe to `AQMG_5` and confirm telemetry arrives when ESP32 publishes.
2. In AWS IoT Core, confirm the mobile app is subscribed to the same topics the device publishes.
3. Confirm whether your AWS IoT connection is intended to be:
   - certificate-based MQTT (mTLS, port 8883), OR
   - IAM SigV4 over WebSockets (WSS, `/mqtt`).

---

## Files referenced
Old (Flutter):
- `old_app/airbuddi/lib/services/mqtt_service.dart`
- `old_app/airbuddi/lib/core/constants/aws_config.dart`
- `old_app/airbuddi/lib/repositories/mqtt_repository.dart`

New (TS):
- `src/services/awsIot/awsIotClient.ts`
- `src/config/awsIotConfig.ts`
- `src/config/awsIotCredentials.ts`

