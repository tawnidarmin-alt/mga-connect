require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));
// 1. Initialize Twilio Client
const twilioClient = new twilio(
  process.env.TWILIO_ACCOUNT_SID, 
  process.env.TWILIO_AUTH_TOKEN
);

// 2. Define the Twilio Number
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_NUMBER || "whatsapp:+14155238886";

// 3. Initialize Nodemailer
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// --- 1. Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- 2. Booking Model ---
const bookingSchema = new mongoose.Schema({
  bookingId: String,
  name: String,
  email: String,
  contactNumber: String,
  flightNumber: String,
  flightDate: String,
  flightTime: String,
  arrivalDeparture: String,   // Matches form
  numberOfPassenger: Number,  // Matches form
  passengerCategory: String,  // Matches form
  corporateBankName: String,  // Matches form
  serviceType: String,        // Matches form
  numberOfLuggage: Number,    // Matches form
  lounge: String,             // Matches form
  transport: String,          // Matches form
  hotel: String,              // Matches form
  payment: String,            // Matches form
  otherRequirement: String,   // Matches form
  notified: { type: Boolean, default: false },
  status: { type: String, default: "Active" }
}, { timestamps: true });

const Booking = require("./BookingModel"); 

// --- 4. Routes ---

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
    console.error("Error creating booking:", error);
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

// Update Booking
app.put("/update-booking/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // The 'strict: false' tells MongoDB to save the data even if the schema is acting up
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, strict: false } 
    );

    console.log("SUCCESS! Database now holds:", {
      staffName: updatedBooking.staffName,
      cardNo: updatedBooking.cardNo
    });

    res.json(updatedBooking);
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.post("/notify-client/:id", async (req, res) => {
  try {
    const b = await Booking.findById(req.params.id);
    if (!b) return res.status(404).json({ error: "Booking not found" });

    const displayId = b.bookingCode || b.bookingId || b._id.toString().slice(-6).toUpperCase();
    const cancelUrl = `https://mga-connect-frontend.onrender.com/cancel/${b._id}`;

    // 1. Send Success to Browser FIRST so it doesn't say "Failed"
    res.status(200).json({ success: true, message: "Notifications triggered" });

    // 2. Background WhatsApp (This is working excellently!)
    const whatsappMsg = `*MGA CONNECT - BOOKING CONFIRMED* ✈️\n\nHello *${b.name}*,\nID: ${displayId}\nDate: ${b.flightDate}\nTime: ${b.flightTime}\nPax: ${b.numberOfPassenger}\n\n*Manage:* ${cancelUrl}`;
    
    twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${b.contactNumber.startsWith('+') ? b.contactNumber : '+' + b.contactNumber}`,
      body: whatsappMsg,
    }).catch(err => console.error("WhatsApp Error:", err.message));

    // 3. Background Email 
    // NOTE: This will only work for tawnidarmin@gmail.com until you verify a domain!
    resend.emails.send({
      from: 'MGA Connect <onboarding@resend.dev>',
      to: b.email,
      subject: `Booking Confirmation: ${displayId}`,
      html: `
        <div style="font-family: Arial; padding: 20px; border: 1px solid #eee;">
          <h2>MGA CONNECT - CONFIRMED ✈️</h2>
          <p>Hello ${b.name}, your trip is booked.</p>
          <ul>
            <li>ID: ${displayId}</li>
            <li>Date: ${b.flightDate}</li>
          </ul>
          <a href="${cancelUrl}">Manage Booking</a>
        </div>`
    }).catch(err => {
      console.log("Email blocked by Resend Testing Mode (Check if recipient is not you)");
    });

  } catch (err) {
    console.error("Global Error:", err.message);
  }
});

// Cancel Booking Route
app.get("/cancel-booking/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).send("<h1>Booking not found</h1>");
    booking.status = "Cancelled";
    await booking.save();
    res.send(`<h1>Booking Cancelled</h1><p>Successfully cancelled for ${booking.name}.</p>`);
  } catch (err) {
    res.status(500).send("Error");
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://192.168.1.5:${PORT}`);
});