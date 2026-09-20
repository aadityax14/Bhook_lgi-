# 🍜 Bhook_Lgi | Hostel Food Ordering Web App

> **"Your hostel cravings, sorted. 😋"**

A modern, mobile-first food ordering web application built for student hostels. Features a vibrant warm yellow + black theme, splash screen animation, product customization (spicy/non-spicy), cart & student checkout for hostels GH1–GH12, real-time visual order tracking, in-app notification center, dynamic stock availability management, and an Admin Kitchen Dashboard.

---

## 📱 Features

1. **App Opening Splash Experience**
   - Warm vibrant yellow background with animated `Bhook_Lgi` central logo.
   - Steaming food, sparks, and smooth 1.8s transition into the main home screen (with skip option).

2. **Student-Friendly Hostel Menu**
   - Categories: 🔥 All, 🥗 Bhel, 🍜 Maggie, 🍿 Snacks, 🍪 Biscuits, 🥡 Cooked, 📦 Uncooked.
   - Products: Half Bhel (₹35), Full Bhel (₹65), Cooked Maggie (₹40), Maggie Packet (₹15), Bingo Chips, Lay's Magic Masala, Lay's American Cream & Onion, Lay's Sizzling Hot, Parle-G, Oreo.
   - Dynamic Stock Badges: 🟢 Available / 🔴 Out of Stock.

3. **Product Customization Modal / Bottom Sheet**
   - Spice levels: 🌶️ Spicy / 🙂 Non-Spicy.
   - Portion variants (Half/Full, Single/Double).
   - Add-ons (Melted cheese, butter dollop, crispy sev).
   - Live price calculation & instant cart feedback.

4. **Cart & Student Checkout**
   - Full bill breakdown: Subtotal + Hostel Delivery fee (Free above ₹120) + Packaging.
   - Hostel selector: `GH1`, `GH3`, `GH4`, `GH11`, `GH12`, `BH1`, `BH2`, `Other`.
   - Room delivery vs. Kitchen pickup.
   - Delivery instructions (e.g. "Please call when you reach the wing").

5. **Real-Time Visual Order Tracking**
   - 6-Stage Timeline: `✓ Order Placed` ➔ `✓ Order Accepted` ➔ `🟡 Preparing` (glowing animation) ➔ `⚪ Ready` ➔ `⚪ Out for Delivery` ➔ `⚪ Delivered`.
   - Real-time updates: changing status in Admin updates customer tracking immediately without refresh!

6. **In-App Notification Center**
   - Bell with unread counter.
   - Instant in-app alert toasts when the kitchen updates your order status.

7. **Kitchen Admin Dashboard**
   - Live order stream with 1-click status transition buttons.
   - Dynamic stock toggler: 1-click "Available 🟢" vs "Out of Stock 🔴".
   - Price editor and new product modal.

8. **Mobile Simulation Frame**
   - Toggle between full responsive layout and a mobile device mockup right in the header.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Backend**: Node.js, Express, REST APIs, CORS.
- **Database Architecture**: PostgreSQL relational schema (`server/src/db/schema.sql`) with active fallback store (`server/src/data/db.json`).

---

## 🚀 Running the Project

### 1. Start the Backend API
```bash
cd server
npm install
npm start
```
Runs at `http://localhost:5000`.

### 2. Start the Frontend
```bash
cd client
npm install
npm run dev
```
Runs at `http://localhost:5173`.
