# 🌿 AirBuddi — AWS IoT Real Data Setup Guide (mTLS)

> **Step-by-step guide** to connect your AirBuddi app to real sensor data from your ESP32 via AWS IoT Core using certificate-based authentication (mTLS).

---

## What This Guide Covers

| Step | What You Will Do |
|------|-----------------|
| 1 | Find your AWS IoT Core endpoint |
| 2 | Collect your Device Certificates (mTLS) |
| 3 | Fill in your credentials in `awsIotCredentials.ts` |
| 4 | Verify your ESP32 Thing Name |
| 5 | Test the connection |

---

## Before You Start — What You Need

- ✅ An **AWS account**
- ✅ Your **ESP32 device** already registered in AWS IoT Core.
- ✅ You should have three files from when you created your "Thing" in AWS:
  1. `AmazonRootCA1.pem` (Root CA)
  2. `XXXXXXXXXX-certificate.pem.crt` (Device Certificate)
  3. `XXXXXXXXXX-private.pem.key` (Private Key)

---

## Step 1 — Find Your AWS IoT Core Endpoint

1. Open [AWS Console](https://console.aws.amazon.com)
2. Search for **"IoT Core"** → click it.
3. In the left sidebar → click **"Settings"**.
4. Copy the **"Device data endpoint"**. It looks like:
   `xxxxxxxxxxxxxx-ats.iot.region.amazonaws.com`

---

## Step 2 — Fill In Your Credentials

Open this file in your project:
```
src/config/awsIotCredentials.ts
```

### 2a — Paste the Endpoint & Region
Update the `MY_DEVICE_CONFIG` section at the bottom of the file with your **endpoint**, **region**, and **deviceId** (Thing Name).

### 2b — Paste the Certificates
In the `MY_IOT_MTLS_CREDENTIALS` section, open your certificate files in a text editor and copy/paste their full content (including the `BEGIN` and `END` lines) into the backticks (`` ` ``):

- **rootCA**: Content of `AmazonRootCA1.pem`
- **deviceCert**: Content of `XXXXXXXXXX-certificate.pem.crt`
- **privateKey**: Content of `XXXXXXXXXX-private.pem.key`

---

## Step 3 — Verify Your ESP32 Thing Name

The `deviceId` in `MY_DEVICE_CONFIG` must exactly match the **Thing Name** of your ESP32 in AWS IoT Core.

1. In AWS Console → **IoT Core** → **All devices** → **Things**.
2. Copy the **Thing name** exactly (case-sensitive).
3. Paste it as `deviceId` in `awsIotCredentials.ts`.

---

## Step 4 — Topic Structure

By default, this app is configured to:
- **Subscribe** to `AQMG_5` (Legacy topic) and `airbuddi/{deviceId}/telemetry`.
- **Publish** commands to `esp32/control`.

If your ESP32 uses different topics, you can update them in `src/services/awsIot/awsIotClient.ts`.

---

## Step 5 — Test the Connection

1. **Start the app** → `npm run android` or `npm run ios`.
2. Check the **connection indicator** on the Dashboard.
3. If it stays "Connecting..." or goes "Offline", check the console logs (`npx react-native log-android` or `log-ios`) for specific MQTT error messages.

---

## Troubleshooting

### "MQTT Error: Connection Refused: Bad Username or Password"
**Fix**: In AWS IoT, this often actually means a certificate mismatch. Ensure your `rootCA`, `deviceCert`, and `privateKey` are exactly as provided by AWS.

### "Connected but no sensor data appears"
**Fix**: Use the **MQTT test client** in the AWS Console to subscribe to `#`. See exactly which topic your ESP32 is publishing to. If it's not `AQMG_5` or `airbuddi/.../telemetry`, update the subscription list in `awsIotClient.ts`.

### "Module not found: mqtt"
**Fix**: Run `npm install` to ensure all dependencies are present.
