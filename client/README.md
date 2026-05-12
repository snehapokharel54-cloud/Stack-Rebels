# Grihastha — Rental Marketplace Frontend

A modern rental marketplace platform built with **React + Vite**, featuring role-based authentication, property listings, booking management, and an admin control panel.

## 🚀 Tech Stack
- React 18 + Vite
- Framer Motion (animations)
- React Router DOM (routing)
- React Icons
- Vanilla CSS + Tailwind

## 📦 Features

### ⭐ Rating System
- Animated star rating input & display
- Booking-gated review submission (only booked users can review)
- Per-property reviews page with average rating

### 🛡️ Admin Dashboard UI
- Overview stats (users, hosts, bookings, pending properties)
- User management with remove/restore
- Property verification with approve/reject + document preview

### 🏠 Host (Vendor) Authentication + Property Approval
- Multi-step signup (Basic Info → OTP → Identity/Property Docs)
- Role-aware login (User vs Host)
- Vendor dashboard with property submission + approval status
- Secure role-based AuthContext (tamper-proof admin session)

## 🔑 Admin Login
```
Email:    admin@grihastha.com
Password: admin123
```

## 🛠️ Run Locally
```bash
npm install
npm run dev
```
