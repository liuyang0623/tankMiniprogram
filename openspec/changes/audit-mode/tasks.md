# Audit Mode - Tasks

## Phase 1: API Layer Setup (15 minutes)

- [ ] Create `src/services/api/appConfig.ts` with:
  - `getAuditMode(): Promise<AppConfig>`
  - `setAuditMode(auditMode: boolean): Promise<AppConfig>`
  - Types for `AppConfig` response

- [ ] Update `src/types/api.ts` to add:
  - `interface UserProfile` with `isAdmin: boolean` field
  - `interface AppConfig` with `auditMode: boolean` field

- [ ] Update `src/services/api/index.ts` to export new APIs

## Phase 2: State Management (20 minutes)

- [ ] Create `src/store/audit.ts` with Zustand store:
  - Initial state: `isAuditMode: null, isAdmin: false`
  - `load()` method to fetch both audit status and user profile
  - `toggleAuditMode()` method to call setAuditMode and update state
  - Selectors/helpers for component consumption

- [ ] Add tests for audit store in `src/store/__tests__/audit.test.ts`

## Phase 3: Core Hooks & Utilities (15 minutes)

- [ ] Create `src/hooks/useAuditGuard.ts`:
  - `useIsAuditMode()`: returns current audit mode status
  - `useAdminCheck()`: returns whether user is admin

## Phase 4: Page Modifications

### Index Page (30 minutes)
- [ ] Modify `src/pages/index/index.tsx`:
  - Hide publish button when `useIsAuditMode()` returns true
  - Alternative: replace with audit hint or keep empty space

### Messages Page (20 minutes)
- [ ] Modify `src/pages/messages/index.tsx`:
  - When in audit mode, hide message content list
  - Show appropriate placeholder text

### Drafts Page (15 minutes)
- [ ] Modify `src/pages/drafts/index.tsx`:
  - Hide tab bar entry in custom tab bar or redirect when accessed directly
  - Or simply hide the content area

### Inspiration Page (20 minutes)
- [ ] Modify `src/pages/inspiration/index.tsx`:
  - Locate and hide the Q&A module section

### Profile Page (15 minutes)
- [ ] Modify `src/pages/profile/index.tsx`:
  - Hide private/message entry when in audit mode

## Phase 5: Component Modifications (40 minutes)

### Post Card (15 minutes)
- [ ] Modify `src/components/PostCard/index.tsx`:
  - Hide comment icon when `useIsAuditMode()` returns true

### Article Detail (20 minutes)
- [ ] Modify article detail page components:
  - Hide comment section/component in detail view

### Comment List (if separate component)
- [ ] Modify `src/components/CommentList/index.tsx`:
  - Skip rendering when in audit mode

## Phase 6: Admin Settings (25 minutes)

- [ ] Locate settings dialog component (likely in `src/components/SettingsDrawer/` or similar)
- [ ] Add "Toggle Audit Mode" button:
  - Only visible when `useAdminCheck()` returns true
  - On click: call `toggleAuditMode()` from audit store
  - Show loading state and error handling
  - Update UI immediately on toggle

## Phase 7: App Initialization (20 minutes)

- [ ] Modify `src/app.tsx`:
  - In launch handler, dispatch `auditStore.load()` alongside other stores
  - Ensure auth and audit stores are initialized concurrently

- [ ] Optionally add local storage caching for audit mode status

## Phase 8: Testing & Verification (30 minutes)

- [ ] Test all disabled features are hidden in audit mode
- [ ] Test all enabled features work normally outside audit mode
- [ ] Test admin can toggle audit mode successfully
- [ ] Verify smooth transitions between modes

## Total Estimated Time: ~3 hours
