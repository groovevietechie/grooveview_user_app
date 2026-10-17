# Dynamic Cashback Token Percentage Implementation

## Overview
This implementation makes the cashback token percentage dynamic and configurable from the database, replacing the hardcoded 2% value throughout the application.

## Architecture

### 1. Database Layer
**File**: `database_migration_system_settings.sql`
- Creates `system_settings` table with columns:
  - `id` (UUID PK)
  - `setting_key` (unique identifier for the setting)
  - `setting_value` (the actual value)
  - `description` (documentation)
  - `data_type` (for future extensibility)
  - `created_at` / `updated_at` (timestamps)
- Initializes `cashback_token_percentage` setting with default value of `2`
- Includes RLS policies for public read and authenticated update access
- Creates index on `setting_key` for fast lookups

### 2. API Layer

#### System Settings Endpoint
**File**: `src/app/api/system/settings/route.ts`
- **GET /api/system/settings** - Fetch all settings or specific setting
  - Query param: `?key=cashback_token_percentage`
  - Returns: `{ setting: { setting_key, setting_value, ... } }`
- **POST /api/system/settings** - Update a system setting
  - Body: `{ setting_key: string, setting_value: string }`
  - Returns: `{ success: true, setting: { ... } }`
  - Uses upsert for idempotency

#### Award Tokens Endpoint (Updated)
**File**: `src/app/api/customers/[customerId]/award-tokens/route.ts`
- Added `getCashbackTokenPercentage()` async function
  - Fetches percentage from `system_settings` table
  - Falls back to 2% if setting not found
  - Caches decision in logs for debugging
- Modified token calculation to use dynamic percentage:
  ```typescript
  const tokenPercentage = await getCashbackTokenPercentage()
  const tokensToAward = Math.round(order_total * (tokenPercentage / 100) * 100) / 100
  ```

### 3. Client-Side Implementation

#### Customer API Helper
**File**: `src/lib/customer-api.ts`
- Added `getCashbackTokenPercentage()` async function
  - Calls `/api/system/settings?key=cashback_token_percentage`
  - Returns numeric percentage value
  - Defaults to 2% on error with warning logs
- Updated `awardTokensForOrder()` JSDoc to reflect dynamic percentage

#### Order Tracking Page
**File**: `src/components/OrderTrackingPage.tsx`
- Added `tokenPercentage` state (initialized to 2)
- Added `fetchTokenPercentage()` function called on component mount
- Updated token calculation in:
  - `handleClaimTokens()` - Uses dynamic percentage for fallback calculation
  - Claim button text - Shows dynamic token amount based on current percentage
- Token amount formula: `Math.round(order_total * (tokenPercentage / 100) * 100) / 100`

#### Device Sync Modal
**File**: `src/components/DeviceSyncModal.tsx`
- Created `RewardTokensInfo` sub-component
  - Fetches token percentage on mount via `getCashbackTokenPercentage()`
  - Displays dynamic percentage: "Earn {percentage}% tokens on every completed order"
  - Shows loading state while fetching
  - Defaults to 2% on error
- Replaced hardcoded "2%" text with dynamic component

## Usage

### Default Behavior
- System initializes with 2% cashback token percentage
- If database setting is missing, all components default to 2%
- Safe error handling with fallbacks throughout

### Updating Token Percentage
The token percentage can be updated via:

1. **Direct API Call**
```bash
curl -X POST http://localhost:3000/api/system/settings \
  -H "Content-Type: application/json" \
  -d '{"setting_key": "cashback_token_percentage", "setting_value": "5"}'
```

2. **Database Direct Update**
```sql
UPDATE system_settings 
SET setting_value = '5' 
WHERE setting_key = 'cashback_token_percentage';
```

3. **Frontend Admin Panel** (to be implemented)
- Can create a settings management page that calls the POST endpoint

### Reading Token Percentage
```bash
curl http://localhost:3000/api/system/settings?key=cashback_token_percentage
```

Response:
```json
{
  "setting": {
    "id": "uuid",
    "setting_key": "cashback_token_percentage",
    "setting_value": "2",
    "description": "Percentage of order total awarded as cashback tokens...",
    "data_type": "number",
    "created_at": "2024-10-16T00:00:00Z",
    "updated_at": "2024-10-16T00:00:00Z"
  }
}
```

## Files Modified

1. **database_migration_system_settings.sql** - NEW
   - System settings table and initialization

2. **src/app/api/system/settings/route.ts** - NEW
   - System settings API endpoints

3. **src/app/api/customers/[customerId]/award-tokens/route.ts**
   - Added dynamic token percentage fetching
   - Replaced hardcoded 0.02 with dynamic calculation

4. **src/lib/customer-api.ts**
   - Added `getCashbackTokenPercentage()` helper function

5. **src/components/OrderTrackingPage.tsx**
   - Added token percentage state and fetching
   - Updated token calculations and UI to use dynamic percentage

6. **src/components/DeviceSyncModal.tsx**
   - Added `RewardTokensInfo` sub-component with dynamic percentage display
   - Replaced hardcoded percentage text

## Testing Checklist

- [x] Build succeeds without errors
- [ ] Database migration runs successfully
- [ ] API endpoint `/api/system/settings` returns default 2% setting
- [ ] API endpoint accepts POST updates to token percentage
- [ ] Order tracking page displays correct token amounts based on percentage
- [ ] Device sync modal shows dynamic percentage
- [ ] Token awarding calculates correctly with new percentage
- [ ] Fallback to 2% works when setting is missing
- [ ] Changes to percentage reflect immediately in new orders/sessions

## Future Enhancements

1. **Admin Settings Panel**
   - Create UI for managing system settings
   - Add validation for percentage ranges (0-100)

2. **More Settings**
   - Can extend system_settings table for other configurable values:
     - Token redemption rate
     - Minimum order amount for token eligibility
     - Bonus multiplier events

3. **Audit Trail**
   - Track changes to settings with timestamps and user info
   - Add `changed_by`, `change_reason` columns

4. **Caching**
   - Add Redis caching for frequently-read settings
   - Implement cache invalidation on updates

5. **Versioning**
   - Support multiple concurrent setting versions
   - Enable A/B testing different token percentages

## Database Migration Commands

To apply the migration:
```sql
-- Run the SQL from database_migration_system_settings.sql
-- in your Supabase SQL Editor or psql client
```

## Backward Compatibility

- All existing orders continue to work
- New orders use the database-configured percentage
- Tokens already awarded are not affected by percentage changes
- System safely falls back to 2% if setting is missing
