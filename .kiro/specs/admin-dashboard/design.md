# Admin Dashboard Design

## Tech Stack
- Next.js 14+ with App Router
- TypeScript
- Firebase SDK (Auth, Firestore, Storage)
- Tailwind CSS for styling
- Stone/Ink/Clay color palette (matching iOS app brand)

## Architecture
- Shared Firebase project with the iOS app (same Firestore collections)
- Client-side Firebase SDK for real-time data
- Protected routes via middleware checking admin custom claims
- Component-based UI with reusable form components for bilingual fields

## Data Model (shared with iOS)
- users, categories, products, suppliers, orders collections
- Same schema as defined in Phase1-Architecture.md §2
- Admin reads/writes all collections per security rules

## Color Tokens
- Stone (warm neutral backgrounds)
- Ink (text and primary actions)
- Clay (accent/brand color)

## Key Patterns
- Bilingual field editor component (Arabic + English side by side)
- Variant array editor (add/remove/edit variants inline)
- Image upload with preview
- Status transition buttons with confirmation
- Real-time order list with Firestore onSnapshot
- Google Maps deep link from order coordinates
