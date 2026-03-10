# Validation Evidence — Issue #20

Date: 2026-03-10  
Branch: `issue-20-data-model-phase4`  
Work Item: `#20`

## Scope Summary

Implemented the bounded Issue #20 model-first slice only:

- `.github/.system-state/data/data_model.yaml`
- `planning/validation-issue-20-structural-check.json`
- `planning/validation-evidence-issue-20.md`

## Structural Validation Commands

### Command

```powershell
$script = @"
import json
from datetime import datetime, timezone
from pathlib import Path
import yaml

model_path = Path('.github/.system-state/data/data_model.yaml')
model = yaml.safe_load(model_path.read_text(encoding='utf-8'))

expected_top_level = [
    'data_model',
    'field_constraints',
    'canonical_entities',
    'schema_domains',
    'tenancy_partitioning',
    'retention_classes',
    'validation_boundaries',
]
expected_implemented_domains = ['capability-registry', 'policy-engine', 'recipe-executor', 'digital-twin']
expected_planned_domains = ['dispatch', 'wms-wcs-connectors', 'asr', 'cv', 'edge-adapters']

root = model or {}
missing_top_level = [key for key in expected_top_level if key not in root]

canonical_entities = root.get('canonical_entities', {}) if isinstance(root, dict) else {}
implemented_entities = canonical_entities.get('implemented', {}) if isinstance(canonical_entities, dict) else {}
planned_entities = canonical_entities.get('planned', {}) if isinstance(canonical_entities, dict) else {}

schema_domains = root.get('schema_domains', {}) if isinstance(root, dict) else {}
implemented_domains = schema_domains.get('implemented', {}) if isinstance(schema_domains, dict) else {}
planned_domains = schema_domains.get('planned', {}) if isinstance(schema_domains, dict) else {}

missing_implemented_domains = [name for name in expected_implemented_domains if name not in implemented_domains]
missing_planned_domains = [name for name in expected_planned_domains if name not in planned_domains]

implemented_schema_refs_present = all(
    isinstance(implemented_domains.get(name, {}), dict)
    and len((implemented_domains.get(name, {}) or {}).get('schema_refs', []) or []) > 0
    for name in expected_implemented_domains if name in implemented_domains
)
planned_schema_refs_present = all(
    isinstance(planned_domains.get(name, {}), dict)
    and len((planned_domains.get(name, {}) or {}).get('schema_refs', []) or []) > 0
    for name in expected_planned_domains if name in planned_domains
)

tenancy_partitioning = root.get('tenancy_partitioning', {}) if isinstance(root, dict) else {}
retention_classes = root.get('retention_classes', {}) if isinstance(root, dict) else {}

partitioning_present = (
    isinstance(tenancy_partitioning, dict)
    and len(tenancy_partitioning.get('required_partition_keys', []) or []) > 0
    and isinstance(tenancy_partitioning.get('entity_partition_rules', {}), dict)
    and len(tenancy_partitioning.get('entity_partition_rules', {})) > 0
)
retention_present = (
    isinstance(retention_classes, dict)
    and isinstance(retention_classes.get('classes', {}), dict)
    and len(retention_classes.get('classes', {})) > 0
    and isinstance(retention_classes.get('entity_class_mapping', {}), dict)
    and len(retention_classes.get('entity_class_mapping', {})) > 0
)

report = {
    'timestamp_utc': datetime.now(timezone.utc).isoformat(),
    'model_file': str(model_path).replace('\\\\', '/'),
    'yaml_parse': {
        'data_model': isinstance(model, dict),
    },
    'required_field_checks': {
        'top_level_sections_present': len(missing_top_level) == 0,
        'missing_top_level_sections': missing_top_level,
        'canonical_entities_implemented_present': isinstance(implemented_entities, dict) and len(implemented_entities) > 0,
        'canonical_entities_planned_present': isinstance(planned_entities, dict) and len(planned_entities) > 0,
        'implemented_schema_domains_present': len(missing_implemented_domains) == 0,
        'missing_implemented_schema_domains': missing_implemented_domains,
        'planned_schema_domains_present': len(missing_planned_domains) == 0,
        'missing_planned_schema_domains': missing_planned_domains,
        'implemented_schema_refs_present': implemented_schema_refs_present,
        'planned_schema_refs_present': planned_schema_refs_present,
        'tenancy_partitioning_policy_present': partitioning_present,
        'retention_class_policy_present': retention_present,
    },
}

all_pass = all([
    report['yaml_parse']['data_model'],
    report['required_field_checks']['top_level_sections_present'],
    report['required_field_checks']['canonical_entities_implemented_present'],
    report['required_field_checks']['canonical_entities_planned_present'],
    report['required_field_checks']['implemented_schema_domains_present'],
    report['required_field_checks']['planned_schema_domains_present'],
    report['required_field_checks']['implemented_schema_refs_present'],
    report['required_field_checks']['planned_schema_refs_present'],
    report['required_field_checks']['tenancy_partitioning_policy_present'],
    report['required_field_checks']['retention_class_policy_present'],
])

report['overall_pass'] = all_pass

out_path = Path('planning/validation-issue-20-structural-check.json')
out_path.write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))

if not all_pass:
    raise SystemExit(1)
"@; py -c $script
```

### Result

- Output file generated: `planning/validation-issue-20-structural-check.json`
- `overall_pass: true`
- YAML parse checks: pass
- Required top-level section checks: pass
- Implemented/planned schema coverage checks: pass
- Retention and partitioning policy checks: pass

## Acceptance Criteria Mapping

| Criterion                                                                        | Evidence                                                                                                                                                                                                                                             | Status |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1. `.github/.system-state/data/data_model.yaml` exists and is machine-readable   | File created and validated by deterministic YAML parse in `planning/validation-issue-20-structural-check.json`                                                                                                                                       | PASS   |
| 2. Model covers implemented + planned schema domains                             | `schema_domains.implemented` includes `capability-registry`, `policy-engine`, `recipe-executor`, `digital-twin`; `schema_domains.planned` includes `dispatch`, `wms-wcs-connectors`, `asr`, `cv`, `edge-adapters`; validation JSON confirms presence | PASS   |
| 3. Partitioning and retention sections are explicit and testable                 | `tenancy_partitioning` and `retention_classes` sections are present with required keys and entity mappings; structural checks pass                                                                                                                   | PASS   |
| 4. Validation evidence demonstrates deterministic structural checks with outputs | This file includes reproducible command and results, and generated JSON output artifact captures pass/fail details                                                                                                                                   | PASS   |
| 5. Scope remains strictly bounded to Issue #20                                   | Changed files are limited to data model + validation artifacts; no `packages/` or `services/` runtime changes                                                                                                                                        | PASS   |

## Scope-Boundary Verification

No runtime service code, package manifests, or unrelated refactors were
introduced as part of Issue #20 implementation slice.

## Risk Notes

- Low risk: model is currently declarative and scoped to governance artifacts
  only.
- Mitigation: deterministic structural checks enforce required sections and
  coverage expectations before validator handoff.
