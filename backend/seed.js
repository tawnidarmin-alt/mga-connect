const mongoose = require("mongoose");
const Booking = require("./BookingModel"); // Matches your BookingModel.js file

// Ensure this matches the database name in your server.js
const MONGO_URI = "mongodb://127.0.0.1:27017/mga_connect"; 

const seedData = [
  {
    name: "Mohammed Salimullah",
    email: "tawnidarmin@gmail.com",
    contactNumber: "9172548344",
    flightNumber: "BG0444",
    flightDate: "2025-11-03",
    flightTime: "18:43",
    arrivalDeparture: "Departure",
    numberOfPassenger: 2,
    serviceType: "Standard",
    payment: "Cash",
    status: "Pending"
  }
];

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("🌱 Connected to MongoDB...");
    await Booking.deleteMany({}); // Clears the table
    await Booking.insertMany(seedData);
    console.log("✅ Seed Complete! 1 Passenger added.");
    process.exit();
  })
  .catch(err => {
    console.error("❌ Error:", err);
    process.exit(1);
  });