# Device Sync - Debugging Guide

## Issue
Modal shows "No Profile Yet" even after creating a profile and closing/reopening the modal.

## Debugging Steps

### Step 1: Check Browser Console Logs

When you create a profile, you should see these logs in order:

```
[DeviceSync] Creating profile for device: dev_xxxxx
[DeviceSync] Profile created successfully: <customer_id>
[DeviceSync] Passcode: 123456
[DeviceIdentity] Set customer ID: <customer_id>
[DeviceIdentity] ✅ Customer ID verified in localStorage: <customer_id>
[DeviceSync] Customer ID saved to localStorage: <customer_id>
```

**If you DON'T see the ✅ verification**, localStorage is not working.

### Step 2: Check localStorage Directly

1. Open browser DevTools (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Click "Local Storage" → Select your domain
4. Look for key: `groovevie_customer_id`
5. It should have a value like: `<uuid>`

**If the key doesn't exist**, localStorage is being blocked or cleared.

### Step 3: When You Reopen the Modal

You should see these logs:

```
[DeviceIdentity] Getting customer ID from localStorage: <customer_id>
[DeviceSync] Modal opened, customer ID from localStorage: <customer_id>
[DeviceSync] Fetching fresh data from database...
[DeviceSync] Loading customer data for ID: <customer_id>
[DeviceSync] Customer API response status: 200
[DeviceSync] Customer data received: {...}
[DeviceSync] Customer profile loaded successfully
[DeviceSync] Passcode: 123456
```

**If you see `null` for customer ID**, it means localStorage was cleared or not saved.

## Common Issues & Solutions

### Issue 1: localStorage is Blocked

**Symptoms:**
- No customer ID in localStorage
- Error in console about localStorage

**Causes:**
- Private/Incognito mode
- Browser settings blocking storage
- iOS Safari in private mode

**Solution:**
- Use regular browser mode (not private/incognito)
- Check browser settings allow localStorage
- Try a different browser

### Issue 2: localStorage is Cleared on Page Reload

**Symptoms:**
- Customer ID exists after creation
- Disappears after page reload

**Causes:**
- Browser clearing storage on exit
- Session storage instead of localStorage
- Browser extension clearing data

**Solution:**
- Check browser settings
- Disable extensions temporarily
- Verify using localStorage (not sessionStorage)

### Issue 3: Customer ID Saved but Not Retrieved

**Symptoms:**
- See "Set customer ID" log
- See "Getting customer ID: null" log

**Causes:**
- Timing issue
- Different storage key
- Browser bug

**Solution:**
- Check the exact key name in localStorage
- Verify CUSTOMER_ID_KEY constant
- Try hard refresh (Ctrl+Shift+R)

### Issue 4: API Not Returning Customer Data

**Symptoms:**
- Customer ID exists in localStorage
- API returns 404 or null

**Causes:**
- Customer not in database
- Database connection issue
- Wrong API endpoint

**Solution:**
- Check database for customer record
- Verify API endpoint is correct
- Check network tab for API response

## Manual Testing Script

Run this in browser console to test localStorage:

```javascript
// Test 1: Can we write to localStorage?
try {
  localStorage.setItem('test_key', 'test_value')
  console.log('✅ localStorage write works')
} catch (e) {
  console.error('❌ localStorage write failed:', e)
}

// Test 2: Can we read from localStorage?
try {
  const value = localStorage.getItem('test_key')
  if (value === 'test_value') {
    console.log('✅ localStorage read works')
  } else {
    console.error('❌ localStorage read failed, got:', value)
  }
} catch (e) {
  console.error('❌ localStorage read failed:', e)
}

// Test 3: Check for customer ID
const customerId = localStorage.getItem('groovevie_customer_id')
console.log('Customer ID in localStorage:', customerId)

// Test 4: Check all groovevie keys
const allKeys = Object.keys(localStorage).filter(k => k.startsWith('groovevie'))
console.log('All groovevie keys:', allKeys)
allKeys.forEach(key => {
  console.log(`  ${key}:`, localStorage.getItem(key))
})
```

## Expected Flow

### Creating Profile
1. User clicks "Create Profile & Get Passcode"
2. API creates customer in database
3. Customer ID saved to localStorage
4. Passcode displayed in modal
5. Modal state updated with customer data

### Reopening Modal
1. User clicks "Sync Devices" button
2. Modal checks localStorage for customer ID
3. If found, fetches customer data from database
4. Displays passcode and devices

## Verification Checklist

- [ ] Browser console shows customer ID being saved
- [ ] localStorage contains `groovevie_customer_id` key
- [ ] Customer record exists in database
- [ ] Modal logs show customer ID when reopening
- [ ] API returns customer data successfully
- [ ] Passcode displays in modal

## If Still Not Working

### Check Database

Run this SQL query in Supabase:

```sql
SELECT * FROM customers ORDER BY created_at DESC LIMIT 5;
SELECT * FROM customer_devices ORDER BY created_at DESC LIMIT 5;
```

Verify:
- Customer record exists
- Has a sync_passcode
- Device is linked to customer

### Check API Endpoint

Test the API directly:

```bash
# Replace <customer_id> with actual ID from localStorage
curl https://your-domain.com/api/customers/<customer_id>
```

Should return:
```json
{
  "id": "<customer_id>",
  "sync_passcode": "123456",
  "created_at": "...",
  "updated_at": "..."
}
```

### Check Network Tab

1. Open DevTools → Network tab
2. Reopen modal
3. Look for request to `/api/customers/<id>`
4. Check response status and body

## Contact Support

If none of the above works, provide:
1. Browser console logs (full output)
2. localStorage contents (screenshot)
3. Network tab showing API requests
4. Browser and OS version
5. Steps to reproduce

This will help identify the exact issue.
