# Deployment Documentation

## Purpose

This directory contains deployment and release guidance for local development,
staging, and production rollout flows.

## Current Status

Foundational scaffold. Current deployment references are split across:

- `infrastructure/docker/`
- repository root `README.md`
- CI workflow definitions in `.github/workflows/`

Primary CI quality gates currently include:

- Model State validation (`npm run validate:model:system-state`)
- Broker runtime wiring validation (`npm run validate:broker-runtime`)
- Lint, type check, test, and build
- Secrets scan and dependency audit

## Available Guides

- [Message Broker Setup (MQTT + Kafka)](./message-broker-setup.md)

## Near-Term Contents

- Environment topology and prerequisites
- Build, image, and rollout sequence
- Canary and rollback procedures

## Related Architecture Evidence

- [ADR-002: TypeScript and Build System](../architecture/ADR-002-typescript-build-system.md)
- [Phase 0 Gap Report](../architecture/phase-0-gap-report.md)
