const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Booking = require("./BookingModel"); // Make sure BookingModel.js is correct

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/mga", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once("open", () =>
  console.log("✅ MongoDB Connected")
);

// ----------------------
// Routes
// ----------------------

// GET all bookings
app.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// PUT update a booking (staff, status, etc.)
app.put("/bookings/:id", async (req, res) => {
  try {
    // req.body can contain { staff, status, action } or any fields
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update booking" });
  }
});

// POST notify client
app.post("/bookings/notify/:bookingCode", async (req, res) => {
  try {
    // Find booking by code
    const booking = await Booking.findOne({ bookingCode: req.params.bookingCode });
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Here you can integrate email + WhatsApp notifications
    // For now, we just update the booking
    booking.action = "Notified";
    booking.status = "Notified";
    await booking.save();

    res.json({ message: "Client notified", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to notify client" });
  }
});

// Start server
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
