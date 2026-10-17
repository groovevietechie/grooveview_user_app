# Spin System - Quick Testing Checklist

## Pre-Test Setup
- [ ] Database migrations applied (`database_migration_spin_system.sql`, `database_migration_spin_cooldown.sql`)
- [ ] Build completed successfully (`npm run build`)
- [ ] No TypeScript errors
- [ ] Browser DevTools open (console tab)

---

## Core Flow Test (5-10 minutes)

### Step 1: Check Spin Balance Display
- [ ] Open spin wheel from menu
- [ ] Confirm "💫 Spins Available: X" displays in emerald badge
- [ ] Confirm "How to Earn Spins" button visible (top-right)
- [ ] Close and reopen - balance persists

### Step 2: Test "How to Earn Spins" Modal
- [ ] Click question mark button
- [ ] Modal appears with fade animation
- [ ] Contains all sections (How to Earn, Mechanics, Rewards, Tips)
- [ ] Can close by clicking X or outside modal

### Step 3: Test Spin Button States
**If balance > 0**:
- [ ] Button shows "Spin Now (X)"
- [ ] Button is enabled (golden background)
- [ ] Can click to spin

**If balance = 0**:
- [ ] Button shows "No spins available"
- [ ] Button is disabled (grayed out)
- [ ] Cannot click

### Step 4: Execute Spin Animation
- [ ] Click "Spin Now" button
- [ ] Wheel rotates smoothly (~5.2 seconds)
- [ ] Pointer swings at segment boundaries
- [ ] Bulbs flash rapidly
- [ ] Animation is smooth (no jank)

### Step 5: Verify Result Display
- [ ] Result popup appears with animation
- [ ] Shows reward icon, label, description
- [ ] Confetti falls smoothly
- [ ] "Claim Reward" and "Done" buttons functional
- [ ] Spin balance decreased by 1 (if not a "Try Again" reward)

### Step 6: Check Green Drink Cooldown (if applicable)
**First green drink win**:
- [ ] No cooldown indicator shows

**Second green drink within 7 days**:
- [ ] Amber indicator: "⏰ Weekly Cooldown Active"
- [ ] Shows time remaining: "6d 23h"

### Step 7: Verify Database Recording
```sql
SELECT spin_balance, total_spins_used FROM customer_spins 
WHERE customer_id = '<test_id>';
```
- [ ] `total_spins_used` increased by 1
- [ ] `spin_balance` decreased by 1

---

## Order Integration Test (3-5 minutes)

### Step 8: Complete Order > ₦10,000
- [ ] Place order with total > ₦10,000
- [ ] Complete checkout
- [ ] Wait for order status → "served" (simulated or real)
- [ ] Confirm `SpinEarnedNotification` popup appears
- [ ] Notification shows: "You earned 1 spin!"
- [ ] Spin balance increases by 1

### Step 9: Test Order < ₦10,000
- [ ] Place order with total < ₦10,000
- [ ] Complete checkout
- [ ] Mark as served
- [ ] Confirm NO spin notification appears
- [ ] Spin balance unchanged

---

## API Endpoint Tests (2-3 minutes)

### Step 10: Test Spin Rewards Endpoint
```bash
curl http://localhost:3000/api/spins/rewards
```
- [ ] Returns 200 status
- [ ] Contains 6 reward types (or configured number)
- [ ] Each reward has: reward_type, label, icon, probability, color

### Step 11: Test Spin Balance Endpoint
```bash
curl http://localhost:3000/api/spins/balance?customerId=<id>
```
- [ ] Returns 200 status
- [ ] Returns current spin_balance
- [ ] Number matches UI display

### Step 12: Test Spin Use Endpoint
```bash
curl -X POST http://localhost:3000/api/spins/use \
  -H "Content-Type: application/json" \
  -d '{"customerId":"<id>","rewardType":"cashback50"}'
```
- [ ] Returns 200 status
- [ ] `newBalance` is less than previous
- [ ] Result recorded in database

### Step 13: Test Cooldown Endpoint
```bash
curl http://localhost:3000/api/spins/cooldown?customerId=<id>&rewardType=greenBeer
```
- [ ] Returns 200 status
- [ ] Shows correct `cooldownActive` status
- [ ] If active, returns `cooldownEndsAt` timestamp
- [ ] Time calculation correct

---

## Error Scenarios (2-3 minutes)

### Step 14: Test Insufficient Balance
- [ ] Manually set `spin_balance = 0` in database
- [ ] Try to spin
- [ ] Expected error: "Insufficient spin balance"
- [ ] Balance not decremented

### Step 15: Test Network Error Recovery
- [ ] Open DevTools Network tab
- [ ] Throttle to "Offline"
- [ ] Try to spin
- [ ] Should see error message
- [ ] Restore network, retry works

---

## Performance Checks (1-2 minutes)

- [ ] DailySpinWheel opens in < 500ms
- [ ] Spin animation is 60fps (no dropped frames)
- [ ] No console errors or warnings
- [ ] Memory usage doesn't spike excessively

---

## Browser Compatibility

- [ ] Chrome/Edge: ✓ Pass / ✗ Fail
- [ ] Firefox: ✓ Pass / ✗ Fail
- [ ] Safari: ✓ Pass / ✗ Fail
- [ ] Mobile Browser: ✓ Pass / ✗ Fail

---

## Final Sign-Off

**Date**: ______________________
**Tester**: ______________________
**Overall Status**: [ ] ✓ PASS  [ ] ✗ FAIL  [ ] ⚠ PARTIAL

**Issues Found**:
```
1. 
2. 
3. 
```

**Notes**:
```
[Space for additional notes]
```

---

## If Tests Fail

1. Check browser console for errors
2. Verify database migrations ran
3. Check API endpoints directly
4. Review build output for warnings
5. Clear browser cache and reload
6. Restart development server

**Debugging Commands**:
```bash
# Check build
npm run build

# Run type check
npm run typecheck

# View server logs
npm run dev

# Test API directly
curl http://localhost:3000/api/spins/rewards
```
