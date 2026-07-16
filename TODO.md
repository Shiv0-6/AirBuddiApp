# TODO - Light On/Off control via API Gateway + ESP32 topic

- [ ] Inspect existing light-related UI (Light tab placeholder) and existing command publishing path (`esp32/control` legacy topic).
- [ ] Extend dashboard state/types to include `lightOn` boolean.
- [ ] Extend telemetry normalization + slice merging to read `lightOn` from API/MQTT payload if available.
- [ ] Add `setLightState()` command sender in `useDashboardRealtimeBridge` that publishes to `esp32/control`/API commands for ESP32 light.
- [ ] Replace Light tab placeholder UI with a Light On/Off button wired to state and command sender.
- [ ] Update any tests / TypeScript compile errors if introduced.
- [ ] Run app build/tests to verify.

