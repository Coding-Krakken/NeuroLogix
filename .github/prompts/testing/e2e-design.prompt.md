# E2E Test Design

> **Category:** Testing
> **File:** `testing/e2e-design.prompt.md`

---

## Purpose

Design end-to-end test scenarios for critical user journeys. Define test scripts for Playwright that cover the most important paths through the application.

## When to Use

- Setting up E2E testing for the first time
- Adding E2E coverage for new critical paths
- Before production deployment
- After major UI changes

## Inputs Required

- User journeys (from UX Designer / Product Owner)
- Page structure (routes)
- Critical business flows (checkout, search, browse)
- Known error scenarios

## Outputs Required

````markdown
## E2E Test Plan

### Critical Journeys (Must Have)

#### Journey 1: Browse → Product → Cart → Checkout

```typescript
test('complete purchase flow', async ({ page }) => {
  // 1. Browse products
  await page.goto('/products')
  await expect(page.getByRole('heading', { name: /products/i })).toBeVisible()

  // 2. Click product
  await page.getByRole('link', { name: /product-name/i }).click()
  await expect(page).toHaveURL(/\/products\//)

  // 3. Add to cart
  await page.getByRole('button', { name: /add to cart/i }).click()
  await expect(page.getByRole('status')).toContainText(/added/i)

  // 4. Go to cart
  await page.getByRole('link', { name: /cart/i }).click()
  await expect(page.getByRole('heading', { name: /cart/i })).toBeVisible()

  // 5. Proceed to checkout
  await page.getByRole('button', { name: /checkout/i }).click()
  // ... payment flow (<PAYMENT_PROVIDER> iframe)
})
```
````

### Error Path Journeys

- Product not found → 404 page
- Cart empty → Empty cart message
- Payment declined → Error message
- Network error → Error boundary

### Performance Journeys

- Page load time assertions
- Image loading verification

```

## Quality Expectations

- Use role-based selectors (accessibility-first)
- Test user behavior, not implementation
- Cover happy + error + edge paths
- Include performance assertions where applicable
- Tests are independent (no shared state)

## Failure Cases

- No test infrastructure → Install Playwright first
- Flaky tests → Use proper waits, not arbitrary sleeps

## Evidence Expectations

- Test file paths
- Journey descriptions
- Pass/fail results
- Screenshot captures on failure
```

