# API Contract Design

> **Category:** Architecture
> **File:** `architecture/api-contract.prompt.md`

---

## Purpose

Define complete API contracts: endpoints, request/response schemas, error codes, authentication, rate limits, and versioning.

## When to Use

- Designing new API endpoints
- Modifying existing API behavior
- Integrating with external APIs
- Backend-frontend contract definition

## Inputs Required

- Domain model
- User stories (what operations are needed)
- External API documentation (if integrating)
- Performance requirements

## Outputs Required

Per endpoint:

```yaml
Endpoint: /api/products
Method: GET
Authentication: None (public)
Rate Limit: 100 req/min

Query Parameters:
  - category: string (optional, filter by category slug)
  - search: string (optional, full-text search)
  - limit: number (optional, default 20, max 100)
  - cursor: string (optional, pagination cursor)

Response 200:
  schema:
    products: Product[]
    cursor: string | null
    total: number

Response 400:
  schema:
    error:
      code: 'INVALID_PARAMETERS'
      message: string
      details: ValidationError[]

Response 500:
  schema:
    error:
      code: 'INTERNAL_ERROR'
      message: 'An unexpected error occurred'
```

Plus:

- Zod schema definitions
- TypeScript types
- Error code catalog

## Quality Expectations

- Every endpoint has success AND error responses defined
- All inputs have validation rules
- Error codes are documented and consistent
- Response shapes are typed (Zod + TypeScript)

## Failure Cases

- Missing error responses → Add error schemas for 400, 401, 404, 500
- Unvalidated inputs → Add Zod schema for all query/body params

## Evidence Expectations

- OpenAPI-compatible specification
- Zod schema code
- TypeScript interface code
- Error code catalog
