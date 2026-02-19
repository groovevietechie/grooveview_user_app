# Device Sync & User Activity Tracking Implementation Plan

## Overview
This document outlines how to implement device-based user activity tracking with multi-device sync capabilities using a unique passcode system. This enhancement will allow customers to track their orders and activities across multiple devices without requiring traditional authentication.

## Current State Analysis

### ✅ What Already Exists
The app already has a solid foundation for device-based tracking:

1. **Device Order Storage** (`src/lib/order-storage.ts`)
   - Uses localStorage to store order IDs per device
   - Tracks orders per business
   - Functions: `getDeviceOrders()`, `saveDeviceOrder()`, `isDeviceOrder()`

2. **Order Tracking Page** (`src/components/OrderTrackingPage.tsx`)
   - Displays orders specific to the current device
   - Loads orders using `getDeviceOrders(business.id)`

3. **Business Page Routing** (`src/app/b/[slug]/page.tsx`)
   - QR codes direct to: `groovevie.com/b/[business-slug]`
   - No authentication required

### 🎯 What Needs to Be Added

To enable multi-device sync with passcode, we need:

1. **Device Identity System**
   - Generate unique device ID on first visit
   - Store device fingerprint in localStorage

2. **Customer Profile Database**
   - New `customers` table to store customer data
   - Link devices to customer profiles via passcode

3. **Passcode Generation & Sync**
   - Generate unique 6-digit passcode for customers
   - API endpoints for passcode creation and device linking

4. **Activity Tracking Enhancement**
   - Track all customer activities (orders, bookings, views)
   - Store activity history in database linked to customer profile

5. **UI Components**
   - Passcode display/generation screen
   - Device sync interface
   - Activity history view

## Implementation Plan

### Phase 1: Device Identity System

**File: `src/lib/device-identity.ts`** (NEW)
```typescript
// Generate or retrieve unique device ID
// Store in localStorage
// Create device fingerprint using browser info
```

**Key Functions:**
- `getDeviceId()`: Get or create device ID
- `generateDeviceFingerprint()`: Create unique device signature
- `isDeviceRegistered()`: Check if device has customer profile

### Phase 2: Database Schema

**File: `database_migration_customer_profiles.sql`** (NEW)

```sql
-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_passcode VARCHAR(6) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer devices table (link devices to customers)
CREATE TABLE customer_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  device_id VARCHAR(255) UNIQUE NOT NULL,
  device_fingerprint TEXT,
  device_name VARCHAR(255),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer activities table (track all activities)
CREATE TABLE customer_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  device_id VARCHAR(255),
  business_id UUID REFERENCES businesses(id),
  activity_type VARCHAR(50) NOT NULL, -- 'order', 'booking', 'view', 'cart'
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link existing orders to customers
ALTER TABLE orders ADD COLUMN customer_id UUID REFERENCES customers(id);
ALTER TABLE service_bookings ADD COLUMN customer_id UUID REFERENCES customers(id);

-- Indexes for performance
CREATE INDEX idx_customer_devices_customer_id ON customer_devices(customer_id);
CREATE INDEX idx_customer_devices_device_id ON customer_devices(device_id);
CREATE INDEX idx_customer_activities_customer_id ON customer_activities(customer_id);
CREATE INDEX idx_customer_activities_device_id ON customer_activities(device_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_service_bookings_customer_id ON service_bookings(customer_id);
```

### Phase 3: API Functions

**File: `src/lib/customer-api.ts`** (NEW)

```typescript
// Customer profile management
export async function createCustomerProfile(deviceId: string): Promise<{ customerId: string; passcode: string } | null>
export async function getCustomerByPasscode(passcode: string): Promise<Customer | null>
export async function linkDeviceToCustomer(customerId: string, deviceId: string, deviceFingerprint: string): Promise<boolean>
export async function getCustomerDevices(customerId: string): Promise<CustomerDevice[]>
export async function unlinkDevice(customerId: string, deviceId: string): Promise<boolean>

// Activity tracking
export async function trackActivity(customerId: string, deviceId: string, activityType: string, activityData: any): Promise<void>
export async function getCustomerActivities(customerId: string, businessId?: string): Promise<Activity[]>
export async function getCustomerOrders(customerId: string, businessId?: string): Promise<Order[]>
export async function getCustomerBookings(customerId: string, businessId?: string): Promise<ServiceBooking[]>

// Sync functions
export async function syncDeviceData(customerId: string, deviceId: string): Promise<{ orders: string[]; bookings: string[] }>
```

**Update: `src/lib/order-storage.ts`**
```typescript
// Add customer ID to storage
export function linkOrdersToCustomer(customerId: string): void
export function getCustomerId(): string | null
export function setCustomerId(customerId: string): void
```

### Phase 4: UI Components

**File: `src/components/DeviceSyncModal.tsx`** (NEW)
- Display current passcode
- Generate new passcode button
- Input field to enter passcode from another device
- List of linked devices
- Unlink device option

**File: `src/components/ActivityHistory.tsx`** (NEW)
- Display all customer activities across devices
- Filter by business, activity type, date
- Show order history, booking history, viewed items

**File: `src/app/b/[slug]/sync/page.tsx`** (NEW)
- Dedicated page for device sync
- Accessible from menu page
- Shows passcode and sync options

### Phase 5: Integration Points

**Update: `src/components/MenuPage.tsx`**
- Add "Sync Devices" button in header/menu
- Initialize device ID on page load
- Track page views as activity

**Update: `src/lib/api.ts` - `submitOrder()`**
- Include customer ID in order submission
- Track order as customer activity
- Sync order to all customer devices

**Update: `src/lib/api.ts` - `submitServiceBooking()`**
- Include customer ID in booking submission
- Track booking as customer activity
- Sync booking to all customer devices

**Update: `src/components/OrderTrackingPage.tsx`**
- Show orders from all linked devices
- Display device name for each order
- Option to view activity history

## User Flow

### First-Time User
1. Customer scans QR code → lands on `groovevie.com/b/groovevie-serviced-lounge`
2. App generates unique device ID (stored in localStorage)
3. Customer browses menu, adds items to cart
4. On first order/booking, app creates customer profile with 6-digit passcode
5. After order submission, show passcode: "Your sync code: 123456"
6. Customer can view passcode anytime from "Sync Devices" menu

### Syncing Second Device
1. Customer scans QR code on second device
2. App generates new device ID for this device
3. Customer clicks "Sync Devices" → "Link Another Device"
4. Enters passcode from first device: "123456"
5. App links second device to customer profile
6. All orders, bookings, and activities now visible on both devices

### Activity Tracking
All activities are automatically tracked:
- Menu page views
- Items added to cart
- Orders placed
- Service bookings made
- Payment confirmations

## Security Considerations

1. **Passcode Security**
   - 6-digit numeric code (1,000,000 combinations)
   - Rate limiting on passcode verification (max 5 attempts per hour)
   - Passcode regeneration option

2. **Device Fingerprinting**
   - Browser user agent
   - Screen resolution
   - Timezone
   - Language preferences
   - Not foolproof but adds verification layer

3. **Data Privacy**
   - No personal data required initially
   - Customer can optionally add name/phone for orders
   - Data stored per business for privacy

4. **Device Management**
   - Customer can view all linked devices
   - Option to unlink suspicious devices
   - Last active timestamp for each device

## Benefits

### For Customers
✅ No registration required - seamless experience
✅ Track orders across multiple devices
✅ View complete activity history
✅ Simple 6-digit code for syncing
✅ Works offline (localStorage) with online sync

### For Business
✅ Better customer insights
✅ Track repeat customers without authentication
✅ Understand customer behavior across visits
✅ No change to existing QR code system
✅ Enhanced customer experience

## Implementation Effort

### Minimal Changes to Existing Code
- ✅ No changes to QR code system
- ✅ No changes to business routing
- ✅ Existing order storage continues to work
- ✅ Backward compatible with current orders

### New Code Required
- 📝 Device identity system (~100 lines)
- 📝 Customer API functions (~300 lines)
- 📝 Database migration (~50 lines SQL)
- 📝 UI components (~400 lines)
- 📝 Integration updates (~200 lines)

**Total: ~1,050 lines of new code**

## Testing Checklist

- [ ] Device ID generation works on first visit
- [ ] Passcode generation on first order
- [ ] Passcode verification works correctly
- [ ] Device linking syncs existing orders
- [ ] Activity tracking captures all events
- [ ] Multi-device sync works in real-time
- [ ] Unlink device removes access
- [ ] Rate limiting prevents brute force
- [ ] Works across different browsers
- [ ] localStorage persistence works
- [ ] Backward compatibility with existing orders

## Rollout Strategy

### Phase 1: Foundation (Week 1)
- Implement device identity system
- Create database schema
- Deploy migration

### Phase 2: Core Features (Week 2)
- Build customer API functions
- Implement passcode generation
- Add device linking logic

### Phase 3: UI & Integration (Week 3)
- Create sync modal component
- Add activity history view
- Integrate with order/booking flows

### Phase 4: Testing & Polish (Week 4)
- End-to-end testing
- Security testing
- Performance optimization
- Documentation

## Conclusion

**YES, this is absolutely possible and can be achieved without breaking any existing functionality!**

The app already has the foundation with device-based order tracking. We just need to:
1. Add a customer profile system with passcodes
2. Link devices to customer profiles
3. Sync data across linked devices
4. Track all customer activities

The existing QR code system, business routing, and order flow remain completely unchanged. This is a pure enhancement that adds value without disrupting current operations.

Would you like me to start implementing this? I can begin with any phase you prefer.
