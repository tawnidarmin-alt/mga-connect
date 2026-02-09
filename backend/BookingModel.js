const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  bookingCode: String,
  name: String,
  email: String,
  contactNumber: String,
  flightNumber: String,
  flightDate: String,
  flightTime: String,
  arrivalDeparture: String,
  numberOfPassenger: String,
  passengerCategory: String,
  corporateBankName: String,
  serviceType: String,
  numberOfLuggage: String,
  lounge: String,
  transport: String,
  hotel: String,
  payment: String,
  otherRequirement: String,
  // Staff Editable & Logic Fields
  staffName: { type: String, default: "" },
  cardNo: { type: String, default: "" },
  notified: { type: Boolean, default: false }, // Fixed missing comma here
  status: { type: String, default: "Pending" }  // This is what makes the cancellation work
}, { timestamps: true });

module.exports = mongoose.model("Booking", BookingSchema);