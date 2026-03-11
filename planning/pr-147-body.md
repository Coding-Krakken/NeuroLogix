## Summary
- add OBS-001-aligned Grafana dashboard baseline stubs for `control_plane`, `security_audit`, and `mission_control_ui`
- document dashboard baseline usage in observability infrastructure and runbook docs
- update developer TODO to mark dashboard baseline stubs complete and track staging wiring as next step

## Linked Issue
Closes #147

## Validation
- `node -e "const fs=require('fs');['infrastructure/observability/grafana/control-plane.dashboard.json','infrastructure/observability/grafana/security-audit.dashboard.json','infrastructure/observability/grafana/mission-control-ui.dashboard.json'].forEach(f=>JSON.parse(fs.readFileSync(f,'utf8'))); console.log('Grafana dashboard JSON validation: PASS');"`
- `npm run lint`
- `npm run type-check`
