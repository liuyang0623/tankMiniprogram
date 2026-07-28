# Audit Mode Feature Proposal

## Overview
Implement an audit mode for the mini-program where certain features (publish, messages, drafts, inspiration Q&A, comments, private messages) are hidden when in audit mode. This allows personal mini-programs to pass review requirements while administrators can toggle audit mode via settings.

## Requirements

### API Integration
- **GET /api/v1/app-config**: Retrieve current audit mode status
- **PUT /api/v1/app-config**: Toggle audit mode (admin only)
- **GET /api/v1/users/profile**: Added `isAdmin` field to identify admin users

### UI Changes When Audit Mode is Enabled
1. **Home Page (index)**: Hide publish article entry/button
2. **Messages Page (messages)**: Hide message content/display placeholder
3. **Drafts Page (drafts)**: Hide drafts entry/tab bar item
4. **Inspiration Page (inspiration)**: Hide Q&A module
5. **Post Cards**: Hide comment icon
6. **Article Detail Page**: Hide comment section
7. **Profile Page**: Hide private message entry

### Admin Settings
- Add "Toggle Audit Mode" button in settings dialog
- Only visible to admins (`isAdmin === true`)

## Data Flow
```
App initializes → Fetch audit status from /api/v1/app-config
                → Fetch user profile to check isAdmin
                → Store both in state stores
                → Components use these values to render conditionally
```

## Dependencies
- Backend service already implemented with required APIs
- Need to add frontend service layer for app-config and audit operations
- Need to add state store for audit mode management