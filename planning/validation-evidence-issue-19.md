# Validation Evidence — Issue #19

Date: 2026-03-10  
Branch: `issue-19-contracts-model-phase3`  
Work Item: `#19`

## Scope Summary

Implemented the bounded Issue #19 model-first slice only:

- `.github/.system-state/contracts/contracts_model.yaml`
- `.github/.system-state/contracts/api.yaml`
- `planning/validation-issue-19-structural-check.json`
- `planning/validation-evidence-issue-19.md`

## Structural Validation Commands

### Command

```powershell
$script = @"
import json
from datetime import datetime, timezone
from pathlib import Path
import yaml

contracts_path = Path('.github/.system-state/contracts/contracts_model.yaml')
api_path = Path('.github/.system-state/contracts/api.yaml')

contracts = yaml.safe_load(contracts_path.read_text(encoding='utf-8'))
api = yaml.safe_load(api_path.read_text(encoding='utf-8'))

expected_current = ['capability-registry', 'policy-engine', 'recipe-executor', 'digital-twin']
expected_planned = ['dispatch', 'wms-wcs-connectors', 'asr', 'cv', 'edge-adapters']
expected_gates = ['g1_contract_lint', 'g2_schema_compatibility', 'g3_consumer_provider_tests', 'g4_ci_required_checks']
required_paths = ['/api/v1/capabilities', '/api/v1/policies/evaluate', '/api/v1/recipes/execute', '/api/v1/digital-twin/sync']

current_services = (contracts or {}).get('current_services', {})
planned_contracts = (contracts or {}).get('planned_contracts', {})
quality_gates = ((contracts or {}).get('contract_testing_obligations', {}) or {}).get('quality_gates', {})
companion = ((contracts or {}).get('contracts_model', {}) or {}).get('companion_artifacts', [])

missing_current = [name for name in expected_current if name not in current_services]
missing_planned = [name for name in expected_planned if name not in planned_contracts]
missing_gates = [name for name in expected_gates if name not in quality_gates]
missing_paths = [path for path in required_paths if path not in ((api or {}).get('paths', {}))]

versioning = (contracts or {}).get('versioning_policy', {})
versioning_ok = bool(versioning and 'backward_compatibility' in versioning)
companion_ok = any(item.get('path') == '.github/.system-state/contracts/api.yaml' for item in companion if isinstance(item, dict))
openapi_ok = str((api or {}).get('openapi')) == '3.0.3'

report = {
    'timestamp_utc': datetime.now(timezone.utc).isoformat(),
    'contracts_file': str(contracts_path).replace('\\\\', '/'),
    'api_file': str(api_path).replace('\\\\', '/'),
    'yaml_parse': {
        'contracts_model': isinstance(contracts, dict),
        'api': isinstance(api, dict),
    },
    'required_field_checks': {
        'current_services_present': len(missing_current) == 0,
        'missing_current_services': missing_current,
        'planned_contract_groups_present': len(missing_planned) == 0,
        'missing_planned_groups': missing_planned,
        'versioning_policy_present': versioning_ok,
        'contract_testing_quality_gates_present': len(missing_gates) == 0,
        'missing_quality_gates': missing_gates,
        'companion_artifact_reference_present': companion_ok,
        'openapi_version_valid': openapi_ok,
        'required_paths_present': len(missing_paths) == 0,
        'missing_paths': missing_paths,
    },
}

all_pass = all([
    report['yaml_parse']['contracts_model'],
    report['yaml_parse']['api'],
    report['required_field_checks']['current_services_present'],
    report['required_field_checks']['planned_contract_groups_present'],
    report['required_field_checks']['versioning_policy_present'],
    report['required_field_checks']['contract_testing_quality_gates_present'],
    report['required_field_checks']['companion_artifact_reference_present'],
    report['required_field_checks']['openapi_version_valid'],
    report['required_field_checks']['required_paths_present'],
])
report['overall_pass'] = all_pass

out_path = Path('planning/validation-issue-19-structural-check.json')
out_path.write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))

if not all_pass:
    raise SystemExit(1)
"@; py -c $script
```

### Result

- Output file generated: `planning/validation-issue-19-structural-check.json`
- `overall_pass: true`
- YAML parse checks: pass
- Required field presence checks: pass

## Acceptance Criteria Mapping

| Criterion                                                                               | Evidence                                                                                                                                                                                                                                                      | Status |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1. `contracts_model.yaml` exists, machine-readable, and covers current/planned services | `contracts_model.yaml` created with current services (`capability-registry`, `policy-engine`, `recipe-executor`, `digital-twin`) and planned groups (`dispatch`, `wms-wcs-connectors`, `asr`, `cv`, `edge-adapters`); validation JSON confirms field coverage | PASS   |
| 2. Versioning/backward-compatibility and contract-testing obligations explicit          | `versioning_policy` and `contract_testing_obligations.quality_gates` defined and validated present                                                                                                                                                            | PASS   |
| 3. Companion contract stub exists and is model-referenced                               | `.github/.system-state/contracts/api.yaml` created; `contracts_model.companion_artifacts[].path` references it and check passes                                                                                                                               | PASS   |
| 4. Validation evidence demonstrates bounded scope and acceptance coverage               | This evidence file plus machine-readable validation JSON artifact capture commands, pass/fail checks, and scope verification                                                                                                                                  | PASS   |

## Scope-Boundary Verification

No runtime service code, package manifests, or unrelated refactors were
introduced as part of Issue #19 implementation slice.

## Risk Notes

- Pre-existing unrelated working-tree changes were present before Issue #19
  execution.
- Issue #19 staging/commit must include only scoped files listed above.
