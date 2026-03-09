# Domain Model Design

> **Category:** Architecture
> **File:** `architecture/domain-model.prompt.md`

---

## Purpose

Define the domain model for a feature or system: entities, relationships, invariants, state machines, and business rules. This model is the source of truth that code must mirror.

## When to Use

- Before implementing any new feature
- When Solution Architect is designing a system
- When refactoring domain logic
- When reviewing model-code consistency

## Inputs Required

- User stories with acceptance criteria
- Business domain knowledge
- Existing domain model (if extending)
- External API schemas (e.g., <PAYMENT_PROVIDER>)

## Outputs Required

1. **Entity Definitions**

   ```yaml
   Entity: Product
   Fields:
     - id: string (<PAYMENT_PROVIDER> catalog ID)
     - name: string (required, non-empty)
     - description: string (optional)
     - price: Money (amount + currency)
     - category: CategoryRef
     - images: Image[] (0..N)
     - status: ProductStatus
   Invariants:
     - price.amount >= 0
     - name.length > 0
     - name.length <= 255
   ```

2. **Relationship Map**
   - Cardinality (1:1, 1:N, N:M)
   - Required vs optional
   - Direction

3. **State Machine** (if applicable)

   ```
   States: [Draft, Active, Archived]
   Transitions:
     Draft → Active: publish()
     Active → Archived: archive()
     Archived → Active: restore()
   Guards:
     publish: hasPrice AND hasName AND hasCategory
   Forbidden:
     Draft → Archived (must publish first)
   ```

4. **Invariants** (system rules that must always hold)

5. **TypeScript Rendering** (how model becomes code)

## Quality Expectations

- Complete — no undefined states or transitions
- Consistent — no contradictory rules
- Testable — every invariant can be verified
- Traceable — every entity maps to a business concept
- Minimal — no speculative entities

## Failure Cases

- Entity has no invariants → Add at minimum field constraints
- State machine has unreachable states → Remove or connect them
- Circular relationships → Review and simplify

## Evidence Expectations

- YAML or structured model definition
- TypeScript interface rendering
- State diagram (Mermaid)
- Invariant test specifications

## Example Output

```typescript
// Generated from domain model
export interface Product {
  id: string
  name: string
  description?: string
  price: Money
  category: CategoryRef
  images: Image[]
  status: ProductStatus
}

export interface Money {
  amount: number // in smallest unit (cents)
  currency: string // ISO 4217
}

export type ProductStatus = 'draft' | 'active' | 'archived'
```

