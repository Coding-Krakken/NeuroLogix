# Message Broker Setup (MQTT + Kafka)

## Purpose

Provide a deterministic local runtime baseline for NeuroLogix broker dependencies:

- MQTT broker via Eclipse Mosquitto
- Kafka-compatible broker via Redpanda

This baseline is for development and contract-enforcement confidence only.

## Runtime Assets

- Compose definition: `infrastructure/docker/docker-compose.dev.yml`
- Mosquitto config: `infrastructure/docker/mosquitto/config/mosquitto.conf`
- Mosquitto writable mounts:
  - `infrastructure/docker/mosquitto/data/`
  - `infrastructure/docker/mosquitto/log/`

## Start Brokers Locally

```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d mosquitto redpanda
```

## Stop Brokers Locally

```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml stop mosquitto redpanda
```

## Validate Wiring Contracts

Run the repository broker wiring gate:

```bash
npm run validate:broker-runtime
```

Validation checks:

- Required broker services and volume mappings exist in compose.
- Mosquitto config and writable mount directories are present.
- Mosquitto config includes MQTT + WebSocket listeners and persistence settings.

## Notes

- This baseline does not introduce service-level broker clients.
- Production hardening (authN/authZ, certs, secret rotation, HA) remains part of later security/deployment phases.
