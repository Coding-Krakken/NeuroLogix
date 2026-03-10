# Repository Boundaries

## Boundary Contract

During normal issue execution:

- framework internals under `.github/` are read-only
- agents edit only product/repository files outside `.github/`

## Framework Maintenance Path

Framework files may be changed only through dedicated framework-maintenance work:

1. dedicated issue
2. dedicated branch
3. dedicated PR
4. full policy-compliant review and merge

## Why This Boundary Exists

- prevents policy drift during feature delivery
- preserves deterministic behavior and auditability
- keeps framework portable and reusable

## Violation Handling

If a normal run requires framework change to proceed safely:

- stop direct execution path for that issue
- create framework-maintenance issue
- create blocked record and link both issues
- continue with next eligible issue
