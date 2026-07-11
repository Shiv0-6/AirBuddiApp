# Infra: AirBuddi IoT Pipeline (SAM)

This folder contains an AWS SAM template to deploy a minimal pipeline:

- AWS IoT Topic Rule that forwards MQTT telemetry to Lambda
- Lambda function that writes telemetry to DynamoDB and exposes a simple HTTP GET via API Gateway
- DynamoDB table for telemetry

Prerequisites:

- AWS CLI + SAM CLI configured with credentials

Quick deploy (interactive):

```bash
cd infra
sam build
sam deploy --guided
```

After deploy, note the `TelemetryApi` output — set `telemetryApiConfig.baseUrl` in `src/config/awsIotConfig.ts`.
