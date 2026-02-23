# Food Ordering Platform

A full-stack food ordering ecosystem similar to Zomato/Swiggy, featuring **4 separate portals** and a unified backend.

## Portals
| Portal | Directory | Port | Description |
|---|---|---|---|
| 🛒 Customer | `apps/customer` | 5173 | Browse, order, track, seal verify |
| 🚴 Delivery Partner | `apps/delivery` | 5174 | Accept orders, navigate, upload seal photos |
| 🍽️ Restaurant | `apps/restaurant` | 5175 | Manage orders, menu, dispatch seal photos |
| 🛠️ Management | `apps/admin` | 5176 | Analytics, users, disputes, seal audit |
| ⚙️ Backend API | `backend` | 3000 | Unified REST API + Socket.io |

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS + Zustand + Socket.io Client
- **Backend**: Node.js + Express + Socket.io + Prisma
- **Database**: PostgreSQL (Supabase)
- **Storage**: Cloudinary (menu images + seal photos)
- **Payments**: Razorpay
- **Real-time**: Socket.io

## Unique Feature: 🔒 Seal Integrity Verification
When a restaurant dispatches food, they photograph the sealed container. The delivery partner also photographs it at pickup. When the customer receives the order, they take a photo and see a **side-by-side comparison** with the restaurant's original photo — and mark it as Intact / Suspicious / Tampered.

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL (or Supabase account)
- Cloudinary account
- Razorpay account

### Installation
```bash
# Install all dependencies
npm install

# Run individual portals
npm run dev:customer      # http://localhost:5173
npm run dev:delivery      # http://localhost:5174
npm run dev:restaurant    # http://localhost:5175
npm run dev:admin         # http://localhost:5176
npm run dev:backend       # http://localhost:3000
```

### Environment Variables
Copy `backend/.env.example` to `backend/.env` and fill in your credentials.

## Project Structure
```
food-platform/
├── apps/
│   ├── customer/       # Customer portal
│   ├── delivery/       # Delivery partner portal
│   ├── restaurant/     # Restaurant portal
│   └── admin/          # Management dashboard
├── backend/            # Unified API server
├── shared/             # Shared constants & utilities
└── package.json        # Monorepo root
```
