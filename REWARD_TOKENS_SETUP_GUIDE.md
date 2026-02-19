# Reward Tokens System - Quick Setup Guide

## Step 1: Run Database Migration

Execute the SQL migration file to add the necessary database columns, functions, and triggers:

```bash
# If using Supabase CLI
supabase db push

# Or run the SQL file directly in your database
psql -d your_database_name < database_migration_reward_tokens.sql
```

Or copy and paste the contents of `database_migration_reward_tokens.sql` into your Supabase SQL Editor and execute it.

## Step 2: Verify Database Changes

Check that the migration was successful:

```sql
-- Check if reward_tokens column exists in customers table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' AND column_name = 'reward_tokens';

-- Check if token_payment_amount column exists in orders table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'token_payment_amount';

-- Check if trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_award_order_tokens';
```

## Step 3: Test the System

### Test Token Earning:

1. Create a customer profile through the Device Sync Modal
2. Place an order (any amount)
3. In your business/admin panel, mark the order as:
   - Status: "served" (completed)
   - Payment Status: "paid"
4. Check the customer's token balance:
   ```sql
   SELECT id, reward_tokens FROM customers WHERE id = 'your_customer_id';
   ```
5. You should see 2% of the order total added as tokens

### Test Token Usage:

1. Open the app with a customer profile that has tokens
2. Add items to cart and go to checkout
3. You should see the "Use Reward Tokens" option in the Order Summary
4. Toggle it on and adjust the slider
5. Complete the order
6. Verify tokens were deducted from the customer balance

## Step 4: Monitor and Verify

### Check Token Awards:
```sql
-- See all customers with tokens
SELECT id, sync_passcode, reward_tokens 
FROM customers 
WHERE reward_tokens > 0 
ORDER BY reward_tokens DESC;
```

### Check Token Payments:
```sql
-- See all orders paid with tokens
SELECT id, customer_id, total_amount, token_payment_amount, payment_method
FROM orders 
WHERE token_payment_amount > 0
ORDER BY created_at DESC;
```

### Calculate Total Tokens in System:
```sql
-- Total tokens earned by all customers
SELECT SUM(reward_tokens) as total_tokens_in_system FROM customers;

-- Total tokens used for payments
SELECT SUM(token_payment_amount) as total_tokens_used FROM orders;
```

## Troubleshooting

### Issue: Tokens not being awarded

**Solution:**
1. Check if the trigger is active:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_award_order_tokens';
   ```

2. Manually test the trigger function:
   ```sql
   -- Update an order to trigger token award
   UPDATE orders 
   SET status = 'served', payment_status = 'paid' 
   WHERE id = 'your_order_id' AND customer_id IS NOT NULL;
   ```

3. Check database logs for errors

### Issue: Token payment fails

**Solution:**
1. Verify the API endpoint is accessible:
   ```bash
   curl -X POST http://your-domain/api/customers/[customer-id]/use-tokens \
     -H "Content-Type: application/json" \
     -d '{"token_amount": 10.00}'
   ```

2. Check browser console for errors
3. Verify customer ID is being passed correctly in the order submission

### Issue: Token balance not showing in UI

**Solution:**
1. Check if customer profile exists and has the reward_tokens field
2. Refresh the page or reopen Device Sync Modal
3. Check browser console for API errors
4. Verify the customer API is returning the reward_tokens field

## Configuration Options

### Adjust Token Earning Percentage

To change from 2% to a different percentage, edit the `award_order_tokens()` function in the migration file:

```sql
-- Change this line:
token_amount := NEW.total_amount * 0.02;  -- 2%

-- To your desired percentage, e.g., 5%:
token_amount := NEW.total_amount * 0.05;  -- 5%
```

Then re-run the migration or update the function directly.

### Set Minimum Order for Token Earning

Add a condition in the trigger function:

```sql
-- Only award tokens for orders above ₦1000
IF NEW.status = 'served' 
   AND NEW.payment_status = 'paid' 
   AND NEW.total_amount >= 1000  -- Add this line
   AND (OLD.status IS NULL OR OLD.status != 'served')
   AND NEW.customer_id IS NOT NULL THEN
```

### Set Maximum Token Usage per Order

In `src/components/CheckoutPage.tsx`, modify the calculation:

```typescript
// Limit to 50% of order total
const maxTokensToUse = Math.min(availableTokens, subtotal * 0.5)
```

## Next Steps

1. ✅ Database migration completed
2. ✅ Test token earning with a sample order
3. ✅ Test token usage in checkout
4. ✅ Monitor token transactions
5. 📱 Inform customers about the new rewards program
6. 📊 Track token usage analytics
7. 🎉 Launch promotional campaigns

## Support

For issues or questions:
- Check the detailed documentation in `REWARD_TOKENS_IMPLEMENTATION.md`
- Review database logs for errors
- Test with sample data before production use
- Monitor customer feedback

---

**Congratulations!** Your reward tokens system is now ready to use. Customers will automatically earn 2% tokens on completed orders and can use them for future purchases across all their linked devices.
