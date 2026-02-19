# Device Sync - Quick Setup Guide

## Step 1: Run Database Migration

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy the contents of `database_migration_customer_profiles.sql`
4. Paste and run the migration
5. Verify tables were created:
   - `customers`
   - `customer_devices`
   - `customer_activities`

## Step 2: Test the Feature

### On First Device:
1. Scan QR code or visit business page: `yourapp.com/b/business-slug`
2. Click the floating "Sync Devices" button (bottom-left, phone icon)
3. Click "Create Profile & Get Passcode"
4. Copy your 6-digit passcode (e.g., "123 456")

### On Second Device:
1. Scan QR code or visit the same business page
2. Click the "Sync Devices" button
3. Click "I Have a Passcode"
4. Enter the 6-digit passcode from first device
5. Click "Link Device"
6. ✅ Both devices are now synced!

## Step 3: Verify It Works

1. Place an order on Device 1
2. Go to "Track Orders" on Device 2
3. You should see the order from Device 1
4. Both devices show the same order history

## Step 4: Optional - Auto-Create Profile on First Order

To automatically create a customer profile when someone places their first order, add this code to your order submission:

```typescript
// In your order submission function
import { getCustomerId, setCustomerId, getDeviceId, generateDeviceFingerprint, getDeviceName } from "@/lib/device-identity"
import { createCustomerProfile, trackActivity } from "@/lib/customer-api"
import { linkOrdersToCustomer } from "@/lib/order-storage"

async function submitOrder(orderData) {
  let customerId = getCustomerId()

  // Create profile if doesn't exist
  if (!customerId) {
    const deviceId = getDeviceId()
    const fingerprint = JSON.stringify(generateDeviceFingerprint())
    const deviceName = getDeviceName()
    
    const result = await createCustomerProfile(deviceId, fingerprint, deviceName)
    
    if (result) {
      customerId = result.customer.id
      setCustomerId(customerId)
      linkOrdersToCustomer(customerId)
      
      // Optionally show passcode to user
      console.log("Your sync code:", result.customer.sync_passcode)
    }
  }

  // Include customer_id in order
  const orderWithCustomer = {
    ...orderData,
    customer_id: customerId,
  }

  // Submit order...
  const newOrder = await submitOrderToAPI(orderWithCustomer)

  // Track activity
  if (customerId) {
    await trackActivity(
      customerId,
      getDeviceId(),
      "order",
      { orderId: newOrder.id, amount: orderData.total_amount },
      orderData.businessId
    )
  }

  return newOrder
}
```

## Troubleshooting

### Passcode Not Working
- Ensure database migration ran successfully
- Check browser console for errors
- Verify passcode is exactly 6 digits

### Orders Not Syncing
- Ensure `customer_id` is included in order submission
- Check that both devices are linked to same customer
- Verify API routes are accessible

### Device Not Showing in List
- Check browser localStorage for device_id
- Ensure device was successfully linked
- Try refreshing the page

## Features Available

✅ Create customer profile with passcode
✅ Link multiple devices using passcode
✅ View all linked devices
✅ Unlink devices
✅ Regenerate passcode
✅ View orders from all devices
✅ Track page views automatically
✅ Copy passcode to clipboard

## What's Next?

The foundation is complete! You can now:
1. Add activity tracking to cart actions
2. Show passcode after first order
3. Build activity history view
4. Add customer analytics dashboard
5. Implement loyalty programs

## Support

If you encounter issues:
1. Check `DEVICE_SYNC_IMPLEMENTATION_COMPLETE.md` for detailed documentation
2. Review browser console for errors
3. Verify database migration completed
4. Check API routes are responding

Enjoy your new device sync feature! 🎉
