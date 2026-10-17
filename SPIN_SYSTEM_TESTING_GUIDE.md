# Spin System - Complete Testing Guide

## Overview
This document outlines comprehensive testing procedures for the dynamic spin system with order completion triggers, spin earnings mechanics, and database-controlled rewards.

## System Components

### 1. Database Tables
- `spin_rewards` - Configurable reward options (admin-controlled)
- `customer_spins` - Customer spin balance tracking
- `spin_usage_history` - Record of spin earnings
- `spin_results_history` - Record of spin results with cooldown tracking

### 2. API Endpoints
- `GET /api/spins/rewards` - Fetch dynamic rewards from database
- `POST /api/spins/balance` - Manage spin balance (award/check)
- `POST /api/spins/use` - Deduct spin and record result
- `GET /api/spins/cooldown` - Check green drink cooldown status

### 3. Frontend Components
- `DailySpinWheel.tsx` - Main spin wheel UI with balance display
- `SpinEarnedNotification.tsx` - Popup when order completed
- `HowToEarnSpinsModal.tsx` - Educational modal
- `useDailySpinWheel` hook - Spin mechanics and state management

---

## Test Scenarios

### Test 1: Order Completion Triggers Spin Award
**Objective**: Verify that completing an order over ₦10,000 awards 1 spin

**Steps**:
1. Navigate to order placement page
2. Add items totaling > ₦10,000
3. Complete order checkout
4. Wait for order status to update to "served"
5. Verify `SpinEarnedNotification` popup displays
6. Notification should show: "You earned 1 spin!" with animations

**Expected Results**:
- ✓ Popup appears within 1-2 seconds of order status change
- ✓ Popup has futuristic animations (fade-in, glow effects)
- ✓ Notification auto-dismisses after 4 seconds or on manual close
- ✓ Spin balance increases by 1

**Database Verification**:
```sql
-- Check spin balance was awarded
SELECT spin_balance, total_spins_earned 
FROM customer_spins 
WHERE customer_id = '<test_customer_id>';

-- Should see increase in both fields
```

---

### Test 2: Spin Balance Display
**Objective**: Verify spin balance displays correctly on DailySpinWheel

**Steps**:
1. Navigate to menu/spin page
2. Click on spin wheel icon to open DailySpinWheel modal
3. Observe the header section

**Expected Results**:
- ✓ Emerald-colored badge displays "💫 Spins Available: X"
- ✓ Count matches database spin_balance for customer
- ✓ "How to Earn Spins" button visible (top-right, question mark icon)
- ✓ Message shows "Earn 1 spin per order over ₦10,000"

**Variations**:
- If balance = 0: "No spins available" message
- If balance = 1: "1 spin available"
- If balance > 1: "X spins available"

---

### Test 3: How to Earn Spins Modal
**Objective**: Verify educational modal displays correctly

**Steps**:
1. Open DailySpinWheel
2. Click "How to Earn Spins" button (question mark icon)
3. Read through modal content

**Expected Results**:
- ✓ Modal appears with smooth fade-in animation
- ✓ Contains sections:
  - How to Earn Spins
  - Spin Mechanics
  - Reward Types (with icons and descriptions)
  - Weekly Green Drink Limit
  - Tips for Maximum Rewards
- ✓ Dark futuristic design with amber/gold accents
- ✓ Close button works (X in top-right)
- ✓ Modal can be closed by clicking outside

---

### Test 4: Spin Button Functionality
**Objective**: Verify spin button behavior based on balance

**Steps A - With Spins Available**:
1. Ensure customer has ≥1 spin balance
2. Open DailySpinWheel
3. Observe spin button

**Expected Results**:
- ✓ Button shows "Spin Now (X)" where X = spin count
- ✓ Button is enabled (not grayed out)
- ✓ Button has golden gradient background
- ✓ Clicking button initiates wheel animation

**Steps B - With No Spins**:
1. Ensure customer has 0 spin balance
2. Open DailySpinWheel
3. Observe spin button

**Expected Results**:
- ✓ Button shows "No spins available"
- ✓ Button is disabled (grayed out)
- ✓ Clicking button has no effect
- ✓ Status message shows: "No spins available" + "Complete an order over ₦10,000 to earn a spin"

---

### Test 5: Wheel Spin Animation
**Objective**: Verify spinning mechanics and animations

**Steps**:
1. Have ≥1 spin available
2. Open DailySpinWheel
3. Click "Spin Now" button
4. Watch animation complete

**Expected Results**:
- ✓ Wheel rotates smoothly
- ✓ Bulbs around rim flash rapidly during spin
- ✓ Pointer swings at each segment boundary
- ✓ Sound effects play (if enabled)
- ✓ Spin duration ~5.2 seconds
- ✓ Wheel lands on a slice and stops precisely

**Animation Verification**:
- ✓ Pointer animation (swing at pegs): 130ms ease-out
- ✓ Bulb flashing: 0.18s during spin
- ✓ Main wheel rotation: smooth easing
- ✓ Confetti particles fall after result shows

---

### Test 6: Reward Result Display
**Objective**: Verify spin result display and cooldown indicator

**Steps**:
1. Complete spin animation
2. View result popup

**Expected Results**:
- ✓ "Congratulations!" heading displays
- ✓ Reward icon bounces in large circle
- ✓ Reward label displays
- ✓ Reward description shows
- ✓ Confetti animates falling
- ✓ "Claim Reward" and "Done" buttons functional

**Green Drink Specific**:
- ✓ If green drink won AND no cooldown: no indicator
- ✓ If green drink won AND cooldown active: amber indicator shows
  - Message: "⏰ Weekly Cooldown Active"
  - Shows time remaining: "X days Y hours"

---

### Test 7: Weekly Green Drink Cooldown
**Objective**: Verify 7-day cooldown enforcement

**Steps A - First Green Drink**:
1. Spin and win "🍺 Green Bottled Drink"
2. Note the timestamp
3. Check result display

**Expected Results**:
- ✓ No cooldown indicator (can redeem immediately)
- ✓ Spin balance decreases by 1
- ✓ Result recorded in database

**Steps B - Second Green Drink Within 7 Days**:
1. Spin again (within 7 days)
2. If win "🍺 Green Bottled Drink" again:

**Expected Results**:
- ✓ Cooldown indicator appears
- ✓ Shows: "⏰ Weekly Cooldown Active"
- ✓ Time remaining shows: "6d 23h" (or similar)
- ✓ Cannot claim reward until cooldown expires

**Database Verification**:
```sql
-- Check cooldown tracking
SELECT reward_type, spun_at, redeemed, redeemed_at, 
       cooldown_active, cooldown_ends_at
FROM spin_results_history
WHERE customer_id = '<test_customer_id>'
AND reward_type = 'greenBeer'
ORDER BY spun_at DESC
LIMIT 2;

-- Should show:
-- Most recent: cooldown_active = true, cooldown_ends_at = future date
-- Previous one (if exists): redeemed_at = 7+ days ago
```

**API Verification**:
```bash
curl "http://localhost:3000/api/spins/cooldown?customerId=<id>&rewardType=greenBeer"
# Response should show:
# {
#   "success": true,
#   "cooldownActive": true,
#   "cooldownEndsAt": "2026-10-23T15:30:00Z",
#   "timeRemaining": {"days": 6, "hours": 23, "minutes": 15, "seconds": 45}
# }
```

---

### Test 8: Spin Balance Deduction
**Objective**: Verify spin balance decreases after use

**Steps**:
1. Check current spin balance (should see in DailySpinWheel header)
2. Close modal, re-open to confirm balance
3. Spin wheel (any reward)
4. Check balance again

**Expected Results**:
- ✓ Balance decreases by 1 after spin
- ✓ Balance updates in real-time in UI
- ✓ If balance was 1, now shows "No spins available"
- ✓ Spin button becomes disabled

**Database Verification**:
```sql
SELECT spin_balance, total_spins_earned, total_spins_used
FROM customer_spins
WHERE customer_id = '<test_customer_id>';

-- total_spins_used should increment by 1
-- spin_balance should decrease by 1
```

---

### Test 9: Dynamic Rewards from Database
**Objective**: Verify rewards are fetched from database and configurable

**Steps A - Check Default Rewards**:
1. Open DailySpinWheel
2. Observe wheel segments

**Expected Rewards**:
- 🍺 Green Bottled Drink (25% probability)
- 🍺 Black Bottled Drink (15% probability)
- 💰 ₦200 Cashback (20% probability)
- 💵 ₦50 Cashback (20% probability)
- 🏷️ 10% Discount (15% probability)
- 🎯 Try Again (5% probability)

**Steps B - Update Rewards via Database**:
1. Access database admin panel
2. Update `spin_rewards` table (change label, probability, etc.)
3. Refresh webapp
4. Verify changes reflected on wheel

**Expected Results**:
- ✓ New reward labels display on wheel
- ✓ Reward probabilities adjusted (more winning spins for high-probability rewards)
- ✓ Icons match database values
- ✓ Colors update from database

**Database Test**:
```sql
-- Update a reward
UPDATE spin_rewards 
SET label = '🍾 Premium Drink', probability = 30
WHERE reward_type = 'greenBeer';

-- In app, the green beer segment should now show "🍾 Premium Drink"
-- and should win more frequently (30% vs 25%)
```

---

### Test 10: Spin Usage History
**Objective**: Verify spin history is tracked correctly

**Steps**:
1. Use multiple spins (win different rewards)
2. Check spin history via API

**Expected Results**:
- ✓ All spins recorded with timestamps
- ✓ Reward types, labels, and values stored
- ✓ Cooldown info recorded for green drink

**API Verification**:
```bash
curl "http://localhost:3000/api/spins/use/history?customerId=<id>"
# Response should show recent spins with:
# - reward_type
# - reward_label
# - reward_value
# - spun_at (timestamp)
# - cooldown_active (boolean)
# - cooldown_ends_at (ISO timestamp)
```

---

### Test 11: Order Amount Validation
**Objective**: Verify spins only awarded for orders > ₦10,000

**Steps A - Order < ₦10,000**:
1. Place order with total < ₦10,000
2. Complete checkout
3. Wait for order to be served

**Expected Results**:
- ✓ NO SpinEarnedNotification appears
- ✓ Spin balance remains unchanged

**Steps B - Order = ₦10,000 Exactly**:
1. Place order with total = ₦10,000
2. Complete checkout
3. Wait for order to be served

**Expected Results**:
- ✓ NO notification (threshold is > not ≥)
- ✓ Spin balance unchanged

**Steps C - Order > ₦10,000**:
1. Place order with total > ₦10,000 (e.g., ₦10,001)
2. Complete checkout
3. Wait for order to be served

**Expected Results**:
- ✓ SpinEarnedNotification appears
- ✓ Spin balance increases by 1

---

### Test 12: Multiple Customers
**Objective**: Verify spin balance isolated per customer

**Steps**:
1. Create Customer A with 5 spins
2. Create Customer B with 2 spins
3. Switch between customers
4. Customer A spins (balance becomes 4)
5. Switch to Customer B

**Expected Results**:
- ✓ Customer A sees 4 spins
- ✓ Customer B still sees 2 spins
- ✓ No cross-contamination of balances
- ✓ Each customer's cooldown tracked separately

---

### Test 13: Performance & Load Times
**Objective**: Verify system performs under normal conditions

**Measurements**:
- DailySpinWheel modal opens: < 500ms
- Spin wheel animation: ~5.2 seconds (smooth)
- Result display: < 200ms
- Spin balance API call: < 300ms
- Rewards fetch: < 200ms

**Expected Results**:
- ✓ No lag or stuttering in animations
- ✓ Smooth frame rate throughout
- ✓ No network errors in console

---

### Test 14: Error Handling
**Objective**: Verify graceful error handling

**Steps A - Network Error During Spin**:
1. Disable network (DevTools)
2. Try to spin
3. Re-enable network

**Expected Results**:
- ✓ Error message: "Failed to spin. Please try again."
- ✓ Spin balance unchanged
- ✓ Can retry after connection restored

**Steps B - Insufficient Balance**:
1. Manually set spin_balance to 0 in database
2. Try to spin
3. Observe error

**Expected Results**:
- ✓ API returns 400 error: "Insufficient spin balance"
- ✓ UI shows: "No spins available"
- ✓ No spin recorded in history

---

### Test 15: Animations & Visual Effects
**Objective**: Verify all animations and visual effects work

**Checklist**:
- [ ] SpinEarnedNotification: fade-in + scale animation
- [ ] DailySpinWheel backdrop: radial gradient blur
- [ ] Wheel rotation: smooth easing, no jank
- [ ] Pointer swing: swings at each peg boundary
- [ ] Bulb flashing: rapid during spin, pulsing at rest
- [ ] Result modal: pop-in with scale + fade
- [ ] Confetti: falls from top with rotation and opacity fade
- [ ] Buttons: active:scale-95 click feedback
- [ ] Badge animations: smooth color transitions
- [ ] Cooldown indicator: smooth fade-in

**Accessibility**:
- [ ] Reduced motion media query respected
- [ ] Animations disable if `prefers-reduced-motion`
- [ ] All text readable (sufficient contrast)
- [ ] Focus indicators visible on buttons

---

## Test Data Setup

### Creating Test Customers

```sql
-- Insert test customer (if not exists)
INSERT INTO customers (id, phone, created_at)
VALUES ('test-customer-001', '+2348012345678', NOW())
ON CONFLICT (id) DO NOTHING;

-- Initialize spin balance
INSERT INTO customer_spins (customer_id, spin_balance)
VALUES ('test-customer-001', 5)
ON CONFLICT (customer_id) DO UPDATE SET spin_balance = 5;

-- Award test spin manually
UPDATE customer_spins
SET spin_balance = spin_balance + 1,
    total_spins_earned = total_spins_earned + 1
WHERE customer_id = 'test-customer-001';
```

### Simulating Order Completion

```sql
-- Create test order
INSERT INTO orders (id, customer_id, amount, status, created_at)
VALUES (
  'test-order-001',
  'test-customer-001',
  15000.00,
  'completed',
  NOW()
);

-- Trigger spin award (simulated)
UPDATE customer_spins
SET spin_balance = spin_balance + 1,
    total_spins_earned = total_spins_earned + 1
WHERE customer_id = 'test-customer-001'
AND amount > 10000;
```

---

## Troubleshooting

### Issue: Spin balance not updating
**Solution**: 
1. Check `customer_spins` table has entry for customer
2. Verify API endpoint returns correct balance
3. Check browser console for errors

### Issue: Cooldown not enforcing
**Solution**:
1. Verify `cooldown_ends_at` column exists in `spin_results_history`
2. Check `/api/spins/cooldown` returns correct status
3. Ensure cooldown calculation uses 7-day window

### Issue: Animations lag
**Solution**:
1. Check browser DevTools Performance tab
2. Reduce `BULB_COUNT` if needed
3. Disable confetti if on low-end device

### Issue: Rewards not fetching from database
**Solution**:
1. Verify `spin_rewards` table has enabled rewards
2. Check `/api/spins/rewards` endpoint
3. Fall back to DEFAULT_REWARDS if needed

---

## Sign-Off Checklist

- [ ] All 15 test scenarios pass
- [ ] Database migrations applied
- [ ] API endpoints tested and working
- [ ] Frontend components rendering correctly
- [ ] Animations smooth and performant
- [ ] Error handling graceful
- [ ] Accessibility compliant
- [ ] Documentation complete
- [ ] Ready for production deployment

---

## References

- Spin System Database: `database_migration_spin_system.sql`
- Cooldown Migration: `database_migration_spin_cooldown.sql`
- API Endpoints: `/src/app/api/spins/`
- Components: `/src/components/popups/` and `/src/components/modals/`
- Hook: `/src/hooks/useDailySpinWheel.ts`
- Utilities: `/src/lib/spin-utils.ts`

---

**Test Date**: ______________________
**Tested By**: ______________________
**Status**: [ ] Pass  [ ] Fail  [ ] Partial
**Notes**: ____________________________________________________________________________
