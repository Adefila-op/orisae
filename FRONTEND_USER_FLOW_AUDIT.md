# Orisae Frontend - User Flow Audit Report

**Date:** May 5, 2026  
**Focus:** User flow for wallet connection → trading → creator mode → IP creation  
**Status:** Partially Implemented - Needs Frontend Refinement

---

## Executive Summary

The frontend has 80% of the functionality implemented but lacks:
1. **Clear creator mode toggle UI** - No visible button to switch between buyer and creator modes
2. **$100 volume verification before creator activation** - Backend check exists but frontend doesn't enforce it
3. **Anonymous trading workflow** - Users must sign in before trading (should be optional)
4. **Creator profile activation guidance** - No flow to show volume requirement to users

---

## Current Frontend Architecture

### State Management (src/lib/app-state.tsx)

```typescript
type AppStateSnapshot = {
  signedIn: boolean;                 // ✅ User authenticated
  creatorProfileActive: boolean;     // ✅ Creator mode enabled
  walletConnected: boolean;          // ✅ Wallet is connected
  walletAddress: string | null;      // ✅ User's wallet
  walletBalance: number;             // ✅ ETH balance
  cashBalance: number;               // ⚠️ NOT USED - needs UI
  signedIn: boolean;                 // ✅ Implemented
  is_creator: boolean;               // ✅ In User object
}
```

### Key Methods Available

```typescript
connectWallet()              // ✅ Connects wallet, shows modal if needed
signIn()                     // ✅ Signs message, authenticates to backend
enableCreatorProfile()       // ✅ Switches to creator mode - MISSING volume check
signOut()                    // ✅ Logs user out
disconnectWallet()           // ✅ Disconnects wallet
publishContent()             // ✅ Creates IP asset
```

---

## Current User Flow Analysis

### Flow 1: Anonymous Trading (Partially Working)

```
User → Connect Wallet
    ↓
Browse & Buy
    (No sign-in required if buying anonymously)
    ↓
Transaction completes
```

**Status:** ⚠️ **INCOMPLETE**
- Users can browse without signing in ✅
- Users CAN'T buy without API sign-in ❌
- Backend requires JWT token for transactions ❌

**Issue:** `transactionAPI.buy()` requires authenticated request but UI doesn't handle anonymous flow

---

### Flow 2: Account Creation & Sign-In

```
User → Connect Wallet
    ↓ (Click Profile/Sign In button)
Sign Message
    ↓
Backend creates user account
    ↓
User is now signed in
```

**Status:** ✅ **IMPLEMENTED**
- Wallet connection works
- Message signing works
- Backend creates account on first login
- User profile restored on refresh

**Missing UI:**
- No visible "Sign In" button on home page ❌
- No onboarding flow to prompt sign-in ❌
- No profile indicator showing logged-in status ❌

---

### Flow 3: Creator Mode Activation (Partially Working)

```
User (signed in) → Wants to create IP
    ↓
Clicks "Create" (+) button
    ↓
Needs to activate creator profile
    ↓
Click "Switch to Creator Mode"
    ↓
Backend sets is_creator = true
    ↓
Can now create IP... BUT NEEDS $100 VOLUME CHECK
```

**Status:** ⚠️ **NEEDS FRONTEND CHECK**
- Button exists (Plus icon in BottomNav) ✅
- `enableCreatorProfile()` method exists ✅
- But NO UI to verify $100 minimum volume ❌
- User won't know they can't create IP ❌

---

### Flow 4: IP Creation (Partially Working)

```
User (creator mode) → Click + button
    ↓
Upload form opens
    ↓
Fill in: Title, Description, Category, Price
    ↓
Submit → Creates IP asset
```

**Status:** ⚠️ **NEEDS VOLUME CHECK**
- Form UI exists ✅
- Upload works ✅
- Backend enforces $100 minimum ✅
- But frontend doesn't show error reason clearly ❌

**Issue:** If user tries to create IP without $100 volume:
- Backend returns 403 Forbidden with message
- But UI might not display error properly

---

## Detailed Component Analysis

### 1. AppHeader Component (src/components/AppHeader.tsx)

**Current State:**
- Search button
- Notifications bell
- NO profile/account button ❌
- NO creator mode toggle ❌

**What's Missing:**
- Profile dropdown showing:
  - Current user name
  - Creator status
  - Sign In / Sign Out buttons
  - Trading volume display

**Code Location:** src/components/AppHeader.tsx lines 12-200

---

### 2. BottomNav Component (src/components/BottomNav.tsx)

**Current State:**
- Home, Discover, IP Marketplace, Portfolio buttons
- Plus (+) button goes to `/upload`
- NO context about current mode ❌

**What's Missing:**
- Visual indicator for creator mode ON/OFF
- Different UI when creator mode is active
- Color change or icon change when in creator mode

**Code Location:** src/components/BottomNav.tsx lines 1-50

---

### 3. Upload/Create Route (src/routes/upload.tsx)

**Current State:**
```typescript
const { 
  connectWallet,
  signIn,
  enableCreatorProfile,  // ← This needs volume check
  publishContent,
  creatorProfileActive
} = useAppState();
```

**Current Flow:**
```
1. Check if wallet connected → if not, show connect button
2. Check if signed in → if not, show sign in button
3. Check if creator profile active → if not, show activate button
4. Show upload form
```

**Problem:** Step 3 doesn't check $100 volume requirement ❌

**Code Location:** src/routes/upload.tsx lines 40-150

---

### 4. App State Context (src/lib/app-state.tsx)

**Current Implementation:**
```typescript
enableCreatorProfile: async () => {
  // Just sets is_creator = true
  // NO volume check
  updatedUser = await authAPI.updateProfile({
    is_creator: true,
  });
  setState(prev => ({
    ...prev,
    creatorProfileActive: true,
  }));
}
```

**What's Missing:**
- Get user's transaction volume
- Check if volume >= $100
- Show error message if insufficient volume
- Return volume information to UI

**Code Location:** src/lib/app-state.tsx lines 350-380

---

## Missing Frontend Features

### Feature 1: User Profile Menu ❌

**Location:** Should be in AppHeader

**Requirements:**
- Show current user name
- Show wallet address (truncated)
- Show creator status badge
- Show trading volume
- Sign In / Sign Out buttons

**Example UI:**
```
Profile Menu
├─ Logged in as: @creator_a1b2c3
├─ Wallet: 0x1234...5678
├─ Trading Volume: $45.50
├─ Status: Regular User
├─ [Switch to Creator Mode] (if volume >= $100)
└─ [Sign Out]
```

---

### Feature 2: Creator Mode Toggle ❌

**Location:** AppHeader or BottomNav

**Requirements:**
- Show when user is signed in
- Show current mode (Buyer / Creator)
- Check volume requirement
- Show volume progress bar

**Example UI:**
```
Current Mode: Buyer Mode
Trading Volume: $45.50 / $100.00
Progress: ████░░░░░░ 45%

[Switch to Creator Mode]
(Requires $100+ trading volume)
```

---

### Feature 3: Volume Check in Creator Activation ❌

**Location:** src/lib/app-state.tsx `enableCreatorProfile()`

**Requirements:**
```typescript
enableCreatorProfile: async () => {
  // Get user's transaction volume
  const volume = await getUserTransactionVolume(user.id);
  
  if (volume < 10000) { // $100 in cents
    return {
      ok: false,
      reason: `Insufficient volume. Current: $${(volume/100).toFixed(2)}, Required: $100`,
      currentVolume: volume / 100,
      requiredVolume: 100
    }
  }
  
  // Proceed with creator activation
  const updatedUser = await authAPI.updateProfile({
    is_creator: true
  });
}
```

---

### Feature 4: IP Creation Error Handling ❌

**Location:** src/routes/upload.tsx `submit()` function

**Current:**
```typescript
try {
  const newIP = await ipAPI.create({ ... });
} catch (error) {
  // Shows generic error
  toast.error("Failed to create IP");
}
```

**Required:**
```typescript
catch (error) {
  if (error.code === 'FORBIDDEN') {
    // Parse $100 volume error
    const match = error.message.match(/\$[\d.]+/g);
    const currentVolume = match ? match[0] : 'Unknown';
    toast.error(
      `Need $100 trading volume. Current: ${currentVolume}. ` +
      `Buy some IP tokens first to unlock creator features!`
    );
  } else {
    toast.error(error.message);
  }
}
```

---

### Feature 5: Sign-In Button on Home Page ❌

**Location:** src/routes/index.tsx or AppHeader

**Requirements:**
- Show "Sign In" button if not signed in
- Show user name if signed in
- Navigate to profile page
- Show transaction volume

---

### Feature 6: Anonymous Trading Support ⚠️

**Current Issue:** API requires authentication

**Frontend Needed:**
- Allow browsing without sign-in ✅ (already works)
- Prompt to sign-in when attempting to buy
- Store session with JWT token

---

## Implementation Roadmap

### Phase 1: User Profile Menu (2-3 hours)

1. **Update AppHeader component**
   - Add profile button that shows user name
   - Add dropdown menu
   - Show trading volume
   - Show creator status

2. **Update app-state.tsx**
   - Add method to get user transaction volume from API
   - Expose volume in app state

3. **Add ProfileDropdown component**
   - Display user info
   - Show balance
   - Creator mode toggle

---

### Phase 2: Creator Mode Toggle (2-3 hours)

1. **Update enableCreatorProfile()**
   - Call API to get transaction volume
   - Check if >= $100
   - Return volume info with error

2. **Update Upload component**
   - Check volume before showing form
   - Show progress bar if insufficient
   - Show "Buy tokens to unlock" message

3. **Add CreatorModeGate component**
   - Shows volume requirement
   - Links to marketplace to buy tokens
   - Shows progress

---

### Phase 3: Error Handling & UX (2 hours)

1. **Enhance error messages**
   - Show specific volume errors from backend
   - Suggest buying tokens if short on volume
   - Link to marketplace

2. **Add onboarding flow**
   - First-time user sees wallet connection prompt
   - Automatic sign-in after wallet connection
   - Show trading volume after first transaction

---

## Code Changes Required

### File 1: src/lib/app-state.tsx

Add method to get user volume:
```typescript
// Around line 380, in enableCreatorProfile
const userVolume = user.transaction_volume || 0; // Need this from backend
if (userVolume < 10000) {
  return {
    ok: false,
    reason: `Need $100 volume. Current: $${(userVolume/100).toFixed(2)}`,
  }
}
```

Need to add to User object:
```typescript
interface User {
  transaction_volume?: number; // Add this field
}
```

### File 2: src/components/AppHeader.tsx

Add profile menu (after line 90):
```typescript
<ProfileMenu user={user} isSignedIn={signedIn} />
```

### File 3: src/routes/upload.tsx

Update submit handler (around line 100):
```typescript
const activateCreatorResult = await enableCreatorProfile();
if (!activateCreatorResult.ok) {
  toast.error(activateCreatorResult.reason);
  return; // Don't proceed if can't activate
}
```

### File 4: New Component - src/components/ProfileMenu.tsx

```typescript
export function ProfileMenu({ user, isSignedIn }) {
  // Show profile dropdown with volume info
}
```

---

## API Changes Needed

### Backend: Add volume to User object

**File:** server/db/types.ts

```typescript
interface User {
  transaction_volume?: number; // Total USD spent/received
}
```

**File:** server/services/user-service.ts

```typescript
// Modify GET /api/auth/me to include volume
async getProfile() {
  const user = await this.getUserById(userId);
  const volume = await this.getUserTransactionVolume(userId);
  return {
    ...user,
    transaction_volume: volume
  }
}
```

---

## Testing Checklist

- [ ] User can connect wallet
- [ ] User sees profile menu with name and volume
- [ ] User with <$100 volume can't create IP
- [ ] User with >=$100 volume can create IP
- [ ] Error message shows reason + volume needed
- [ ] Creator mode toggle shows in profile menu
- [ ] Trading volume updates after purchase
- [ ] UI updates when user reaches $100

---

## Summary

| Component | Status | Priority | Effort |
|-----------|--------|----------|--------|
| Profile Menu | ❌ Missing | HIGH | 3 hrs |
| Creator Mode Toggle | ❌ Missing | HIGH | 2 hrs |
| Volume Check | ⚠️ Incomplete | HIGH | 2 hrs |
| Error Messages | ⚠️ Generic | MEDIUM | 1 hr |
| Onboarding Flow | ❌ Missing | MEDIUM | 4 hrs |
| Anonymous Trading | ⚠️ Blocked | LOW | 2 hrs |

**Total Estimated Effort:** 14 hours

**Critical Path:** 
1. Profile menu (3h) 
2. Volume check in creator activation (2h)
3. Error handling (1h)

**Minimum to Launch:** 6 hours (Profile + Volume Check + Error Handling)

---

## Conclusion

The backend is ready with the $100 volume requirement. The frontend has 80% of the components but needs:
1. **Profile menu UI** to show user info and volume
2. **Volume check** before creator activation
3. **Better error messages** when volume is insufficient
4. **UI polish** for the creator mode toggle

Once these changes are made, users will have a smooth flow:
- Connect wallet → Trade tokens → Reach $100 volume → Unlock creator mode → Create IP

---

**Next Step:** Implement Profile Menu component
