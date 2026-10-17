# Real-Time System Settings Updates

## Overview
This implementation enables real-time synchronization of system settings across all connected clients. When a setting is updated in the database, all active browser sessions and components automatically receive and display the new value without requiring a page refresh.

## Architecture

### Three-Layer Update System

#### 1. **Supabase Real-Time Subscriptions (Database → Server)**
- Listens for changes to `system_settings` table
- Triggered by INSERT, UPDATE, or DELETE operations
- Requires `REPLICA IDENTITY FULL` on the table for full row details
- Automatically picks up changes made directly to the database or via SQL

#### 2. **Event Broadcasting System (Component → Component)**
- File: `src/lib/settings-events.ts`
- Local pub/sub system for same-tab communication
- Fallback for components that don't use `useSystemSetting` hook
- Uses `localStorage` events for cross-tab communication

#### 3. **React Hooks (Component State)**
- File: `src/hooks/useSystemSettings.ts`
- `useSystemSetting()` - Subscribe to single setting with real-time updates
- `useAllSystemSettings()` - Subscribe to all settings at once
- Combines Supabase real-time with local event broadcasting

### Component Integration

#### OrderTrackingPage
- Uses `useSystemSetting("cashback_token_percentage", "2")`
- Automatically updates button text and token calculations
- No polling or manual refresh needed

#### DeviceSyncModal
- RewardTokensInfo sub-component uses the hook
- Displays dynamic percentage in real-time
- Updates instantly when admin changes percentage

#### Award Tokens API
- Fetches current percentage from database on each request
- Ensures server-side calculations use latest value

## How It Works

### Update Flow Diagram
```
Database Update
    ↓
Supabase Realtime Notification
    ↓
useSystemSetting Hook receives event
    ↓
broadcastSettingChange() called
    ↓
├─ Local listeners notified immediately
├─ localStorage event broadcasts to other tabs
└─ React state updated
    ↓
Components re-render with new value
```

### When You Update Token Percentage

**Example: Change from 2% to 5%**

```bash
curl -X POST http://localhost:3000/api/system/settings \
  -H "Content-Type: application/json" \
  -d '{"setting_key": "cashback_token_percentage", "setting_value": "5"}'
```

**What Happens:**
1. API updates `system_settings` table in database
2. Supabase detects the change
3. Real-time subscriptions in all browser tabs receive notification
4. `useSystemSetting` hooks update their state
5. Components re-render showing 5% instead of 2%
6. All new token calculations use 5%

**Result:** All active users see the change immediately, no refresh needed.

## Key Files

### New Files
- `src/hooks/useSystemSettings.ts` - Real-time subscription hooks
- `src/lib/settings-events.ts` - Event broadcasting system
- `database_migration_system_settings.sql` - Updated with `REPLICA IDENTITY FULL`
- `REALTIME_SETTINGS_UPDATE.md` - This documentation

### Modified Files
- `src/components/OrderTrackingPage.tsx` - Uses `useSystemSetting` hook
- `src/components/DeviceSyncModal.tsx` - Uses hook in RewardTokensInfo
- `src/app/api/system/settings/route.ts` - Added documentation about real-time broadcasting

## Usage Examples

### In Components

#### Subscribe to Single Setting
```typescript
function MyComponent() {
  const { value, loading, error } = useSystemSetting(
    "cashback_token_percentage",
    "2" // default value
  )
  
  const percentage = Number(value) || 2

  return (
    <div>
      {loading ? "Loading..." : `Earn ${percentage}% tokens`}
      {error && <p>Error: {error}</p>}
    </div>
  )
}
```

#### Subscribe to All Settings
```typescript
function AdminPanel() {
  const { settings, loading, error } = useAllSystemSettings()

  return (
    <div>
      {settings.map((setting) => (
        <div key={setting.id}>
          {setting.setting_key}: {setting.setting_value}
        </div>
      ))}
    </div>
  )
}
```

### Update Settings from API

```typescript
async function updateTokenPercentage(newPercentage: number) {
  const response = await fetch("/api/system/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      setting_key: "cashback_token_percentage",
      setting_value: String(newPercentage),
    }),
  })

  const result = await response.json()
  // Changes are automatically reflected in all components using useSystemSetting
  console.log(result.message) // "Setting updated and will be reflected in real-time..."
}
```

### Direct Database Update

```sql
-- Update directly in Supabase
UPDATE system_settings 
SET setting_value = '5'
WHERE setting_key = 'cashback_token_percentage';

-- All connected clients receive real-time notification
-- and update their UI automatically
```

## Real-Time Features

### Automatic Updates
- ✅ No polling needed
- ✅ Sub-second latency (depends on network)
- ✅ Works across browser tabs
- ✅ Handles INSERT, UPDATE, DELETE operations

### Error Handling
- Graceful fallbacks to default values
- Console warnings for debugging
- Errors don't break component functionality
- Automatic reconnection on disconnection

### Performance
- Efficient subscription management
- Automatic cleanup on component unmount
- No memory leaks
- Minimal network overhead

## Database Configuration

### Required Setup

1. **Enable Real-Time on Table**
```sql
ALTER TABLE system_settings REPLICA IDENTITY FULL;
```

2. **Enable RLS** (if desired)
```sql
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
```

3. **Create Policies**
```sql
-- Public read access
CREATE POLICY "Allow public read" ON system_settings
  FOR SELECT USING (true);

-- Authenticated updates
CREATE POLICY "Allow authenticated update" ON system_settings
  FOR UPDATE USING (auth.role() = 'authenticated');
```

## Monitoring and Debugging

### Console Logs
Enable browser developer console to see real-time updates:

```
[useSystemSetting] Real-time update for 'cashback_token_percentage': {...}
[SettingsEvents] Broadcasting change: cashback_token_percentage=5
[useSystemSetting] Received broadcast for 'cashback_token_percentage': 5
```

### Subscription Status
```
[useSystemSetting] Subscription status for 'cashback_token_percentage': SUBSCRIBED
```

### Common Issues

**Changes not appearing?**
1. Check browser console for errors
2. Verify `REPLICA IDENTITY FULL` is set on table
3. Confirm RLS policies allow read access
4. Check network tab for real-time events

**Delayed updates?**
1. May indicate network latency
2. Check browser console for subscription status
3. Verify Supabase real-time is enabled in project

## Adding New Settings

### 1. Add to Database
```sql
INSERT INTO system_settings (setting_key, setting_value, description, data_type)
VALUES ('new_setting_name', 'default_value', 'Description', 'string');
```

### 2. Use in Component
```typescript
const { value } = useSystemSetting("new_setting_name", "default_value")
```

### 3. Update via API
```bash
curl -X POST http://localhost:3000/api/system/settings \
  -H "Content-Type: application/json" \
  -d '{"setting_key": "new_setting_name", "setting_value": "new_value"}'
```

## Security Considerations

- Real-time subscriptions respect RLS policies
- Settings are typically public-read, admin-write
- Use authentication for sensitive settings
- Validate all inputs server-side
- Consider rate-limiting settings updates

## Future Enhancements

1. **Admin Dashboard**
   - UI for managing all system settings
   - Real-time preview of changes
   - Audit trail of who changed what

2. **Settings History**
   - Track all changes with timestamps
   - Rollback capability
   - Change notifications

3. **Feature Flags**
   - Use system_settings for feature toggles
   - A/B testing support
   - Canary deployments

4. **Performance Tuning**
   - Cache frequently-read settings
   - Batch updates
   - Debounce broadcasts

## Troubleshooting

### Real-time not working?

1. **Verify REPLICA IDENTITY**
```sql
SELECT relreplident FROM pg_class WHERE relname = 'system_settings';
-- Should return 'f' (full)
```

2. **Check Supabase Real-time Status**
   - Go to Supabase Dashboard → Real-time
   - Verify extension is enabled

3. **Test Direct Update**
```sql
UPDATE system_settings SET setting_value = 'test' 
WHERE setting_key = 'cashback_token_percentage';
-- Check if console logs the update
```

4. **Enable Debug Logging**
```typescript
// In component
const { value } = useSystemSetting("setting_key")
// Watch browser console for logs
```

## Testing

### Manual Test
1. Open app in two browser tabs
2. Update setting via API in one tab
3. Verify other tab updates without refresh
4. Check mobile device if using multi-device setup

### Automated Testing
```typescript
// Example test with Vitest
it("updates token percentage in real-time", async () => {
  const { result } = renderHook(() => 
    useSystemSetting("cashback_token_percentage", "2")
  )
  
  expect(result.current.value).toBe("2")
  
  // Simulate database update
  // Verify hook receives update
  // Verify component re-renders
})
```
