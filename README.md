# Barcode Billing Software

A full-featured barcode billing application with product and customer management, point-of-sale billing (scan or manual), invoices, and sales reports. Supports barcode generation for product labels and runs as both a **web app** and **desktop app** (Electron).

## Features

- **Products**: Add/edit/delete products with barcode, name, price. Generate barcode and print labels to stick on products.
- **Customers**: Manage customers (name, phone, email, address).
- **Billing**: Scan barcode (camera or USB scanner) or enter manually; add to cart; optional customer; complete sale and create invoice.
- **Invoices**: List and filter by date; view and print invoice details.
- **Reports**: Sales summary by date range; export to CSV.

## Prerequisites

- **Node.js** 18+
- **MongoDB** running locally (e.g. `mongodb://127.0.0.1:27017`) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and set `MONGODB_URI`.

## Quick start (web)

1. Install dependencies (from project root):
  ```bash
   npm run postinstall
  ```
2. Start MongoDB if not already running.
3. Start backend and frontend:
  ```bash
   npm run dev
  ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser. The backend API runs at [http://localhost:3001](http://localhost:3001).

## Desktop (Electron)

- **Dev**: Run `npm run dev`, then in another terminal run `npm run electron`. The Electron window will load the Vite dev server (port 5173).
- **Production**: Build frontend and backend, then run Electron with the backend serving the app:
  ```bash
  npm run build
  NODE_ENV=production npm run electron
  ```
  (Electron will start the backend and open http://localhost:3001.)

## Environment

- `MONGODB_URI` – MongoDB connection string (default: `mongodb://127.0.0.1:27017/barcode-billing`)
- `PORT` – Backend port (default: 3001)

## Project structure

- `backend/` – Node + Express + MongoDB API (products, customers, invoices, reports, barcode image)
- `frontend/` – React + Vite + Tailwind UI
- `electron/` – Electron main process (starts backend and loads app)

## License

Aniket Khillare