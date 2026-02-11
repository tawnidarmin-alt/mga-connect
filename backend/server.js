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

// Notify Client
app.post("/notify-client/:id", async (req, res) => {
  console.log("1. Incoming request for ID:", req.params.id);
  try {
    const { id } = req.params;
    const b = await Booking.findById(id);
    
    if (!b) {
      console.log("2. Booking not found in DB");
      return res.status(404).json({ error: "Booking not found" });
    }

    console.log("3. Found booking for:", b.name);
    
    const displayId = b.bookingCode || b.bookingId || b._id.toString().slice(-6).toUpperCase();
const cancelUrl = `https://mga-connect-frontend.onrender.com/cancel/${b._id}`;
    
    console.log("4. Attempting WhatsApp to:", b.contactNumber);

    const whatsappMsg = 
      `*MGA CONNECT - BOOKING CONFIRMED* ✈️\n\n` +
      `Hello *${b.name}*,\n` +
      `Your trip is officially booked! Here are your details:\n\n` +
      `🆔 *Booking ID:* ${displayId}\n` +
      `📅 *Date:* ${b.flightDate}\n` +
      `🕒 *Time:* ${b.flightTime}\n` +
      `🔢 *Pax:* ${b.numberOfPassenger}\n\n` +
      `*Manage your booking here:* \n${cancelUrl}`;

    try {
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${b.contactNumber.startsWith('+') ? b.contactNumber : '+' + b.contactNumber}`,
        body: whatsappMsg,
      });
      console.log("5. WhatsApp sent!"); // Added log
    } catch (wErr) {
      console.error("❌ WhatsApp Error:", wErr.message);
    }

    // 4. Send Email via Resend
    const { data, error } = await resend.emails.send({
      from: 'MGA Connect <onboarding@resend.dev>', 
      to: b.email,
      subject: `Booking Confirmation: ${displayId}`,
      html: `
        <div style="font-family: Arial, sans-serif; border: 1px solid #eee; padding: 20px; border-radius: 10px; max-width: 600px;">
          <h2 style="color: #003366;">MGA CONNECT - BOOKING CONFIRMED ✈️</h2>
          <p>Hello <strong>${b.name}</strong>,</p>
          <p>Your trip is officially booked! Here are your details:</p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Booking ID:</strong> ${displayId}</li>
            <li><strong>Date:</strong> ${b.flightDate}</li>
            <li><strong>Time:</strong> ${b.flightTime}</li>
            <li><strong>Pax:</strong> ${b.numberOfPassenger}</li> 
          </ul>
          <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
            <p><strong>Manage your booking here:</strong></p>
            <a href="${cancelUrl}" style="background-color: #d9534f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Cancel Booking</a>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Email Error:", error);
      return res.status(500).json({ error: "Failed to send email" });
    }

    console.log("Email sent successfully:", data);

    try {
      await transporter.sendMail(mailOptions);
      console.log("6. Email sent!"); // Added log
    } catch (mErr) {
      console.error("❌ Email Error:", mErr.message);
    }

    b.notified = true;
    await b.save();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Route Error:", err.message); // Added log
    res.status(500).json({ error: err.message });
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