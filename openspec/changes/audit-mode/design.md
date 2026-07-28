# Audit Mode Design Specification

## Architecture Overview

### New Files Created

1. **src/services/api/appConfig.ts** - Service layer for app-config API endpoints
2. **src/services/audit.ts** - Higher-level audit business logic
3. **src/store/audit.ts** - Zustand store for audit mode state
4. **src/hooks/useAuditGuard.ts** - Hook for conditional rendering based on audit status
5. **src/components/AuditModeIndicator.tsx** (optional) - Debug indicator for development

### State Management

```typescript
// src/store/audit.ts
interface AuditState {
  isAuditMode: boolean | null; // null = loading, true/false = audit status
  isAdmin: boolean;
  setIsAuditMode: (status: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  load: Promise<void>;
  toggleAuditMode: () => Promise<void>;
}
```

### API Layer

```typescript
// src/services/api/appConfig.ts
export interface AppConfig {
  auditMode: boolean;
}

export async function getAuditMode(): Promise<AppConfig>
export async function setAuditMode(auditMode: boolean): Promise<AppConfig>
```

### Component Modifications

| Component | Modification |
|-----------|-------------|
| `src/pages/index/index.tsx` | Hide publish button when `isAuditMode === true` |
| `src/pages/messages/index.tsx` | Hide message content, show audit placeholder |
| `src/pages/drafts/index.tsx` | Hide tab bar entry or page |
| `src/pages/inspiration/index.tsx` | Hide Q&A module section |
| `src/components/PostCard/index.tsx` | Hide comment icon when `isAuditMode === true` |
| `src/pages/detail/index.tsx` | Hide comment section/component |
| `src/pages/profile/index.tsx` | Hide private message entry when `isAuditMode === true` |
| `src/components/settings/SettingsDialog.tsx` | Add "Toggle Audit Mode" button (admin only) |

### Initialization Flow

1. App launch → Load user profile to check `isAdmin`
2. Concurrently fetch audit mode status from `/api/v1/app-config`
3. Update audit store → All subscribed components re-render conditionally

## Technical Details

### Type Definitions (src/types/api.ts)

```typescript
export interface UserProfile {
  // existing fields...
  isAdmin: boolean;
}

export interface AppConfig {
  auditMode: boolean;
}
```

### Error Handling

- If API calls fail during initialization, fall back to cached values or default to `auditMode = false`
- Show toast/error message when toggle fails

### Performance Considerations

- Fetch audit status and profile concurrently
- Cache audit mode status locally with Taro.setStorageSync to reduce network requests
- Store last known audit mode in local storage as fallback
