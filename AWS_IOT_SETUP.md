# 🌿 AirBuddi — AWS IoT Real Data Setup Guide

> **Beginner-friendly, step-by-step guide** to connect your AirBuddi app to real sensor data from your ESP32 via AWS IoT Core.

---

## What This Guide Covers

| Step | What You Will Do |
|------|-----------------|
| 1 | Find your AWS IoT Core endpoint |
| 2 | Create AWS IAM credentials for the mobile app |
| 3 | Fill in your credentials in one file |
| 4 | Enable live mode in the app |
| 5 | Test the connection |

---

## Before You Start — What You Need

- ✅ An **AWS account** (free tier is fine)
- ✅ Your **ESP32 device** already registered in AWS IoT Core (it has a certificate and is publishing data)
- ✅ The AirBuddi app running on your phone or emulator

---

## Step 1 — Find Your AWS IoT Core Endpoint

Your endpoint is already partially set. Let's confirm it.

1. Open [AWS Console](https://console.aws.amazon.com)
2. Search for **"IoT Core"** in the top search bar → click it
3. In the left sidebar → click **"Settings"**
4. You will see **"Device data endpoint"** — it looks like:
   ```
   a1qe87k6xy75k4-ats.iot.eu-north-1.amazonaws.com
   ```
5. **Copy this value** — you will paste it in `awsIotCredentials.ts`

> **Your current endpoint** in the code is already:
> `a1qe87k6xy75k4-ats.iot.eu-north-1.amazonaws.com`
> ✅ If this matches what you see in the console, you don't need to change it.

---

## Step 2 — Create IAM Credentials for the Mobile App

The mobile app connects to AWS IoT over **WebSockets (WSS)**. It needs AWS credentials to sign these requests. The easiest method for development is an **IAM User with an access key**.

### 2a — Create an IAM User

1. In AWS Console, search **"IAM"** → click it
2. Left sidebar → click **"Users"** → click **"Create user"**
3. **User name**: `airbuddi-mobile-app` → click **Next**
4. Select **"Attach policies directly"**
5. Search for `AWSIoTDataAccess` → check the box
6. Click **Next** → **Create user**

### 2b — Create an Access Key

1. Click on the user you just created (`airbuddi-mobile-app`)
2. Go to tab **"Security credentials"**
3. Scroll down to **"Access keys"** → click **"Create access key"**
4. Select **"Other"** → click **Next** → **Create access key**
5. **⚠️ IMPORTANT**: Copy both values NOW — AWS only shows them once:
   - `Access key ID` → looks like: `AKIAIOSFODNN7EXAMPLE`
   - `Secret access key` → looks like: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

> **Security Note for later**: For production, use **AWS Cognito Identity Pools** instead of hardcoded IAM keys. This guide uses IAM keys for quick development setup.

---

## Step 3 — Fill In Your Credentials

Open this file in your project:
```
src/config/awsIotCredentials.ts
```

Fill in your values (the file has clear comments for each field).

> ⚠️ **Never commit this file to Git!** Add it to `.gitignore` (see Step 5).

---

## Step 4 — Verify Your ESP32 Thing Name

The `deviceId` in the config must exactly match the **Thing Name** of your ESP32 in AWS IoT Core.

1. In AWS Console → **IoT Core** → left sidebar → **"All devices"** → **"Things"**
2. You'll see a list — find your air purifier device
3. Copy the **Thing name** exactly (case-sensitive!)
4. Paste it as `deviceId` in `awsIotCredentials.ts`

The MQTT topics your app listens to are built from the `deviceId`:
```
airbuddi/{deviceId}/telemetry   ← sensor data comes here
airbuddi/{deviceId}/status      ← device status
airbuddi/{deviceId}/command     ← app sends commands here
```

Make sure your ESP32 is publishing to the **same topic pattern**.

---

## Step 5 — Add Credentials File to .gitignore

Open `.gitignore` in your project root and add this line at the bottom:
```
# AWS IoT real credentials — DO NOT COMMIT
src/config/awsIotCredentials.ts
```

---

## Step 6 — Test the Connection

1. **Start the app** → `npm run android` or `npm run ios`
2. On the Dashboard, look at the **connection indicator** (top of screen)
3. Expected states:
   - 🟡 **Connecting...** — app is trying to reach AWS IoT
   - 🟢 **Connected** — success! Real data is now flowing
   - 🔴 **Offline** — something is wrong (see Troubleshooting below)

---

## Troubleshooting

### "AWS IoT endpoint is set, but the app still needs temporary AWS credentials"
**Fix**: You haven't filled in `accessKeyId` and `secretAccessKey` in `awsIotCredentials.ts`.

### "Invalid AWS IoT endpoint"
**Fix**: Your endpoint must contain `.iot.` and end with `.amazonaws.com`. Double-check you copied it from IoT Core → Settings.

### App shows "Offline" but credentials look correct
**Possible causes**:
1. **IAM Policy missing**: Make sure your IAM user has `AWSIoTDataAccess` policy attached
2. **Region mismatch**: The `region` field must match the region in your endpoint URL
3. **Thing Name wrong**: The `deviceId` must exactly match your ESP32's Thing Name
4. **ESP32 not publishing**: Test in AWS IoT Core → **MQTT test client** → subscribe to `airbuddi/#`

### Connected but no sensor data appears
**Fix**: Your ESP32 might be publishing to a different topic. In AWS IoT Console → **MQTT test client**, subscribe to `#` (wildcard) and look at what topic your device actually publishes to. Update `createAwsIotTopics()` in `awsIotConfig.ts` accordingly.

---

## MQTT Payload Format — What Your ESP32 Should Send

The app can understand multiple payload formats from your ESP32. Any of these will work:

### Format A — Structured (recommended)
```json
{
  "deviceId": "airbuddi-pure-x",
  "ts": "2024-01-01T12:00:00Z",
  "aqi": 42,
  "sensors": [
    { "key": "temperature", "value": 24.5, "unit": "C" },
    { "key": "humidity",    "value": 55.0, "unit": "%" },
    { "key": "pm2_5",       "value": 12.3, "unit": "ug/m3" },
    { "key": "pm10",        "value": 20.1, "unit": "ug/m3" },
    { "key": "co2",         "value": 620,  "unit": "ppm" },
    { "key": "voc",         "value": 0.18, "unit": "ppm" }
  ]
}
```

### Format B — Flat / Simple
```json
{
  "temperature": 24.5,
  "humidity": 55.0,
  "pm2_5": 12.3,
  "pm10": 20.1,
  "co2": 620,
  "voc": 0.18,
  "aqi": 42
}
```

Both formats are automatically detected and handled by the app.

---

## File Map — Where Everything Lives

```
src/
├── config/
│   ├── awsIotConfig.ts          ← Main config (endpoint, region, deviceId, topics)
│   └── awsIotCredentials.ts     ← YOUR CREDENTIALS GO HERE (you create this)
│
├── services/awsIot/
│   ├── awsIotClient.ts          ← MQTT connection logic (don't edit)
│   ├── awsIotTypes.ts           ← TypeScript types
│   └── esp32TelemetryContract.ts← ESP32 data format definitions
│
└── features/dashboard/
    ├── dashboardMockData.ts     ← Fallback data when offline
    └── useDashboardRealtimeBridge.ts ← Connects AWS IoT to the UI
```
