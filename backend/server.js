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

// 1. THE NOTIFICATION ROUTE
app.post("/notify-client/:id", async (req, res) => {
  try {
    const b = await Booking.findById(req.params.id);
    if (!b) return res.status(404).json({ error: "Booking not found" });

    // Update the DB for the Green Notified text
    b.notified = true;
    b.notificationDate = new Date();
    await b.save();

    const displayId = b.bookingCode || b.bookingId || b._id.toString().slice(-6).toUpperCase();
    
    // THE URL: We use the backend URL directly to ensure the server catches the click
    const cancelUrl = `https://mga-connect.onrender.com/cancel/${b._id}`;

    // Send success to browser immediately
    res.status(200).json({ success: true, message: "Notifications sent!" });

    // WhatsApp
    const whatsappMsg = `*MGA CONNECT - BOOKING CONFIRMED* ✈️\n\nHello *${b.name}*,\nID: ${displayId}\nDate: ${b.flightDate}\nTime: ${b.flightTime}\nPax: ${b.numberOfPassenger}\n\n*Manage:* ${cancelUrl}`;
    twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${b.contactNumber.startsWith('+') ? b.contactNumber : '+' + b.contactNumber}`,
      body: whatsappMsg,
    }).catch(err => console.error("WhatsApp Error:", err.message));

    // Email
    resend.emails.send({
      from: 'MGA Connect <onboarding@resend.dev>',
      to: b.email,
      subject: `Booking Confirmation: ${displayId}`,
      html: `
        <div style="font-family: Arial; padding: 20px; border: 1px solid #eee; max-width: 600px;">
          <h2 style="color: #003366;">MGA CONNECT - CONFIRMED ✈️</h2>
          <p>Hello <strong>${b.name}</strong>, your trip is booked!</p>
          <p>🆔 ID: ${displayId}<br>📅 Date: ${b.flightDate}<br>🕒 Time: ${b.flightTime}<br>🔢 Pax: ${b.numberOfPassenger}</p>
          <div style="margin: 20px 0;">
            <a href="${cancelUrl}" style="background-color: #d9534f; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Cancel Booking</a>
          </div>
          <p style="font-size: 10px; color: #999;">Link: ${cancelUrl}</p>
        </div>`
    }).catch(err => console.error("Email Error:", err.message));

  } catch (err) {
    console.error("Route Error:", err.message);
  }
});

// 2. THE CANCELLATION ROUTE (Must match the URL above exactly)
app.get("/cancel/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).send("<h1>Booking not found</h1>");

    booking.status = "Cancelled";
    await booking.save();

    res.send(`
      <div style="font-family: Arial; text-align: center; padding: 50px;">
        <h1 style="color: #003366;">MGA CONNECT</h1>
        <h2 style="color: #d9534f;">Booking Cancelled</h2>
        <p>Your booking for <strong>${booking.name}</strong> has been cancelled.</p>
      </div>
    `);
  } catch (err) {
    res.status(500).send("Error processing request");
  }
});