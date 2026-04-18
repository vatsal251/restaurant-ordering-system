# Comprehensive Project Report: Food Ordering Platform

## 1. Introduction & Project Overview
The **Food Ordering Platform** is a full-stack, enterprise-grade food delivery ecosystem designed to emulate the functionality of industry leaders like Zomato and Swiggy. It serves as a unified marketplace connecting hungry customers, restaurants, delivery partners, and platform administrators.

The core objective of this project is to provide a seamless, real-time ordering experience while introducing a critical innovation in food safety: **Seal Integrity Verification**. This unique feature fundamentally sets the platform apart by ensuring total transparency and trust in the food delivery chain.

## 2. Technical Stack & Architecture
This application is built as a **Monorepo**, leveraging modern web technologies to handle multiple user types, real-time data streaming, and scalable backend services.

### Frontend Technologies
*   **Framework**: React (Bootstrapped with Vite for maximum performance)
*   **Styling**: Tailwind CSS (For rapid, responsive utility-first styling)
*   **State Management**: Zustand (Lightweight global state management)
*   **Real-time Communication**: Socket.io-client

### Backend Technologies
*   **Runtime & Server**: Node.js with the Express.js framework
*   **Database ORM**: Prisma (Type-safe database querying)
*   **Relational Database**: PostgreSQL (Hosted on Supabase)
*   **Real-time Engine**: Socket.io (For live order tracking and status updates)

### Third-Party Integrations
*   **Cloudinary**: Handles high-performance storage and delivery of menu images and seal verification photos.
*   **Razorpay**: Secure processing of online payments and transactions.

## 3. Modular Architecture: The Four Portals
To ensure security, code maintainability, and specialized user experiences, the platform is divided into four distinct frontend applications (stored under the `apps/` directory), all served by a single unified backend API.

### 1. Customer Portal (`apps/customer` | Port: 5173)
*   **Core Functions**: Browse nearby restaurants, view menus, manage cart, and process payments.
*   **Live Tracking**: Customers can track their orders in real-time as they move from "Accepted" to "Preparing", "Dispatched", and "Arrived".
*   **Seal Verification**: Upon delivery, customers photograph the package to verify the seal against the restaurant's original photo.

### 2. Delivery Partner Portal (`apps/delivery` | Port: 5174)
*   **Core Functions**: Geolocation-based order assignment, accepting/rejecting delivery pings.
*   **Navigation Assistance**: Shows pickup and drop-off coordinates.
*   **Photo Uploads**: Requires the rider to take a photograph of the food package at the restaurant pickup counter.

### 3. Restaurant Portal (`apps/restaurant` | Port: 5175)
*   **Core Functions**: Menu generation (add/edit items, manage stock), order queue management.
*   **Dispatch Flow**: Handles accepting incoming customer orders and updating prep times.
*   **Seal Documentation**: Restaurants are mandated to photograph the sealed package before handing it over to the delivery partner.

### 4. Administrator / Management Portal (`apps/admin` | Port: 5176)
*   **Core Functions**: Oversees all platform activity. Can suspend restaurants, users, or drivers.
*   **Dispute Resolution**: Dedicated dashboard for customer service representatives to view the "Seal Audit Trail" (Restaurant Photo vs Driver Photo vs Customer Photo) to resolve refund claims.
*   **Analytics**: Revenue metrics, commission calculations, and platform growth charts.

## 4. Workflows & Features

### The Unique "Seal Integrity Verification" System
A major challenge in modern food delivery is food tampering during transit. This application solves this using a multi-step verification chain:
1.  **Dispatch (Restaurant)**: When the food is ready, the restaurant takes a photo of the securely taped/sealed package.
2.  **Pickup (Driver)**: The delivery partner arrives and takes a photo of the package before putting it in their bag.
3.  **Delivery (Customer)**: The customer receives the package, takes a photo, and the app displays a side-by-side comparison of the restaurant's photo and the customer's photo. The customer then marks the seal as either "Intact", "Suspicious", or "Tampered".
If marked tampered, the admin portal immediately receives an alert containing all three photos for dispute resolution.

### Real-time Communication Bridge
The platform heavily utilizes **Socket.io**. When a customer places an order via the REST API, the backend emits a Socket event specifically to the targeted Restaurant's dashboard, making the order appear instantly without requiring a page refresh. Similar real-time event chains trigger driver assignment and customer tracking updates.

## 5. Development Setup & Launch Process
The monolithic structure allows developers to spin up the entire ecosystem rapidly:
*   Dependencies across all 4 React apps and the Node backend are installed from the root directory.
*   Individual start scripts (`npm run dev:customer`, `npm run dev:backend`, etc.) spin up the different layers on independent localhost ports (3000, 5173, 5174, 5175, 5176) via Vite.
*   A centralized `shared/` directory is used to maintain synchronized TypeScript interfaces, status enumerators, and utility functions across the stack.

## 6. Conclusion
This Food Ordering Platform is a sophisticated, enterprise-ready application that goes beyond standard CRUD operations. By implementing complex real-time websockets, a micro-frontend architecture via monorepo, and a genuinely innovative Seal Integrity framework, it represents a complete, secure, and highly scalable ecosystem for modern food delivery.
