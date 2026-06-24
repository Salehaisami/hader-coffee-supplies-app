# Deployment & Setup Guide — Phase One

*Operational reference for deploying and maintaining the Hader app ecosystem.*

---

## 1. iOS App (CoffeeSuppliesApp)

### Build & Release

- **Xcode project generation**: Uses XcodeGen. Run `xcodegen generate` from `CoffeeSuppliesApp/` after modifying `project.yml`.
- **Signing team**: `KHHNUYST98` (configured in `project.yml` → `DEVELOPMENT_TEAM`). Persists across xcodegen runs.
- **Build**: `xcodebuild -scheme CoffeeSuppliesApp -configuration Release`
- **Archive**: Use Xcode Organizer or `xcodebuild archive`

### Firebase Configuration

- **Dev/Debug**: Loads `GoogleService-Info-Dev.plist`
- **Release/TestFlight/App Store**: Loads `GoogleService-Info-Prod.plist`
- Both currently point to the same Firebase project (`hader-dcfcc`). If you create a separate production project later, update the Prod plist.
- Firebase is initialized in `AppDelegate.didFinishLaunchingWithOptions` (not in the SwiftUI App struct).

### Phone Auth (APNs)

Phone authentication requires:
1. **APNs Authentication Key** uploaded to Firebase Console → Project Settings → Cloud Messaging → APNs Authentication Key
2. **Push Notifications capability** enabled in the Xcode project
3. **Background Modes** enabled: `fetch` + `remote-notification` (in Info.plist)
4. **`aps-environment`** entitlement: `development` for debug builds (Xcode auto-switches to `production` for distribution)
5. **`FirebaseAppDelegateProxyEnabled = false`** in Info.plist — the custom `AppDelegate` manually forwards APNs tokens to Firebase Auth
6. **SMS Region Policy**: Enable Saudi Arabia (`SA`) in Firebase Console → Authentication → Settings → SMS region policy
7. **Test phone number** for Apple Review: Add in Firebase Console → Authentication → Sign-in method → Phone → "Phone numbers for testing" (e.g. `+966553791663` / code `123456`)

### URL Scheme (reCAPTCHA fallback)

The Info.plist includes URL scheme `app-1-484035373651-ios-c461701bb797185d8074a6` (the Encoded App ID from Firebase Console). This is needed for the reCAPTCHA fallback when silent push fails.

### iPad Support

- `UISupportedInterfaceOrientations~ipad` includes all four orientations (required for iPad multitasking / App Store validation)
- Product grid uses 2 columns on both iPhone and iPad (wider cards + more spacing on iPad)
- Cart content constrained to 700pt max width on iPad

### App Store Screenshots

- **6.5-inch iPhone**: 1284×2778 px (use iPhone 14 Pro Max simulator)
- **13-inch iPad**: 2048×2732 px (use iPad Pro 12.9" simulator)
- Resize with `sips -z HEIGHT WIDTH file.png` if needed

---

## 2. Admin Dashboard (HaderAdmin)

### Stack

- Next.js 16 / React 19 / TypeScript / Tailwind CSS 4
- Firebase client SDK for Firestore, Auth, Storage

### Environment Variables

All `NEXT_PUBLIC_*` — safe to commit in `.env.production`:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyCgWf-1gKXv-H0JXkNFYpoPN_NQRlWSOIQ` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `hader-dcfcc.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `hader-dcfcc` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `hader-dcfcc.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `484035373651` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:484035373651:web:45e242aebd1b5c818074a6` |

### Deployment (Firebase App Hosting)

The admin dashboard deploys via **Firebase App Hosting** (replaces the deprecated web frameworks experiment):

1. Firebase Console → App Hosting → Create backend
2. Connect GitHub repo (`Salehaisami/hader-coffee-supplies-app`)
3. Set root directory to `HaderAdmin`
4. Select branch `main`, Node.js 22
5. App Hosting auto-builds and deploys on each push to main

### Admin Account Setup

Admin accounts use email/password (not phone OTP):

1. Create user in Firebase Console → Authentication → Users → Add user
2. Set admin custom claim:
   ```bash
   cd CoffeeSuppliesApp/firebase
   GOOGLE_APPLICATION_CREDENTIALS=../../scripts/hader-dcfcc-firebase-adminsdk-fbsvc-697e33ef0e.json \
   node -e "
   const { initializeApp, cert } = require('firebase-admin/app');
   const { getAuth } = require('firebase-admin/auth');
   initializeApp({ credential: cert(require('../../scripts/hader-dcfcc-firebase-adminsdk-fbsvc-697e33ef0e.json')) });
   getAuth().setCustomUserClaims('USER_UID', { role: 'admin' }).then(() => console.log('Done'));
   "
   ```

---

## 3. Firestore Indexes

### Required Composite Indexes

| Collection | Fields | Created |
|---|---|---|
| `users` | `role` (ASC) + `createdAt` (DESC) | Required for Customers page |
| `orders` | `customerId` (ASC) + `createdAt` (DESC) | Required for customer order history |

If you hit "The query requires an index" errors, click the link in the error to auto-create the index in Firebase Console. Indexes take 1-2 minutes to build.

### Firestore indexes file

Keep `CoffeeSuppliesApp/firebase/firestore.indexes.json` updated with any new indexes. Deploy with:
```bash
cd CoffeeSuppliesApp/firebase
./node_modules/.bin/firebase deploy --only firestore:indexes
```

---

## 4. Firebase Project Configuration Checklist

| Item | Location | Status |
|---|---|---|
| Phone Auth enabled | Authentication → Sign-in method | ✅ |
| SMS region policy (allow SA) | Authentication → Settings | ✅ |
| APNs key uploaded | Project Settings → Cloud Messaging | ✅ |
| Test phone number for Apple Review | Authentication → Sign-in method → Phone | ✅ |
| Firestore security rules deployed | `firebase deploy --only firestore:rules` | ✅ |
| Storage rules deployed | `firebase deploy --only storage` | ✅ |
| Composite indexes created | Firestore → Indexes | ✅ |
| Admin custom claims set | Via script (see §2) | ✅ |
| Blaze plan enabled | Project Settings → Usage and billing | ✅ |
| Authorized domains for reCAPTCHA | Authentication → Settings → Authorized domains | ✅ |

---

## 5. Privacy Policy

Hosted at: `https://salehaisami.github.io/hader-coffee-supplies-app/privacy-policy.html`

Source file: `docs/privacy-policy.html`

Requires GitHub Pages enabled on the repo (Settings → Pages → Deploy from `main` branch, `/docs` folder).

---

## 6. App Store Connect Metadata

| Field | Value |
|---|---|
| Privacy Policy URL | `https://salehaisami.github.io/hader-coffee-supplies-app/privacy-policy.html` |
| Support URL | (your support page/email) |
| Copyright | `2024 Hader` |
| Keywords | `coffee,supplies,bulk,ordering,cups,café,مقهى,مستلزمات,جملة,أكواب,جدة,توصيل` |
| Content Rights | No third-party content |
| Review credentials | Phone: `+966553791663`, Code: `123456` (Firebase test number) |
