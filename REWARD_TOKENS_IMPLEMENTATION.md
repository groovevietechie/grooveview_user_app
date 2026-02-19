# Reward Tokens System Implementation

## Overview
This document describes the implementation of a reward tokens system that allows customers to earn and use tokens for purchases across all their linked devices.

## Features

### 1. Token Earning System
- Customers earn **2% tokens** on every completed order (status: "served", payment_status: "paid")
- **1 token = ₦1 (1 Naira)**
- Tokens are automatically awarded when orders are marked as completed
- Tokens accumulate across all linked devices in the customer profile

### 2. Token Display
- Tokens are displayed prominently in the Device Sync Modal
- Shows current token balance with proper formatting
- Includes helpful information about earning and using tokens

### 3. Token Payment
- Customers can use tokens to pay for orders (full or partial payment)
- Token payment option available in checkout page
- Slider interface to adjust token amount to use
- Real-time calculation of remaining payment after token usage
- If order is fully paid with tokens, payment method is set to "tokens"

### 4. Token Tracking
- All token transactions are tracked in the database
- Orders record the amount paid with tokens in `token_payment_amount` field
- Customer token balance is updated in real-time

## Database Changes

### Migration File: `database_migration_reward_tokens.sql`

#### New Columns:
1. **customers.reward_tokens** (DECIMAL(10, 2))
   - Stores customer's token balance
   - Default: 0.00
   - 1 token = 1 Naira

2. **orders.token_payment_amount** (DECIMAL(10, 2))
   - Tracks amount paid using tokens for each order
   - Default: 0.00

#### New Functions:
1. **award_order_tokens()** - Trigger function
   - Automatically awards 2% tokens when order status changes to "served"
   - Only awards if payment_status is "paid"
   - Updates customer's reward_tokens balance

2. **deduct_customer_tokens(customer_id, token_amount)** - Utility function
   - Validates customer has sufficient tokens
   - Deducts tokens from customer balance
   - Returns boolean success status

#### New Triggers:
- **trigger_award_order_tokens** on orders table
  - Fires AFTER UPDATE
  - Calls award_order_tokens() function

## Code Changes

### 1. Type Definitions (`src/types/database.ts`)
```typescript
// Updated Customer interface
export interface Customer {
  id: string
  sync_passcode: string
  reward_tokens: number // NEW: Token balance
  created_at: string
  updated_at: string
}

// Updated Order interface
export interface Order {
  // ... existing fields
  token_payment_amount?: number // NEW: Amount paid with tokens
}

// Updated PaymentMethod type
export type PaymentMethod = "cash" | "card" | "mobile" | "transfer" | "tokens"

// Updated OrderSubmission interface
export interface OrderSubmission {
  // ... existing fields
  customerId?: string // NEW: For token tracking
  tokenPaymentAmount?: number // NEW: Token payment amount
}
```

### 2. Customer API (`src/lib/customer-api.ts`)
New functions:
- `getCustomerTokenBalance(customerId)` - Get current token balance
- `useTokensForPayment(customerId, tokenAmount)` - Deduct tokens for payment

### 3. API Routes
New endpoint: `src/app/api/customers/[customerId]/use-tokens/route.ts`
- POST endpoint to deduct tokens
- Validates sufficient balance
- Returns new balance after deduction

### 4. Device Sync Modal (`src/components/DeviceSyncModal.tsx`)
- Added token balance display with currency icon
- Shows formatted token amount (₦X,XXX.XX)
- Includes helpful tips about earning and using tokens

### 5. Checkout Page (`src/components/CheckoutPage.tsx`)
Major updates:
- Integrated `useCustomerProfile` hook to access customer data
- Added token payment toggle switch
- Added token amount slider for partial payments
- Real-time calculation of final amount after token usage
- Updated order submission to include customer ID and token amount
- Refreshes customer data after token usage to update balance

### 6. Order Submission (`src/lib/api.ts`)
Updated `submitOrder` function:
- Accepts `customerId` and `tokenPaymentAmount` in order data
- Sets payment_status to "paid" for token payments
- Sets payment_method to "tokens" if order is fully paid with tokens
- Includes token amount in order record

## User Flow

### Earning Tokens
1. Customer places an order through any linked device
2. Order is processed and completed by business (status: "served")
3. Payment is confirmed (payment_status: "paid")
4. System automatically calculates 2% of order total
5. Tokens are added to customer's account
6. Tokens are available immediately across all linked devices

### Using Tokens
1. Customer adds items to cart and proceeds to checkout
2. If customer has a profile with tokens, token payment option appears
3. Customer toggles "Use Reward Tokens" switch
4. Slider appears showing available tokens
5. Customer adjusts slider to select token amount to use
6. Order summary updates to show:
   - Token amount being used
   - Remaining amount to pay
   - Savings message
7. Customer completes order
8. Tokens are deducted from balance
9. Order is placed with token payment recorded

## UI/UX Features

### Device Sync Modal
- Prominent token balance display at the top
- Currency icon for visual recognition
- Formatted amount with 2 decimal places
- Informative messages about earning and usage

### Checkout Page
- Clean toggle switch for enabling token payment
- Interactive slider for amount selection
- Real-time calculations and updates
- Visual feedback with color-coded sections:
  - Blue for token information
  - Green for savings confirmation
- Clear breakdown of:
  - Subtotal
  - Delivery fee (if applicable)
  - Token discount
  - Final amount to pay

### Submit Button
- Dynamic text based on payment method:
  - "Place Order (Paid with Tokens)" - if fully paid with tokens
  - "Proceed to Payment - ₦X,XXX.XX" - if transfer payment needed
  - "Place Order - ₦X,XXX.XX" - for other payment methods

## Security Considerations

1. **Token Balance Validation**
   - Server-side validation of token balance before deduction
   - Prevents negative balances
   - Atomic database operations

2. **Order Integrity**
   - Token amount recorded in order for audit trail
   - Customer ID linked to orders for tracking
   - Payment status properly set based on token usage

3. **Automatic Token Awards**
   - Only awarded for completed, paid orders
   - Trigger-based to prevent manual manipulation
   - Logged in database for transparency

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Create customer profile and verify reward_tokens field
- [ ] Place and complete an order, verify 2% tokens awarded
- [ ] Check token balance in Device Sync Modal
- [ ] Use tokens for full payment (100% tokens)
- [ ] Use tokens for partial payment (tokens + cash/transfer)
- [ ] Verify token balance updates after usage
- [ ] Test with multiple linked devices
- [ ] Verify tokens sync across all devices
- [ ] Test insufficient token balance scenario
- [ ] Verify order records include token_payment_amount
- [ ] Test token slider UI responsiveness

## Future Enhancements

1. **Token History**
   - Add transaction log for token earnings and usage
   - Display history in Device Sync Modal

2. **Token Expiry**
   - Optional expiry dates for tokens
   - Notifications before expiry

3. **Bonus Tokens**
   - Promotional token awards
   - Referral bonuses
   - Special event multipliers

4. **Token Gifting**
   - Transfer tokens between customers
   - Gift cards using tokens

5. **Tiered Rewards**
   - Higher earning rates for loyal customers
   - VIP tiers with bonus percentages

## Deployment Steps

1. **Database Migration**
   ```sql
   -- Run the migration file
   psql -d your_database < database_migration_reward_tokens.sql
   ```

2. **Verify Migration**
   - Check customers table has reward_tokens column
   - Check orders table has token_payment_amount column
   - Verify trigger is created

3. **Deploy Code Changes**
   - Deploy updated type definitions
   - Deploy API routes
   - Deploy component updates

4. **Test in Production**
   - Create test order and verify token award
   - Test token payment flow
   - Monitor logs for errors

## Support & Troubleshooting

### Common Issues

1. **Tokens not awarded after order completion**
   - Check order status is "served"
   - Check payment_status is "paid"
   - Verify trigger is active
   - Check database logs

2. **Token payment fails**
   - Verify customer has sufficient balance
   - Check API endpoint is accessible
   - Verify customer ID is passed correctly

3. **Token balance not updating**
   - Refresh customer data
   - Check database connection
   - Verify customer profile exists

### Debug Commands
```sql
-- Check customer token balance
SELECT id, reward_tokens FROM customers WHERE id = 'customer_id';

-- Check orders with token payments
SELECT id, total_amount, token_payment_amount, payment_method 
FROM orders 
WHERE token_payment_amount > 0;

-- Check trigger status
SELECT * FROM pg_trigger WHERE tgname = 'trigger_award_order_tokens';
```

## Conclusion

The reward tokens system provides a seamless loyalty program that encourages repeat purchases and enhances customer engagement. The implementation is secure, scalable, and provides a great user experience across all devices.
