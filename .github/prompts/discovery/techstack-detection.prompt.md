# Tech Stack Detection

> **Category:** Discovery
> **File:** `discovery/techstack-detection.prompt.md`

---

## Purpose

Automatically detect and catalog the complete technology stack of a repository, including frameworks, libraries, build tools, testing tools, deployment targets, and runtime requirements.

## When to Use

- Before starting work on unfamiliar codebase
- When Solution Architect needs stack context for design
- When evaluating dependency additions
- During migration planning

## Inputs Required

- Repository root access
- package.json (or equivalent manifest)
- Configuration files (tsconfig, next.config, etc.)
- CI/CD workflow files

## Outputs Required

Produce a structured technology inventory:

1. **Runtime:** Node.js version, browser targets
2. **Framework:** Name, version, configuration notes
3. **Language:** TypeScript/JavaScript, config, strict mode status
4. **UI Library:** React version, rendering strategy (SSR/SSG/CSR)
5. **Styling:** CSS framework, methodology
6. **State Management:** Client state, server state approach
7. **API Layer:** REST/GraphQL, SDK usage, external services
8. **Testing:** Framework, libraries, coverage tool
9. **Build Tools:** Bundler, transpiler, asset pipeline
10. **CI/CD:** Platform, pipeline stages, quality gates
11. **Deployment:** Platform, regions, CDN
12. **Dev Tooling:** Linters, formatters, git hooks, editor config

## Quality Expectations

- Version numbers included for all major dependencies
- Configuration special notes (e.g., "strict mode enabled")
- Detect actual usage patterns (not just installed packages)
- Flag deprecated or EOL dependencies

## Failure Cases

- No package manifest → Check for other manifest types (pyproject.toml, Cargo.toml, etc.)
- Mixed tech stack → Document all detected technologies
- Cannot determine version → Mark as "version unknown"

## Evidence Expectations

- Package.json entries with versions
- Config file references
- Import statement analysis for actual usage

## Example Output

```markdown
| Layer     | Technology     | Version | Config Notes                         |
| --------- | -------------- | ------- | ------------------------------------ |
| Runtime   | Node.js        | 20.x    | (from CI workflow)                   |
| Framework | Next.js        | 16.1.6  | App Router, strict mode              |
| Language  | TypeScript     | 5.6.3   | strict: true                         |
| UI        | React          | 19.2.4  | Server + Client Components           |
| Styling   | Tailwind CSS   | 3.4.19  | + prettier plugin                    |
| State     | Zustand        | 4.5.7   | Client state                         |
| API       | Square SDK     | 44.0.0  | Payments, Catalog, Orders            |
| Testing   | Jest           | 29.7.0  | + RTL + jest-dom                     |
| CI        | GitHub Actions | -       | lint, format, typecheck, test, build |
| Deploy    | Vercel         | -       | Region: iad1                         |
```
