# TODO — Old app features in new TS app (legacy MQTT)

- [ ] Add a legacy-mode flag/config in `src/config/awsIotConfig.ts`
- [x] Extend `src/config/awsIotCredentials.ts` with commented cert-based placeholders (rootCA, deviceCert, privateKey) while keeping IAM keys

- [x] Implement legacy MQTT-over-TLS connector in `src/services/awsIot/awsIotClient.ts`

- [ ] Wire legacy subscriptions/publishes:
  - subscribe: `AQMG_5`
  - publish command to: `esp32/control`
- [ ] Keep existing WSS/SigV4 implementation intact; switch based on flag
- [ ] Update dashboard bridge if needed (likely no change)
- [ ] Run tests/build + manual verification steps

