# 🌿 AirBuddi — AWS IoT Core Setup Guide for Live Dashboard Data

> This guide helps you connect your ESP32 device to AWS IoT Core so the AirBuddi dashboard can show live values such as AQI, filter health, power state, fan speed, and sensor readings.

---

## What the app expects

The dashboard is already wired to connect over MQTT with device certificates (mTLS) and to read live telemetry from AWS IoT Core.

By default, the app will:

- connect to AWS IoT Core over port 8883 using mTLS
- subscribe to:
  - `AQMG_5` (legacy topic)
  - `airbuddi/<deviceId>/telemetry`
  - `airbuddi/<deviceId>/status`
  - `airbuddi/<deviceId>/connection`
- publish control commands to `esp32/control`

For the dashboard to display real data, your ESP32 or publisher must send a valid JSON payload on one of those telemetry topics.

---

## 1. Create your AWS IoT Thing

1. Open the AWS Console.
2. Go to IoT Core.
3. Open Things.
4. Click Create thing.
5. Give it a name that matches your device ID, for example `airbuddi-pure-x`.
6. Finish the creation flow.

> The deviceId in the app must exactly match the Thing name you create here.

---

## 2. Create an IoT policy for your device

Create a policy that allows your device to connect, subscribe, receive, and publish.

Use a policy like this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "iot:Connect",
      "Resource": "arn:aws:iot:REGION:ACCOUNT_ID:client/${iot:ClientId}"
    },
    {
      "Effect": "Allow",
      "Action": ["iot:Subscribe", "iot:Receive"],
      "Resource": [
        "arn:aws:iot:REGION:ACCOUNT_ID:topicfilter/AQMG_5",
        "arn:aws:iot:REGION:ACCOUNT_ID:topicfilter/airbuddi/*",
        "arn:aws:iot:REGION:ACCOUNT_ID:topicfilter/esp32/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "iot:Publish",
      "Resource": [
        "arn:aws:iot:REGION:ACCOUNT_ID:topic/AQMG_5",
        "arn:aws:iot:REGION:ACCOUNT_ID:topic/airbuddi/*",
        "arn:aws:iot:REGION:ACCOUNT_ID:topic/esp32/control"
      ]
    }
  ]
}
```

Replace `REGION` and `ACCOUNT_ID` with your AWS values.

---

## 3. Create and attach device certificates

1. In AWS IoT Core, create a device certificate.
2. Download the following files:
   - `AmazonRootCA1.pem`
   - your device certificate `.pem.crt`
   - your private key `.pem.key`
3. Attach the certificate to the Thing you created.
4. Attach the policy you created to the certificate.
5. Activate the certificate.

These files are what the app uses for mTLS authentication.

---

## 4. Find your AWS IoT endpoint

1. Open AWS IoT Core.
2. Go to Settings.
3. Copy the Device data endpoint.
4. It should look like:
   `xxxxxxxxxxxxxx-ats.iot.<region>.amazonaws.com`

You will paste this into the app config.

---

## 5. Fill the app credentials

Open [src/config/awsIotCredentials.ts](src/config/awsIotCredentials.ts) and update the values in the two sections below:

### 5a. Endpoint, region, and deviceId

Set:

- `endpoint` to your AWS IoT ATS endpoint
- `region` to your AWS region, for example `eu-north-1`
- `deviceId` to your Thing name, for example `airbuddi-pure-x`

### 5b. Certificate contents

Paste the full contents of:

- `rootCA` → the contents of `AmazonRootCA1.pem`
- `deviceCert` → your device certificate `.pem.crt`
- `privateKey` → your private key `.pem.key`

Make sure you include the full `BEGIN` and `END` blocks.

---

## 6. Publish telemetry in the format the dashboard expects

Your ESP32 publisher should send telemetry to one of the subscribed topics.

### Recommended topic

- `airbuddi/<deviceId>/telemetry`

### Example payload

```json
{
  "deviceId": "airbuddi-pure-x",
  "deviceName": "AirBuddi Pure X",
  "power": "on",
  "mode": "auto",
  "fanSpeed": "2",
  "aqi": 42,
  "filterHealth": 76,
  "remainingLifeDays": 14,
  "connection": "connected",
  "sensors": [
    { "key": "temperature", "value": 24.1, "unit": "C", "status": "good" },
    { "key": "humidity", "value": 48.2, "unit": "%", "status": "good" },
    { "key": "pm2_5", "value": 12.3, "unit": "ug/m3", "status": "good" },
    { "key": "co2", "value": 610, "unit": "ppm", "status": "good" }
  ]
}
```

### Also supported

The app can also parse payloads wrapped like these:

```json
{ "telemetry": { "deviceId": "airbuddi-pure-x", "aqi": 41 } }
```

```json
{ "payload": { "deviceId": "airbuddi-pure-x", "aqi": 41 } }
```

```json
{ "data": { "deviceId": "airbuddi-pure-x", "aqi": 41 } }
```

If you want the dashboard cards to populate fully, your payload should include at least:

- `aqi`
- `filterHealth`
- `remainingLifeDays`
- `power`
- `mode`
- `fanSpeed`
- `sensors`

---

## 7. Optional status and connection topics

You can also publish to these extra topics if you want richer status updates:

- `airbuddi/<deviceId>/status`
- `airbuddi/<deviceId>/connection`

These are optional, but they help the app reflect connection and device state more clearly.

---

## 8. Test the live dashboard

1. Start the app with `npm run android` or `npm run ios`.
2. Make sure the dashboard shows a connected state.
3. Publish a test message to the telemetry topic.
4. Confirm that the dashboard updates the connection pill, AQI card, sensor grid, and device cards.

If the app shows offline or no data, check the logs in the terminal or device console.

---

## Troubleshooting

### Connection fails with certificate errors

Make sure:

- the certificate is activated
- the policy is attached to the certificate
- the root CA, cert, and private key are copied exactly

### Dashboard stays offline

Check:

- endpoint format
- region match
- Thing name matches `deviceId`
- certificate is attached to the correct Thing

### Connected, but no dashboard values appear

Check that your ESP32 topic and payload match what the app expects.
The most common fix is to publish to:

- `airbuddi/<deviceId>/telemetry`

and include a JSON body with the fields mentioned above.

### MQTT module missing

Run:

```bash
npm install
```

---

## Notes for real-world use

- The app currently expects a JSON message payload, not raw text.
- The dashboard works best when your ESP32 publishes fresh telemetry regularly.
- If your device uses a different topic naming convention, update the subscription list in [src/services/awsIot/awsIotClient.ts](src/services/awsIot/awsIotClient.ts).
