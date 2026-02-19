# Developer Notes - Reward Tokens Implementation

## Implementation Overview

This document contains technical notes and considerations for developers working with the reward tokens system.

## Architecture Decisions

### 1. Database-Level Token Awards
**Decision**: Use database triggers instead of application-level logic  
**Rationale**:
- Ensures tokens are always awarded, even if order is updated manually
- Prevents duplicate awards (trigger checks if status was already "served")
- Atomic operation - no race conditions
- Works regardless of which system updates the order (admin panel, API, etc.)

**Trade-off**: Slightly less flexible than application logic, but more reliable

### 2. Token Storage as Decimal
**Decision**: Store tokens as `DECIMAL(10, 2)` instead of integer  
**Rationale**:
- Allows for fractional tokens (e.g., ₦0.50)
- More accurate for percentage calculations
- Future-proof for promotional multipliers (e.g., 1.5x tokens)

**Note**: Always use 2 decimal places in UI for consistency

### 3. Separate Token Payment Amount Field
**Decision**: Add `token_payment_amount` to orders instead of just using payment_method  
**Rationale**:
- Tracks exact amount paid with tokens
- Supports partial token payments (tokens + cash/transfer)
- Provides audit trail
- Enables analytics on token usage

### 4. Customer ID in Orders
**Decision**: Link orders to customer profiles via `customer_id`  
**Rationale**:
- Required for token tracking
- Enables customer analytics
- Supports multi-device sync
- Optional field - doesn't break existing orders

## Code Patterns

### Token Balance Calculation
```typescript
// Always use this pattern for token calculations
const availableTokens = customer?.reward_tokens || 0
const maxTokensToUse = Math.min(availableTokens, orderTotal)
const actualTokenAmount = useTokens ? tokenAmount : 0
const finalTotal = orderTotal - actualTokenAmount
```

### Token Deduction Validation
```typescript
// Server-side validation is critical
if (currentBalance < token_amount) {
  return NextResponse.json(
    { error: "Insufficient token balance", success: false },
    { status: 400 }
  )
}
```

### Order Submission with Tokens
```typescript
const orderData = {
  // ... other fields
  customerId: customer?.id, // Required for token tracking
  tokenPaymentAmount: actualTokenAmount, // Amount paid with tokens
  paymentMethod: finalTotal === 0 ? "tokens" : paymentMethod, // Set to "tokens" if fully paid
}
```

## Database Considerations

### Indexing
```sql
-- Added indexes for performance
CREATE INDEX idx_customers_reward_tokens ON customers(reward_tokens);
CREATE INDEX idx_orders_token_payment ON orders(token_payment_amount) WHERE token_payment_amount > 0;
```

**Rationale**: 
- Fast queries for customers with tokens
- Efficient analytics on token usage
- Minimal storage overhead (partial index on token_payment)

### Trigger Performance
The `award_order_tokens()` trigger is efficient because:
- Only fires on UPDATE (not INSERT)
- Checks conditions before executing
- Single UPDATE query
- No complex joins or subqueries

**Estimated overhead**: < 1ms per order update

### Concurrency
Token deduction uses standard PostgreSQL transaction isolation:
```sql
-- Atomic operation prevents race conditions
UPDATE customers
SET reward_tokens = reward_tokens - token_amount
WHERE id = customer_id;
```

**Note**: No explicit locking needed - PostgreSQL handles this

## API Design

### Token Deduction Endpoint
```typescript
POST /api/customers/[customerId]/use-tokens
Body: { token_amount: number }
Response: { success: boolean, new_balance: number }
```

**Design choices**:
- Separate endpoint for token operations (single responsibility)
- Returns new balance for immediate UI update
- Validates balance server-side
- Returns clear error messages

### Customer Data Loading
```typescript
// Use the existing customer profile hook
const { customer, refreshCustomerData } = useCustomerProfile()

// Refresh after token usage
if (useTokens) {
  refreshCustomerData()
}
```

**Pattern**: Leverage existing hooks instead of creating new ones

## UI/UX Patterns

### Token Toggle + Slider
```typescript
// Toggle enables/disables token usage
const [useTokens, setUseTokens] = useState(false)

// Slider adjusts amount (0 to maxTokensToUse)
const [tokenAmount, setTokenAmount] = useState(0)

// Auto-set to max when enabled
useEffect(() => {
  if (useTokens && maxTokensToUse > 0) {
    setTokenAmount(maxTokensToUse)
  } else {
    setTokenAmount(0)
  }
}, [useTokens, maxTokensToUse])
```

**Rationale**: 
- Toggle provides clear on/off state
- Slider gives fine-grained control
- Auto-max is user-friendly default

### Real-time Calculations
```typescript
// Recalculate on every change
const subtotal = total + deliveryFee
const actualTokenAmount = useTokens ? tokenAmount : 0
const finalTotal = subtotal - actualTokenAmount
```

**Pattern**: Derived state instead of stored state - always accurate

### Number Formatting
```typescript
// Always format currency with 2 decimals
₦{amount.toLocaleString('en-NG', { 
  minimumFractionDigits: 2, 
  maximumFractionDigits: 2 
})}
```

**Consistency**: Use this pattern everywhere for tokens and money

## Testing Strategies

### Unit Tests (Recommended)
```typescript
// Test token calculation
test('calculates 2% tokens correctly', () => {
  const orderTotal = 1000
  const expectedTokens = 20
  expect(calculateTokens(orderTotal)).toBe(expectedTokens)
})

// Test token validation
test('prevents negative balance', () => {
  const balance = 50
  const amount = 100
  expect(canUseTokens(balance, amount)).toBe(false)
})
```

### Integration Tests
```sql
-- Test trigger
BEGIN;
  INSERT INTO orders (...) VALUES (...);
  UPDATE orders SET status = 'served', payment_status = 'paid' WHERE id = ...;
  SELECT reward_tokens FROM customers WHERE id = ...;
  -- Should show increased balance
ROLLBACK;
```

### E2E Tests (Recommended)
1. Create customer profile
2. Place order
3. Complete order (admin panel)
4. Verify tokens awarded
5. Place new order
6. Use tokens in checkout
7. Verify balance updated

## Performance Considerations

### Database Queries
- Token balance: Single SELECT on customers table (indexed)
- Token deduction: Single UPDATE on customers table
- Order creation: Standard INSERT (no additional overhead)

**Estimated impact**: < 5ms per operation

### UI Rendering
- Token display: Minimal re-renders (memoized calculations)
- Slider: Debounced updates (smooth UX)
- Balance refresh: Only after token usage

**Estimated impact**: Negligible

### Network Requests
- Token balance: Loaded with customer profile (no extra request)
- Token deduction: Single POST request on order submission
- Balance refresh: Single GET request after order

**Estimated impact**: 1-2 additional requests per order with tokens

## Security Considerations

### Server-Side Validation
```typescript
// ALWAYS validate on server
if (!token_amount || token_amount <= 0) {
  return error("Invalid token amount")
}

if (currentBalance < token_amount) {
  return error("Insufficient balance")
}
```

**Critical**: Never trust client-side calculations

### SQL Injection Prevention
```typescript
// Use parameterized queries (Supabase handles this)
await supabase
  .from("customers")
  .update({ reward_tokens: newBalance })
  .eq("id", customerId) // Parameterized
```

**Note**: Supabase client library prevents SQL injection

### Authorization
```typescript
// Verify customer owns the profile
const { data: customer } = await supabase
  .from("customers")
  .select("*")
  .eq("id", customerId)
  .single()

if (!customer) {
  return error("Unauthorized")
}
```

**Pattern**: Always verify ownership before token operations

## Migration Strategy

### Backward Compatibility
- New columns have default values (0.00)
- Existing orders work without token fields
- Customer ID is optional in orders
- Payment method "tokens" is additive (doesn't break existing methods)

### Rollback Plan
```sql
-- If needed, rollback is simple
ALTER TABLE customers DROP COLUMN reward_tokens;
ALTER TABLE orders DROP COLUMN token_payment_amount;
DROP TRIGGER trigger_award_order_tokens ON orders;
DROP FUNCTION award_order_tokens();
DROP FUNCTION deduct_customer_tokens(uuid, decimal);
```

**Note**: Backup database before migration!

## Monitoring & Observability

### Key Metrics to Track
```sql
-- Daily token awards
SELECT DATE(created_at), SUM(total_amount * 0.02) as tokens_awarded
FROM orders
WHERE status = 'served' AND payment_status = 'paid'
GROUP BY DATE(created_at);

-- Daily token usage
SELECT DATE(created_at), SUM(token_payment_amount) as tokens_used
FROM orders
WHERE token_payment_amount > 0
GROUP BY DATE(created_at);

-- Token liability (total outstanding)
SELECT SUM(reward_tokens) as total_liability FROM customers;
```

### Error Monitoring
```typescript
// Log token-related errors
console.error("[TokenSystem] Error:", {
  operation: "deduct_tokens",
  customerId,
  amount,
  error: error.message
})
```

**Pattern**: Prefix logs with [TokenSystem] for easy filtering

## Future Enhancements

### 1. Token Expiry
```sql
-- Add expiry tracking
ALTER TABLE customers ADD COLUMN token_expiry_date TIMESTAMP;

-- Cleanup expired tokens
CREATE FUNCTION expire_old_tokens() ...
```

### 2. Token Transaction History
```sql
-- Create transaction log
CREATE TABLE token_transactions (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  amount DECIMAL(10, 2),
  type TEXT, -- 'earned' or 'used'
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP
);
```

### 3. Promotional Multipliers
```sql
-- Add multiplier to customers
ALTER TABLE customers ADD COLUMN token_multiplier DECIMAL(3, 2) DEFAULT 1.00;

-- Update trigger to use multiplier
token_amount := NEW.total_amount * 0.02 * multiplier;
```

### 4. Token Gifting
```typescript
// New API endpoint
POST /api/customers/[customerId]/gift-tokens
Body: { recipient_id: string, amount: number }
```

## Common Pitfalls

### ❌ Don't: Calculate tokens client-side only
```typescript
// BAD - can be manipulated
const tokens = orderTotal * 0.02
await submitOrder({ tokens })
```

### ✅ Do: Calculate server-side
```sql
-- GOOD - trigger calculates automatically
token_amount := NEW.total_amount * 0.02;
```

### ❌ Don't: Forget to refresh customer data
```typescript
// BAD - UI shows stale balance
await submitOrder(orderData)
router.push('/order/success')
```

### ✅ Do: Refresh after token usage
```typescript
// GOOD - UI shows updated balance
await submitOrder(orderData)
refreshCustomerData()
router.push('/order/success')
```

### ❌ Don't: Allow negative balances
```typescript
// BAD - no validation
await updateBalance(customerId, -amount)
```

### ✅ Do: Validate before deduction
```typescript
// GOOD - check balance first
if (currentBalance < amount) {
  throw new Error("Insufficient balance")
}
```

## Code Review Checklist

When reviewing token-related code:
- [ ] Server-side validation present
- [ ] Balance checked before deduction
- [ ] Customer ID included in orders
- [ ] Token amount recorded in orders
- [ ] UI refreshes after token operations
- [ ] Error handling implemented
- [ ] Numbers formatted consistently
- [ ] No hardcoded token percentage
- [ ] Logging added for debugging
- [ ] Tests included

## Deployment Checklist

Before deploying to production:
- [ ] Database migration tested in staging
- [ ] Rollback plan documented
- [ ] Monitoring queries prepared
- [ ] Error logging configured
- [ ] Performance tested with load
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Team trained on new system
- [ ] Customer communication prepared
- [ ] Support team briefed

## Support Scenarios

### Customer: "I didn't receive my tokens"
**Debug steps**:
1. Check order status: `SELECT status, payment_status FROM orders WHERE id = ?`
2. Check if customer_id is set: `SELECT customer_id FROM orders WHERE id = ?`
3. Check trigger fired: Look for NOTICE in logs
4. Manually award if needed: `UPDATE customers SET reward_tokens = reward_tokens + X`

### Customer: "My token balance is wrong"
**Debug steps**:
1. Calculate expected: `SELECT SUM(total_amount * 0.02) FROM orders WHERE customer_id = ? AND status = 'served'`
2. Check actual: `SELECT reward_tokens FROM customers WHERE id = ?`
3. Check usage: `SELECT SUM(token_payment_amount) FROM orders WHERE customer_id = ?`
4. Reconcile: expected - usage should equal actual

### Customer: "Token payment failed"
**Debug steps**:
1. Check balance: `SELECT reward_tokens FROM customers WHERE id = ?`
2. Check API logs for errors
3. Verify customer ID in request
4. Check network connectivity
5. Retry with lower amount

## Conclusion

The reward tokens system is designed to be:
- **Reliable**: Database triggers ensure consistency
- **Secure**: Server-side validation prevents abuse
- **Performant**: Minimal overhead on existing operations
- **Maintainable**: Clear code patterns and documentation
- **Scalable**: Efficient queries and indexes

Follow these patterns and considerations for successful implementation and maintenance.

---

*For questions or clarifications, refer to the other documentation files or contact the development team.*
