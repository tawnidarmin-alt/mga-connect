require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const twilio = require("twilio");
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// 1. Initialize Clients
const twilioClient = new twilio(
  process.env.TWILIO_ACCOUNT_SID, 
  process.env.TWILIO_AUTH_TOKEN
);
const resend = new Resend(process.env.RESEND_API_KEY);

// --- 2. Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

const Booking = require("./BookingModel"); 

// --- 3. Routes ---

// Create Booking
app.post("/bookings", async (req, res) => {
  try {
    const now = new Date();
    const datePart = now.toISOString().split('T')[0].replace(/-/g, '');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const count = await Booking.countDocuments({ createdAt: { $gte: startOfDay } });
    const sequence = (count + 1).toString().padStart(3, '0');
    const customBookingId = `MGA-${datePart}-${sequence}`;

    const newBooking = new Booking({
      ...req.body,
      bookingCode: customBookingId
    });

    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get All Bookings
app.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ _id: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Booking (Internal Staff Updates)
app.put("/update-booking/:id", async (req, res) => {
  try {
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, strict: false } 
    );
    res.json(updatedBooking);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// --- 4. THE NOTIFICATION ROUTE (FIXED) ---
app.post("/notify-client/:id", async (req, res) => {
  try {
    const b = await Booking.findById(req.params.id);
    if (!b) return res.status(404).json({ error: "Booking not found" });

    // 1. Mark as notified for Dashboard green text (DOES NOT CANCEL)
    b.notified = true;
    b.notificationDate = new Date();
    await b.save(); 

    const displayId = b.bookingCode || b._id.toString().slice(-6).toUpperCase();
    const cancelUrl = `https://mga-connect.onrender.com/cancel/${b._id}`;

    // 2. Send WhatsApp via Twilio
    const whatsappMsg = `*MGA CONNECT - CONFIRMED* ✈️\n\nHello *${b.name}*,\nID: ${displayId}\nDate: ${b.flightDate || b.date}\nTime: ${b.flightTime || b.time}\n\n*Manage:* ${cancelUrl}`;
    
    twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886",
      to: `whatsapp:${b.contactNumber.startsWith('+') ? b.contactNumber : '+' + b.contactNumber}`,
      body: whatsappMsg,
    }).catch(err => console.error("WhatsApp Error:", err.message));

    // 3. Send Email via Resend
    const { data, error } = await resend.emails.send({
      from: 'MGA Connect <onboarding@resend.dev>',
      to: [b.email],
      subject: `Booking Confirmation: ${displayId}`,
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #003366;">MGA CONNECT - CONFIRMED ✈️</h2>
          <p>Hello <strong>${b.name}</strong>, your trip is booked!</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
            <p>🆔 <strong>Booking ID:</strong> ${displayId}</p>
            <p>📅 <strong>Date:</strong> ${b.flightDate || b.date}</p>
            <p>⏰ <strong>Time:</strong> ${b.flightTime || b.time}</p>
          </div>
          <br />
          <a href="${cancelUrl}" style="background: #d9534f; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Cancel Booking</a>
        </div>`
    });

    if (error) return res.status(400).json(error);
    res.status(200).json({ message: "Notifications sent!", data });

  } catch (err) {
    console.error("Notify Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// --- 5. CANCELLATION ROUTES (TWO-STEP) ---

// Step 1: Confirmation Page (Safe for Bots)
app.get("/cancel/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).send("<h1>Booking not found</h1>");

    if (booking.status === "Cancelled") {
      return res.send(`<h1>This booking is already cancelled.</h1>`);
    }

    res.send(`
      <div style="font-family: Arial; text-align: center; padding: 50px;">
        <h1 style="color: #003366;">MGA CONNECT</h1>
        <h2>Confirm Cancellation</h2>
        <p>Are you sure you want to cancel the booking for <strong>${booking.name}</strong>?</p>
        <form action="/cancel-confirm/${req.params.id}" method="POST">
          <button type="submit" style="background: #d9534f; color: white; padding: 15px 25px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
            YES, CANCEL MY BOOKING
          </button>
        </form>
      </div>
    `);
  } catch (err) {
    res.status(500).send("Error loading page");
  }
});

// Step 2: Final Database Update (Human only)
app.post("/cancel-confirm/:id", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { status: "Cancelled" },
      { new: true }
    );
    res.send(`<h1>Cancelled Successfully</h1><p>Booking for ${booking.name} is updated.</p>`);
  } catch (err) {
    res.status(500).send("Error confirming cancellation");
  }
});

// --- 6. Start Server ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is live on port ${PORT}`);
});