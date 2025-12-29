# Service Integration Guide

## Overview

The GrooveVie customer app has been updated to include comprehensive service booking functionality alongside the existing menu ordering system. This integration allows customers to book services like room reservations, party packages, and custom services offered by businesses.

## New Features Added

### 1. Service Booking System
- **Service Type Selection**: Choose from available service types (Room Booking, Party Booking, Custom Services)
- **Service Options**: Browse and select from various service options (drinks, food, performers, etc.)
- **Booking Form**: Complete booking with customer details, event date, and special requests
- **Booking Confirmation**: Success page with booking ID and next steps

### 2. Updated Menu Layout
The main menu page now follows the layout shown in the provided image:
- **Food**: Traditional menu items and food categories
- **Drinks**: Beverage categories and items
- **Services**: Service booking functionality

### 3. Dual Cart System
- **Menu Cart**: For food and drink orders
- **Service Cart**: For service bookings
- **Smart Sidebar**: Automatically shows the appropriate cart based on current selection

## Technical Implementation

### Database Types Extended
```typescript
// New service-related types added to database.ts
ServiceConfiguration, ServiceOption, ServiceBooking, ServiceStatus
ServiceCart, ServiceCartItem
```

### API Functions Added
```typescript
// New API functions in lib/api.ts
getServiceConfigurations(businessId)
getServiceOptions(businessId, category?)
submitServiceBooking(bookingData)
```

### State Management
```typescript
// New Zustand store: store/serviceStore.ts
- Service cart management
- Booking details tracking
- Service type selection
- Business ID management
```

### Component Architecture

#### Main Components
- `ServiceFlow.tsx`: Main service booking flow controller
- `ServiceSidebar.tsx`: Service cart sidebar
- `ServiceBookingSuccess.tsx`: Booking confirmation page

#### Service Flow Components
- `ServiceTypeSelection.tsx`: Choose service type
- `ServiceOptionsGrid.tsx`: Browse and select service options
- `ServiceBookingForm.tsx`: Complete booking details

#### Updated Components
- `MenuList.tsx`: Now includes main category selection
- `MenuPage.tsx`: Smart sidebar switching
- `MainCategorySelection.tsx`: Food/Drinks/Services selection

## Usage Flow

### For Customers
1. **Browse Categories**: Select Food, Drinks, or Services
2. **Service Selection**: Choose from available service types
3. **Options Selection**: Browse and add service options to cart
4. **Booking Details**: Fill in customer information and event details
5. **Confirmation**: Receive booking confirmation with ID

### For Businesses
Businesses need to set up their service configurations and options in the business app:

1. **Service Configuration**: Define service types (Room Booking, Party Booking, etc.)
2. **Service Options**: Add available options with categories and pricing
3. **Manage Bookings**: View and manage incoming service bookings

## Service Categories

The system supports the following service option categories:
- **Rooms**: Different room types and sizes
- **Drinks**: Water, Beer, Whiskey, Spirit, Cognac, Gin, Rum, Cocktail, Bitters
- **Food**: Menu items and catering options
- **Shisha**: Various flavors and types
- **Escorts**: Professional escort services
- **Performers**: Strippers, Dancers, Singers
- **Branded Wears**: Custom clothing and accessories
- **Accessories**: Balloons, Face Masks, decorations
- **DJ Services**: Music and entertainment services

## Database Schema

### Service Tables
- `service_configurations`: Business service setup
- `service_options`: Available service options
- `service_bookings`: Customer bookings
- `service_types`: Custom service type definitions

### Key Features
- **Status Workflow**: pending → confirmed → inProgress → completed/cancelled
- **JSONB Storage**: Flexible service details and metadata
- **Category Validation**: Enforced service option categories
- **Price Validation**: Non-negative pricing constraints

## Styling and Theming

The service components inherit the business theme color and maintain consistency with the existing design system:
- Dynamic theme colors from business profile
- Consistent component styling
- Responsive design for mobile and desktop
- Smooth transitions and hover effects

## Error Handling

Comprehensive error handling includes:
- Network request failures
- Validation errors
- Database constraint violations
- User-friendly error messages
- Graceful fallbacks

## Future Enhancements

Potential improvements for future versions:
- Real-time booking status updates
- Calendar integration for event scheduling
- Payment processing integration
- Service booking history
- Rating and review system
- Push notifications for booking updates

## Testing

To test the service functionality:
1. Ensure the business has service configurations set up
2. Add service options with various categories
3. Test the complete booking flow
4. Verify booking submission and confirmation
5. Check sidebar switching between menu and service carts

## Dependencies

New dependencies added:
- No additional external dependencies required
- Uses existing Zustand for state management
- Leverages existing Supabase client
- Utilizes existing UI components and styling system

## Migration Notes

For existing deployments:
1. Database migrations are already in place in the business app
2. No breaking changes to existing menu functionality
3. Service features are additive and optional
4. Backward compatibility maintained

## Support

For issues or questions regarding the service integration:
1. Check the business app has service configurations enabled
2. Verify database permissions for service tables
3. Ensure proper API endpoint access
4. Review browser console for any JavaScript errors