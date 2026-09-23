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

## Customer sign-in

The template also creates an Amazon Cognito User Pool. This is where registered
customer accounts are stored; Cognito hashes passwords, so the mobile app never
stores or receives password records. After deployment, copy the
`CognitoUserPoolClientId` output into `src/config/authConfig.ts`.

The included pre-sign-up trigger auto-confirms accounts because the current app
only asks for a username and password. Before a production release, add an email
field to registration and replace that trigger with email verification.
