# AirBuddi App Architecture

Below is the app flow diagram describing how the ESP32 device publishes telemetry and how the mobile app consumes it.

```mermaid
flowchart TD
    ESP32[ESP32 publishes JSON] --> IoT[AWS IoT Core]
    IoT -->|Check in MQTT Test Client| User[You verify payload]
    IoT --> Thing[Thing name GPS_GPRS]
    IoT --> Cert[Certificate + Policy]
    IoT --> Rule[IoT Rule forwards data]
    Rule --> DDB[DynamoDB stores telemetry]
    DDB --> Lambda[Lambda reads latest data]
    Lambda --> API[API Gateway exposes endpoints]
    API --> App[React Native app consumes data]
```

Notes:

- Thing name used by the device: `GPS_GPRS`.
- IoT Rule forwards incoming MQTT messages to a Lambda which writes to DynamoDB.
- The Lambda exposes a read endpoint via API Gateway that the React Native app polls or fetches.
