# Developer Architecture Notes

## Canonical Sources

- System model: `.github/.system-state/model/system_state_model.yaml`
- Federation model: `.github/.system-state/model/federation_model.yaml`
- Contracts: `.github/.system-state/contracts/`
- ADRs: `docs/architecture/ADR-*.md`

## Delivery Principles

- Model-first: update models before implementation changes.
- Safety-first: no direct PLC actuation outside validated recipe execution.
- Determinism-first: prefer single canonical patterns over variants.