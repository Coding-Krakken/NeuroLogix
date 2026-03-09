# ADR-001: Monorepo Structure

## Status

Accepted

## Context

NeuroLogix is a complex enterprise system with multiple applications, shared
libraries, services, and infrastructure components. We need to decide on the
optimal code organization strategy that supports:

- Developer productivity and collaboration
- Code sharing and reuse
- Independent deployment of services
- Consistent tooling and standards
- CI/CD pipeline efficiency
- Dependency management

## Decision

We will use a monorepo structure with the following organization:

```
neurologix/
├── apps/           # End-user applications
├── packages/       # Shared libraries
├── services/       # Backend microservices
├── infrastructure/ # IaC and deployment configs
├── docs/          # Documentation
└── tools/         # Development tools
```

We will use:

- **Turbo** for build orchestration and caching
- **npm workspaces** for dependency management
- **TypeScript project references** for incremental builds
- **Changesets** for versioning and releases

## Rationale

### Benefits:

1. **Atomic Changes**: Changes spanning multiple packages/services can be made
   in a single commit
2. **Shared Tooling**: Consistent linting, formatting, and build processes
   across all code
3. **Simplified Dependency Management**: Internal dependencies always use the
   latest version
4. **Better CI/CD**: Single pipeline can build and test all components with
   proper dependency ordering
5. **Code Discovery**: Easier to find and understand related code
6. **Refactoring Safety**: Cross-package refactoring is safer and more
   straightforward

### Trade-offs:

1. **Repository Size**: Will grow large over time, but modern Git handles this
   well
2. **Learning Curve**: Developers need to understand monorepo tooling
3. **Checkout Time**: Initial clone is slower, but day-to-day development is
   faster

## Consequences

### Easier:

- Cross-package refactoring
- Ensuring API compatibility
- Sharing types and utilities
- Coordinated releases
- Consistent development practices

### More Difficult:

- Individual service deployment (mitigated by proper CI/CD)
- Partial repository access (not needed for this project)

### Risks:

- Build system complexity (mitigated by using proven tools like Turbo)
- Potential for tight coupling (addressed through clear package boundaries)

## Alternatives Considered

### Multi-repo (Rejected)

- **Pros**: Clear service boundaries, independent versioning
- **Cons**: Complex dependency management, difficult cross-service changes,
  tooling duplication
- **Rejected because**: The tight integration between components makes atomic
  changes valuable

### Hybrid approach (Rejected)

- **Pros**: Flexibility to choose per component
- **Cons**: Inconsistent tooling, complexity in orchestration
- **Rejected because**: Adds unnecessary complexity without clear benefits

## References

- [Turbo Documentation](https://turbo.build/)
- [npm Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Changesets](https://github.com/changesets/changesets)
