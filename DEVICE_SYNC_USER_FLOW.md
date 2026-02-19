# Device Sync - User Flow Visualization

## 🎯 Complete User Journey

### Scenario: Customer with Two Devices (Phone & Tablet)

---

## 📱 DEVICE 1 (Phone) - First Visit

### Step 1: Customer Scans QR Code
```
Customer scans business QR code at table
        ↓
Opens: groovevie.com/b/groovevie-serviced-lounge
        ↓
App automatically generates Device ID: "dev_abc123"
Stored in localStorage
```

### Step 2: Browse & Order
```
Customer browses menu
Adds items to cart
Places order
        ↓
Order saved to localStorage
Order ID: "order_xyz789"
```

### Step 3: Create Sync Profile
```
Customer clicks "Sync Devices" button (bottom-left)
        ↓
Modal opens with two options:
  [Create Profile & Get Passcode]
  [I Have a Passcode]
        ↓
Customer clicks "Create Profile & Get Passcode"
        ↓
System creates:
  - Customer Profile (ID: cust_456)
  - Sync Passcode: "123456"
  - Links Device "dev_abc123" to profile
        ↓
Modal shows:
  ┌─────────────────────────────┐
  │ Your Sync Passcode          │
  │                             │
  │  ┌─────────────┐  [Copy]   │
  │  │  123 456    │            │
  │  └─────────────┘            │
  │                             │
  │ Use this code to link       │
  │ other devices               │
  └─────────────────────────────┘
```

---

## 💻 DEVICE 2 (Tablet) - Later That Day

### Step 1: Customer Opens App on Tablet
```
Customer scans same QR code on tablet
        ↓
Opens: groovevie.com/b/groovevie-serviced-lounge
        ↓
App generates NEW Device ID: "dev_xyz999"
(Different device = different ID)
```

### Step 2: Link to Existing Profile
```
Customer clicks "Sync Devices" button
        ↓
Modal opens with two options:
  [Create Profile & Get Passcode]
  [I Have a Passcode]  ← Customer clicks this
        ↓
Shows passcode input screen:
  ┌─────────────────────────────┐
  │ Link This Device            │
  │                             │
  │ Enter 6-digit passcode      │
  │ from your other device      │
  │                             │
  │  ┌─────────────┐            │
  │  │ [______]    │            │
  │  └─────────────┘            │
  │                             │
  │  [Link Device]              │
  └─────────────────────────────┘
        ↓
Customer enters: "123456"
        ↓
System:
  - Finds customer profile (cust_456)
  - Links device "dev_xyz999" to profile
  - Syncs all existing orders
        ↓
Success! Both devices now linked
```

### Step 3: View Synced Orders
```
Customer goes to "Track Orders"
        ↓
Sees order from Phone (order_xyz789)
Even though it was placed on different device!
        ↓
Both devices show same order history
```

---

## 🔄 Ongoing Usage

### On Phone (Device 1)
```
Customer places new order
        ↓
Order includes customer_id: "cust_456"
        ↓
Order visible on BOTH devices immediately
```

### On Tablet (Device 2)
```
Customer views order tracking
        ↓
Sees orders from:
  - Phone (Device 1)
  - Tablet (Device 2)
        ↓
Complete unified history
```

---

## 🛠️ Device Management

### View Linked Devices
```
Customer opens "Sync Devices" modal
        ↓
Shows:
  ┌─────────────────────────────┐
  │ Your Sync Passcode          │
  │  123 456          [Copy]    │
  │                             │
  │ Linked Devices (2)          │
  │                             │
  │ ┌─────────────────────────┐ │
  │ │ 📱 iPhone               │ │
  │ │ Last active: Today      │ │
  │ │ [This Device]      [🗑️] │ │
  │ └─────────────────────────┘ │
  │                             │
  │ ┌─────────────────────────┐ │
  │ │ 💻 Chrome Browser       │ │
  │ │ Last active: 2 days ago │ │
  │ │                    [🗑️] │ │
  │ └─────────────────────────┘ │
  └─────────────────────────────┘
```

### Unlink Device
```
Customer clicks trash icon on old device
        ↓
Confirmation: "Are you sure?"
        ↓
Device removed from profile
        ↓
That device can no longer see orders
(Unless re-linked with passcode)
```

### Regenerate Passcode
```
Customer clicks "New Code" button
        ↓
Confirmation: "Old passcode will stop working"
        ↓
New passcode generated: "789012"
        ↓
Old passcode "123456" no longer works
Existing devices stay linked
```

---

## 📊 What Gets Tracked

### Automatic Tracking
```
✅ Page Views
   - When customer visits menu page
   - Tracked per business

✅ Orders (when integrated)
   - Order ID
   - Amount
   - Business
   - Device used

✅ Service Bookings (when integrated)
   - Booking ID
   - Service type
   - Device used

✅ Cart Actions (when integrated)
   - Items added
   - Quantities
   - Device used
```

---

## 🔒 Security Features

### Passcode Protection
```
6-digit numeric code
1,000,000 possible combinations
Unique across all customers
Can be regenerated anytime
```

### Device Fingerprinting
```
Each device tracked by:
  - Browser user agent
  - Screen resolution
  - Timezone
  - Language
  - Platform

Used for verification (not authentication)
```

### Device Management
```
Customer can:
  ✅ View all linked devices
  ✅ See last active time
  ✅ Unlink suspicious devices
  ✅ Regenerate passcode if compromised
```

---

## 💡 Key Benefits

### For Customers
```
✅ No registration required
✅ No email/password to remember
✅ Simple 6-digit code
✅ Works across all devices
✅ Complete order history
✅ Privacy-focused
```

### For Business
```
✅ Track repeat customers
✅ No authentication friction
✅ Better customer insights
✅ Cross-device analytics
✅ Foundation for loyalty programs
✅ Seamless QR code experience
```

---

## 🎨 UI Elements

### Sync Button Location
```
Menu Page:
┌─────────────────────────────┐
│  [←] Business Name          │
│                             │
│  Menu Items...              │
│                             │
│                             │
│                             │
│  [📱]              [🛒 3]  │ ← Sync (left) & Cart (right)
└─────────────────────────────┘
```

### Modal Design
```
- Themed to match business colors
- Smooth animations
- Copy-to-clipboard functionality
- Clear device indicators
- Responsive design
- Touch-friendly buttons
```

---

## 🚀 Implementation Status

✅ Device identity system
✅ Customer profile creation
✅ Passcode generation
✅ Device linking
✅ Multi-device sync
✅ Order tracking across devices
✅ Device management UI
✅ Passcode regeneration
✅ Activity tracking foundation
✅ API endpoints
✅ Database schema
✅ Backward compatibility

Ready to use! Just run the database migration and test.
