# Admin Settings API - Usage Examples

## Overview
This document provides practical examples for administrators and developers to manage system settings via the API and database.

## API Endpoints

### Base URL
```
http://localhost:3000/api/system/settings
```

## Examples

### 1. Get Current Token Percentage

```bash
# Using cURL
curl "http://localhost:3000/api/system/settings?key=cashback_token_percentage"

# Using Fetch in JavaScript
fetch('/api/system/settings?key=cashback_token_percentage')
  .then(res => res.json())
  .then(data => console.log('Current percentage:', data.setting.setting_value))
```

**Response:**
```json
{
  "setting": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "setting_key": "cashback_token_percentage",
    "setting_value": "2",
    "description": "Percentage of order total awarded as cashback tokens (e.g., 2 means 2%)",
    "data_type": "number",
    "created_at": "2024-10-16T10:00:00Z",
    "updated_at": "2024-10-16T10:00:00Z"
  }
}
```

### 2. Update Token Percentage to 5%

```bash
# Using cURL
curl -X POST http://localhost:3000/api/system/settings \
  -H "Content-Type: application/json" \
  -d '{
    "setting_key": "cashback_token_percentage",
    "setting_value": "5"
  }'

# Using Fetch in JavaScript
async function updateTokenPercentage(newPercentage) {
  const response = await fetch('/api/system/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      setting_key: 'cashback_token_percentage',
      setting_value: String(newPercentage)
    })
  })
  
  const result = await response.json()
  console.log('Updated:', result.message)
  return result
}

// Usage
updateTokenPercentage(5)

# Using Python
import requests

url = 'http://localhost:3000/api/system/settings'
payload = {
    'setting_key': 'cashback_token_percentage',
    'setting_value': '5'
}

response = requests.post(url, json=payload)
print(response.json())
```

**Response:**
```json
{
  "success": true,
  "setting": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "setting_key": "cashback_token_percentage",
    "setting_value": "5",
    "description": "Percentage of order total awarded as cashback tokens (e.g., 2 means 2%)",
    "data_type": "number",
    "created_at": "2024-10-16T10:00:00Z",
    "updated_at": "2024-10-16T10:30:00Z"
  },
  "message": "Setting updated and will be reflected in real-time across all connected clients"
}
```

**What Happens:**
- ✅ Database updated immediately
- ✅ All active users see 5% instantly
- ✅ No page refresh needed
- ✅ Button text shows new amount

### 3. Get All Settings

```bash
# Using cURL
curl http://localhost:3000/api/system/settings

# Using Fetch
fetch('/api/system/settings')
  .then(res => res.json())
  .then(data => console.log('All settings:', data.settings))
```

**Response:**
```json
{
  "settings": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "setting_key": "cashback_token_percentage",
      "setting_value": "5",
      "description": "Percentage of order total awarded as cashback tokens (e.g., 2 means 2%)",
      "data_type": "number",
      "created_at": "2024-10-16T10:00:00Z",
      "updated_at": "2024-10-16T10:30:00Z"
    }
  ]
}
```

## Practical Scenarios

### Scenario 1: Promotional Campaign - Increase Rewards

**Goal:** Run a week-long promotion offering 10% cashback instead of 2%

```bash
# Day 1 - Launch promotion
curl -X POST http://localhost:3000/api/system/settings \
  -H "Content-Type: application/json" \
  -d '{
    "setting_key": "cashback_token_percentage",
    "setting_value": "10"
  }'

# Result: All users see 10% instantly
# Orders placed during this week earn 10% tokens

# Day 8 - End promotion
curl -X POST http://localhost:3000/api/system/settings \
  -H "Content-Type: application/json" \
  -d '{
    "setting_key": "cashback_token_percentage",
    "setting_value": "2"
  }'

# Result: Back to 2% instantly
```

### Scenario 2: A/B Testing

**Goal:** Test if 3% performs better than 2%

```bash
# Group 1 (50% of users) - See 3%
# Manually update in Supabase, monitor engagement

curl -X POST http://localhost:3000/api/system/settings \
  -H "Content-Type: application/json" \
  -d '{
    "setting_key": "cashback_token_percentage",
    "setting_value": "3"
  }'

# After testing period, analyze results and decide
# If 3% wins, keep it. If 2% wins, revert.
```

### Scenario 3: VIP Member Premium - Varying Rates

**Note:** Current system supports single percentage. For per-customer rates:

```javascript
// Future enhancement: Add tier-based settings
// POST /api/system/settings
{
  "setting_key": "cashback_token_percentage_standard",
  "setting_value": "2"
}

// And VIP gets 5% (handled via custom order logic)
```

## Database Direct Management

### Update via Supabase SQL Editor

```sql
-- View current setting
SELECT * FROM system_settings 
WHERE setting_key = 'cashback_token_percentage';

-- Update percentage to 7%
UPDATE system_settings 
SET setting_value = '7', updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'cashback_token_percentage';

-- Verify update
SELECT * FROM system_settings 
WHERE setting_key = 'cashback_token_percentage';
```

**Real-Time Effect:**
- Update executes in Supabase
- Real-time event broadcasts to all connected clients
- All browser tabs update instantly
- Token calculations use new percentage

### Batch Check Multiple Settings

```sql
SELECT setting_key, setting_value, updated_at 
FROM system_settings 
ORDER BY updated_at DESC;

-- Result shows all settings and when they were last changed
```

## Monitoring & Auditing

### View Change History

```sql
-- For future: Add audit log table
CREATE TABLE system_settings_audit (
  id UUID PRIMARY KEY,
  setting_key VARCHAR(255),
  old_value TEXT,
  new_value TEXT,
  changed_by VARCHAR(255),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Then track all changes for compliance
```

### Track Usage Impact

```bash
# After changing percentage, monitor:
# 1. Order count
# 2. Average order value
# 3. Token redemption rate
# 4. Customer satisfaction

# Example: Compare metrics before/after change
SELECT 
  DATE(created_at) as date,
  COUNT(*) as order_count,
  AVG(total_amount) as avg_order_value
FROM orders
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Rate Limiting Best Practices

**Recommendations for API usage:**

```javascript
// Don't update settings frequently
// Wait at least 5 minutes between changes

// Good: Update for business reasons
// Bad: Update every 10 seconds to "optimize"

// Recommended update frequency:
// - Once per week: Test different rates
// - Once per month: Major promotional changes
// - Rarely: Fine-tuning performance
```

## Error Handling

### Missing Required Fields

```bash
curl -X POST http://localhost:3000/api/system/settings \
  -H "Content-Type: application/json" \
  -d '{
    "setting_key": "cashback_token_percentage"
    # Missing setting_value
  }'
```

**Response:**
```json
{
  "error": "Missing required fields: setting_key, setting_value"
}
```

### Invalid Setting Key

```bash
curl "http://localhost:3000/api/system/settings?key=nonexistent_setting"
```

**Response:**
```json
{
  "error": "Setting 'nonexistent_setting' not found"
}
```

## Advanced: Create Admin Dashboard Component

### React Component Example

```typescript
'use client'

import { useState } from 'react'
import { useAllSystemSettings } from '@/hooks/useSystemSettings'

export default function AdminSettingsPanel() {
  const { settings, loading } = useAllSystemSettings()
  const [updating, setUpdating] = useState(false)

  const handleUpdate = async (key: string, newValue: string) => {
    setUpdating(true)
    try {
      const response = await fetch('/api/system/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setting_key: key,
          setting_value: newValue
        })
      })
      
      if (response.ok) {
        alert(`Updated ${key} successfully!`)
        // No refresh needed - hook updates automatically
      } else {
        alert('Error updating setting')
      }
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">System Settings</h2>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {settings.map(setting => (
            <div key={setting.id} className="p-4 border rounded">
              <label className="block text-sm font-semibold mb-2">
                {setting.setting_key}
              </label>
              <input 
                type="text"
                defaultValue={setting.setting_value}
                onBlur={(e) => {
                  if (e.target.value !== setting.setting_value) {
                    handleUpdate(setting.setting_key, e.target.value)
                  }
                }}
                className="w-full px-3 py-2 border rounded"
                disabled={updating}
              />
              <p className="text-xs text-gray-500 mt-1">
                {setting.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## Testing Your Changes

### Test 1: Single Tab Update
```javascript
// In browser console
fetch('/api/system/settings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    setting_key: 'cashback_token_percentage',
    setting_value: '8'
  })
}).then(r => r.json()).then(d => console.log('Updated:', d))
```

**Result:** Button shows new percentage instantly

### Test 2: Multi-Tab Test
1. Open app in two tabs
2. Run update in one tab
3. **Both tabs update simultaneously** ✅

### Test 3: Mobile Device Test
1. Open app on mobile
2. Update setting on desktop
3. **Mobile updates instantly** ✅

## Rollback Procedures

### Quick Rollback If Something Goes Wrong

```bash
# If new percentage causes issues, revert quickly:
curl -X POST http://localhost:3000/api/system/settings \
  -H "Content-Type: application/json" \
  -d '{
    "setting_key": "cashback_token_percentage",
    "setting_value": "2"
  }'

# Deployed instantly to all users
```

## API Response Time

Typical response times:
- **API call:** < 100ms
- **Database update:** < 50ms
- **Real-time broadcast:** < 500ms
- **UI update:** < 1000ms

**Total end-to-end:** ~1-2 seconds for all users to see the change

## Webhooks (Future Enhancement)

Could add webhooks to notify external systems:
```javascript
// Future: Notify analytics, logging, etc when settings change
POST /webhooks/setting-changed
{
  "setting_key": "cashback_token_percentage",
  "old_value": "2",
  "new_value": "5",
  "changed_at": "2024-10-16T12:00:00Z"
}
```

## Summary

✅ Real-time API for settings management
✅ Instant broadcast to all connected users
✅ No page refresh required
✅ Error handling and validation
✅ Suitable for A/B testing and promotions
✅ Future-proof extensible system
