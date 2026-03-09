# Contributing to NeuroLogix

## Overview

NeuroLogix is a mission-critical enterprise system. All contributions must meet
the highest standards for safety, security, reliability, and maintainability.

## Development Principles

1. **Safety First**: Never bypass safety systems or interlocks
2. **Security by Design**: Every component must be secure by default
3. **Observable**: All changes must include appropriate logging and metrics
4. **Testable**: All code must have comprehensive tests
5. **Documented**: All changes must include documentation updates

## Getting Started

### Prerequisites

- Node.js 20.10.0+ (use Volta for version management)
- Docker 24.0+ with Compose V2
- Git with commit signing configured
- Understanding of industrial automation systems (preferred)

### Setup

```bash
# Clone the repository
git clone https://github.com/Coding-Krakken/NeuroLogix.git
cd NeuroLogix

# Install dependencies
npm install

# Set up git hooks
npm run prepare

# Start development environment
npm run dev
```

## Code Standards

### TypeScript

- Use strict mode TypeScript configuration
- Prefer explicit types over `any`
- Use Zod for runtime validation
- Follow the existing naming conventions

### Security

- Never commit secrets or sensitive data
- Use environment variables for configuration
- Validate all inputs
- Follow OWASP security guidelines

### Testing

- Unit tests: ≥90% coverage for core modules
- Integration tests for service boundaries
- E2E tests for critical user workflows
- Security tests for authentication/authorization

### Documentation

- Update ADRs for architectural decisions
- Include JSDoc comments for public APIs
- Update README files for package changes
- Document deployment and operational procedures

## Workflow

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature branches
- `hotfix/*`: Production hotfixes

### Commit Messages

Follow conventional commits:

```
feat: add capability registry service
fix: resolve authentication token expiry
docs: update API documentation
security: implement rate limiting
```

### Pull Request Process

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow coding standards
   - Add tests
   - Update documentation

3. **Run Quality Checks**

   ```bash
   npm run lint
   npm run test
   npm run type-check
   npm run security:audit
   ```

4. **Create Pull Request**
   - Use descriptive title and description
   - Reference related issues
   - Include testing instructions
   - Add screenshots for UI changes

5. **Code Review**
   - At least one approval from core team member
   - Security review for security-related changes
   - Architecture review for significant changes

6. **Merge**
   - Squash commits for clean history
   - Ensure CI/CD passes
   - Delete feature branch after merge

## Code Review Guidelines

### What to Look For

#### Security

- Input validation and sanitization
- Authentication and authorization
- Secure communication protocols
- Error handling without information leakage

#### Safety

- Proper handling of industrial control systems
- Fail-safe mechanisms
- Emergency stop procedures
- Audit trail completeness

#### Performance

- Response time requirements
- Resource usage optimization
- Scalability considerations
- Database query efficiency

#### Maintainability

- Code readability and clarity
- Proper abstraction and modularity
- Comprehensive error handling
- Adequate logging and monitoring

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are comprehensive and passing
- [ ] Documentation is updated
- [ ] Security considerations are addressed
- [ ] Performance impact is acceptable
- [ ] Error handling is robust
- [ ] Logging and monitoring are adequate
- [ ] Breaking changes are documented

## Release Process

### Versioning

We follow semantic versioning (SemVer):

- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes (backwards compatible)

### Release Steps

1. **Prepare Release**

   ```bash
   npm run changeset
   npm run version-packages
   ```

2. **Quality Gates**
   - All tests pass
   - Security scan clean
   - Performance benchmarks met
   - Documentation complete

3. **Deploy**
   ```bash
   npm run release
   ```

## Environment Setup

### Development

- Local development with hot reload
- Mock external services
- Test data and fixtures

### Staging

- Production-like environment
- Integration with external systems
- Performance testing

### Production

- High availability setup
- Full monitoring and alerting
- Disaster recovery procedures

## Architecture Guidelines

### Service Design

- Follow domain-driven design principles
- Implement proper error boundaries
- Use appropriate design patterns
- Consider scalability from the start

### API Design

- RESTful endpoints where appropriate
- GraphQL for complex data fetching
- Real-time updates via WebSocket/SSE
- Comprehensive input validation

### Database Design

- Normalize data appropriately
- Use indexes for performance
- Implement proper backup strategies
- Consider data retention policies

### Security Architecture

- Zero-trust network model
- Defense in depth strategy
- Principle of least privilege
- Regular security assessments

## Support

### Getting Help

- GitHub Discussions for general questions
- GitHub Issues for bugs and feature requests
- Internal Slack channels for team communication
- Architecture review meetings for design decisions

### Emergency Procedures

For security vulnerabilities or critical issues:

1. Create private issue or contact security team
2. Do not publicly disclose until patched
3. Follow responsible disclosure guidelines

## License

This project is proprietary. By contributing, you agree that your contributions
will be licensed under the same terms as the project.
