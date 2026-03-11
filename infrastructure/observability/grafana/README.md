# Grafana Dashboard Baselines

These dashboard files provide **versioned baseline stubs** for the dashboard
definitions in `.github/.system-state/ops/observability_model.yaml` (`OBS-001`).

## Files

| File | OBS-001 dashboard key | Purpose |
|---|---|---|
| `control-plane.dashboard.json` | `control_plane` | Control-loop latency, throughput, recipe success, safety interlock events |
| `security-audit.dashboard.json` | `security_audit` | Audit write errors, policy denied/blocked events, safety bypass, certificate expiry |
| `mission-control-ui.dashboard.json` | `mission_control_ui` | LCP p95, SSE stream uptime, route-level error rates |

## Usage

1. Import dashboard JSON into Grafana in a staging workspace.
2. Bind datasource variable placeholders (for example `DS_PROMETHEUS`) to the
   environment's Prometheus datasource.
3. Validate panel queries against emitted metrics before production rollout.

## Notes

- These are **baseline stubs**, not deployment automation.
- Runtime provisioning to staging/production remains tracked in
  `.developer/TODO.md`.
- Alert triage procedures are documented in
  `docs/runbooks/observability-baseline.md`.
