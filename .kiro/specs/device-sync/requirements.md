# Requirements Document

## Introduction

This document specifies the requirements for a device synchronization and user activity tracking system that enables customers to access their orders, bookings, and activity history across multiple devices using a simple passcode-based linking mechanism. The system operates without requiring traditional user authentication, maintaining the seamless QR code-based experience while adding cross-device continuity.

## Glossary

- **Device ID**: A unique identifier generated for each browser/device that accesses the application
- **Customer Profile**: A database record that aggregates activity and devices for a single customer
- **Sync Passcode**: A 6-digit numeric code used to link multiple devices to a single customer profile
- **Device Fingerprint**: A collection of browser and device characteristics used for device verification
- **Customer Activity**: Any trackable action performed by a customer (orders, bookings, page views, cart actions)
- **Device Linking**: The process of associating a new device with an existing customer profile using a passcode
- **Application**: The customer-facing web application accessed via QR codes
- **localStorage**: Browser-based persistent storage mechanism

## Requirements

### Requirement 1

**User Story:** As a first-time customer, I want the application to automatically track my device, so that my orders and activities are remembered without requiring registration.

#### Acceptance Criteria

1. WHEN a customer visits the application for the first time, THE Application SHALL generate a unique Device ID and store it in localStorage
2. WHEN a Device ID is generated, THE Application SHALL create a Device Fingerprint using browser characteristics
3. WHEN a customer places their first order or booking, THE Application SHALL create a Customer Profile linked to their Device ID
4. WHEN a Customer Profile is created, THE Application SHALL generate a unique 6-digit Sync Passcode
5. THE Application SHALL persist the Device ID in localStorage across browser sessions

### Requirement 2

**User Story:** As a customer with multiple devices, I want to link my devices using a simple passcode, so that I can access my order history from any device.

#### Acceptance Criteria

1. WHEN a customer enters a valid Sync Passcode on a new device, THE Application SHALL link the new Device ID to the existing Customer Profile
2. WHEN a device is linked to a Customer Profile, THE Application SHALL synchronize all existing orders and bookings to the new device
3. WHEN a customer views their linked devices, THE Application SHALL display the device name, last active timestamp, and Device Fingerprint summary
4. WHEN a customer unlinks a device, THE Application SHALL remove the device association while preserving the Customer Profile and other linked devices
5. THE Application SHALL prevent linking more than 10 devices to a single Customer Profile

### Requirement 3

**User Story:** As a customer, I want to view my sync passcode at any time, so that I can link additional devices when needed.

#### Acceptance Criteria

1. WHEN a customer has a Customer Profile, THE Application SHALL display their Sync Passcode in the device sync interface
2. WHEN a customer requests a new Sync Passcode, THE Application SHALL generate a new unique 6-digit code and invalidate the previous code
3. THE Application SHALL ensure all generated Sync Passcodes are unique across all Customer Profiles
4. WHEN displaying a Sync Passcode, THE Application SHALL format it for easy reading (e.g., "123 456")

### Requirement 4

**User Story:** As a customer, I want all my activities tracked across devices, so that I have a complete history of my interactions with businesses.

#### Acceptance Criteria

1. WHEN a customer places an order, THE Application SHALL record the activity with type "order" linked to their Customer Profile
2. WHEN a customer makes a service booking, THE Application SHALL record the activity with type "booking" linked to their Customer Profile
3. WHEN a customer views a business menu page, THE Application SHALL record the activity with type "view" linked to their Customer Profile
4. WHEN a customer adds items to cart, THE Application SHALL record the activity with type "cart" linked to their Customer Profile
5. WHEN recording an activity, THE Application SHALL store the Device ID, business ID, timestamp, and relevant activity data in JSONB format

### Requirement 5

**User Story:** As a customer, I want to view my complete activity history, so that I can review my past orders, bookings, and interactions.

#### Acceptance Criteria

1. WHEN a customer accesses their activity history, THE Application SHALL display all activities from all linked devices in chronological order
2. WHEN displaying activities, THE Application SHALL show the activity type, business name, timestamp, and device name
3. WHEN a customer filters activities by business, THE Application SHALL display only activities related to that business
4. WHEN a customer filters activities by type, THE Application SHALL display only activities of that type
5. THE Application SHALL display activities from the most recent to oldest

### Requirement 6

**User Story:** As a customer, I want my order tracking page to show orders from all my linked devices, so that I have a unified view of my orders.

#### Acceptance Criteria

1. WHEN a customer views the order tracking page, THE Application SHALL display orders from all devices linked to their Customer Profile
2. WHEN displaying orders, THE Application SHALL indicate which device each order was placed from
3. WHEN a customer has no Customer Profile, THE Application SHALL display only orders from the current device using existing localStorage mechanism
4. THE Application SHALL maintain backward compatibility with orders placed before the device sync feature was implemented

### Requirement 7

**User Story:** As a system, I want to prevent passcode brute-force attacks, so that customer data remains secure.

#### Acceptance Criteria

1. WHEN a device attempts passcode verification, THE Application SHALL track the number of failed attempts
2. WHEN a device exceeds 5 failed passcode attempts within 1 hour, THE Application SHALL block further attempts from that device for 1 hour
3. WHEN a passcode verification succeeds, THE Application SHALL reset the failed attempt counter for that device
4. THE Application SHALL store rate limiting data in a way that persists across page reloads

### Requirement 8

**User Story:** As a developer, I want the device sync system to integrate seamlessly with existing order and booking flows, so that no existing functionality is disrupted.

#### Acceptance Criteria

1. WHEN an order is submitted, THE Application SHALL include the Customer Profile ID if one exists for the current device
2. WHEN a service booking is submitted, THE Application SHALL include the Customer Profile ID if one exists for the current device
3. WHEN a customer has no Customer Profile, THE Application SHALL continue to function using the existing device-based order storage mechanism
4. THE Application SHALL maintain all existing API contracts and data structures for orders and bookings
5. WHEN the device sync feature is disabled, THE Application SHALL continue to operate using only localStorage-based tracking
