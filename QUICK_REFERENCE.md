# Reward Tokens - Quick Reference Card

## 🎯 Core Concept
**1 Token = ₦1 Naira**  
**Earn 2% on completed orders**  
**Use tokens to pay for orders**

---

## 📋 Setup Checklist

- [ ] Run `database_migration_reward_tokens.sql` in Supabase
- [ ] Verify columns added: `customers.reward_tokens`, `orders.token_payment_amount`
- [ ] Test token earning: Complete an order and check balance
- [ ] Test token usage: Use tokens in checkout
- [ ] Deploy to production

---

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `database_migration_reward_tokens.sql` | Database schema changes |
| `src/app/api/customers/[customerId]/use-tokens/route.ts` | Token deduction API |
| `src/components/DeviceSyncModal.tsx` | Token balance display |
| `src/components/CheckoutPage.tsx` | Token payment UI |
| `src/lib/customer-api.ts` | Token API functions |
| `src/types/database.ts` | Type definitions |

---

## 💡 How Customers Use It

### Earning Tokens
1. Place order → 2. Order completed → 3. Tokens auto-awarded → 4. Available on all devices

### Using Tokens
1. Go to checkout → 2. Toggle "Use Tokens" → 3. Adjust slider → 4. Complete order

---

## 🛠️ Common Tasks

### Check Token Balance
```sql
SELECT id, reward_tokens FROM customers WHERE id = 'customer_id';
```

### Check Token Usage
```sql
SELECT id, total_amount, token_payment_amount 
FROM orders 
WHERE token_payment_amount > 0;
```

### Award Tokens Manually (if needed)
```sql
UPDATE customers 
SET reward_tokens = reward_tokens + 100 
WHERE id = 'customer_id';
```

### Check Total Tokens in System
```sql
SELECT SUM(reward_tokens) FROM customers;
```

---

## 🎨 UI Components

### Device Sync Modal
- Shows token balance at top
- Currency icon (💰)
- Formatted amount (₦X,XXX.XX)
- Earning/usage tips

### Checkout Page
- Toggle switch for token payment
- Slider to adjust amount
- Real-time calculations
- Savings message

---

## ⚙️ Configuration

### Change Earning Rate
Edit `award_order_tokens()` in migration file:
```sql
token_amount := NEW.total_amount * 0.05;  -- 5% instead of 2%
```

### Limit Token Usage
Edit `CheckoutPage.tsx`:
```typescript
const maxTokensToUse = Math.min(availableTokens, subtotal * 0.5)  // 50% max
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Tokens not awarded | Check order status = "served" AND payment_status = "paid" |
| Token payment fails | Verify customer has sufficient balance |
| Balance not showing | Refresh Device Sync Modal |
| Negative balance | Check database constraints |

---

## 📊 Analytics Queries

### Top Customers by Tokens
```sql
SELECT id, reward_tokens 
FROM customers 
ORDER BY reward_tokens DESC 
LIMIT 10;
```

### Token Redemption Rate
```sql
SELECT 
  COUNT(DISTINCT CASE WHEN token_payment_amount > 0 THEN customer_id END) as using_tokens,
  COUNT(DISTINCT customer_id) as total_customers
FROM orders;
```

---

## 🚀 Deployment Steps

1. **Backup Database** (always!)
2. **Run Migration** in Supabase SQL Editor
3. **Verify** columns exist
4. **Test** with sample order
5. **Deploy** code changes
6. **Monitor** for 24 hours
7. **Announce** to customers

---

## 📞 Support

- **Setup Issues**: See `REWARD_TOKENS_SETUP_GUIDE.md`
- **Technical Details**: See `REWARD_TOKENS_IMPLEMENTATION.md`
- **Test Queries**: See `test_reward_tokens.sql`
- **Overview**: See `REWARD_TOKENS_SUMMARY.md`

---

## ✅ Success Indicators

- ✅ Customers earning tokens automatically
- ✅ Token balance visible in Device Sync Modal
- ✅ Customers using tokens in checkout
- ✅ No negative balances
- ✅ Token transactions recorded correctly

---

## 🎉 Launch Checklist

- [ ] Migration successful
- [ ] All tests passing
- [ ] UI looks good on mobile
- [ ] Token earning working
- [ ] Token usage working
- [ ] Analytics queries running
- [ ] Documentation reviewed
- [ ] Team trained
- [ ] Customers notified
- [ ] Monitoring in place

---

**Status**: Ready for Production ✅  
**Maintenance**: Automatic (no manual work needed)  
**Customer Impact**: High (loyalty program)

---

*For detailed information, see the full documentation files.*
