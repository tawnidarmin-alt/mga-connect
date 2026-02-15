const express = require('express'); const mongoose = require('mongoose'); const path = require('path'); const cors = require('cors');

const app = express();

// Middleware app.use(express.json()); app.use(cors());

// Serve static files from the current folder (where server.js lives) app.use(express.static(__dirname));

// MongoDB Connection mongoose.connect(process.env.MONGO_URI) .then(() => console.log("✅ Connected to MongoDB")) .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- ROUTES ---

// 1. Serve the Home Page (Booking Form) app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

// 2. Serve the Dashboard app.get('/dashboard', (req, res) => { res.sendFile(path.join(__dirname, 'dashboard.html')); });

// 3. API to get bookings (Placeholder) app.get('/bookings', async (req, res) => { try { // This keeps the dashboard from crashing if the database is empty res.json([]); } catch (err) { res.status(500).json({ error: "Failed to fetch bookings" }); } });

// Start Server const PORT = process.env.PORT || 10000; app.listen(PORT, () => { console.log(🚀 Server is live on port ${PORT}); });