# LocalStorage Test Instructions

## Quick Test in Browser Console

After creating a profile, open browser console (F12) and run:

```javascript
// Check if customer ID exists
const customerId = localStorage.getItem('groovevie_customer_id')
console.log('Customer ID:', customerId)

// If it exists, test the API
if (customerId) {
  fetch(`/api/customers/${customerId}`)
    .then(res => res.json())
    .then(data => console.log('Customer data from API:', data))
    .catch(err => console.error('API error:', err))
} else {
  console.error('❌ No customer ID in localStorage!')
}
```

## What You Should See

### If Working Correctly:
```
Customer ID: abc-123-def-456
Customer data from API: {
  id: "abc-123-def-456",
  sync_passcode: "842824",
  created_at: "2024-...",
  updated_at: "2024-..."
}
```

### If Not Working:
```
Customer ID: null
❌ No customer ID in localStorage!
```

## Next Steps Based on Results

### If Customer ID is NULL:
The problem is that `setCustomerId()` is not saving to localStorage.

**Possible causes:**
1. Browser is in private/incognito mode
2. localStorage is disabled in browser settings
3. Browser extension is blocking storage
4. iOS Safari privacy settings

**Solution:**
- Try in regular browser mode
- Check browser settings
- Try different browser

### If Customer ID EXISTS but API Returns Error:
The problem is with the database or API.

**Check:**
1. Is the customer in the database?
2. Is the API endpoint correct?
3. Are there any CORS errors?

### If Customer ID EXISTS and API Works:
The problem is with the modal's data loading logic.

**Check:**
1. Does the modal call `getCustomerId()` when opening?
2. Does it call `loadCustomerData()`?
3. Are there any errors in the console?

## Manual Fix Test

If localStorage is working but modal isn't loading, try this:

```javascript
// Force reload customer data
const customerId = localStorage.getItem('groovevie_customer_id')
if (customerId) {
  console.log('Found customer ID:', customerId)
  console.log('Now close and reopen the modal')
  console.log('Watch the console for loading logs')
}
```

Then close and reopen the modal. You should see:
```
[DeviceIdentity] Getting customer ID from localStorage: abc-123...
[DeviceSync] Modal opened, customer ID from localStorage: abc-123...
[DeviceSync] Fetching fresh data from database...
```

If you DON'T see these logs, the modal's useEffect is not running.
