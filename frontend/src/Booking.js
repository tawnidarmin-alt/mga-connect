import React, { useState } from "react";
import axios from "axios";

const Booking = () => {
  const [formData, setFormData] = useState({
    name: "", email: "", contactNumber: "",
    flightNumber: "", flightDate: "", flightTime: "",
    arrivalDeparture: "Arrival", numberOfPassenger: 1,
    passengerCategory: "Spot", corporateBankName: "",
    serviceType: "Standard", numberOfLuggage: 0,
    lounge: "Not Reqd", transport: "Not Reqd",
    hotel: "Not Reqd", payment: "Cash",
    otherRequirement: ""
  });

  const [submitted, setSubmitted] = useState(false); // State for Success Screen

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Changing the IP to localhost ensures it works on your Mac every time
    axios.post("http://localhost:5001/bookings", formData)
      .then(() => {
        setSubmitted(true);
      })
      .catch((err) => {
        console.error(err);
        alert("Error submitting booking. Please check if the backend server is running.");
      });
  };

  return (
    <div className="container py-3" style={{ maxWidth: "720px" }}>
      {/* BRAND LOGO */}
      <div className="text-center mb-3">
        <img 
          src="/mga-logo.png" 
          alt="MGA CONNECT Logo" 
          style={{ maxWidth: "160px", height: "auto" }} 
        />
      </div>

      {submitted ? (
        /* SUCCESS VIEW */
        <div className="card shadow-sm border-0 text-center p-5">
          <div className="card-body">
            <div className="mb-4" style={{ fontSize: "50px" }}>✅</div>
            <h2 className="fw-bold text-primary">Booking Confirmed!</h2>
            <p className="text-muted">
              Thank you, <strong>{formData.name}</strong>.<br />
              Your details have been sent to WhatsApp successfully.
            </p>
            <button 
              className="btn btn-primary mt-4 px-4"
              onClick={() => {
                setSubmitted(false);
                setFormData({ ...formData, name: "" }); // Optional: Reset form
              }}
            >
              Create New Booking
            </button>
          </div>
        </div>
      ) : (
        /* COMPACT FORM VIEW */
        <div className="card shadow-sm border-0">
          <div className="card-header bg-primary text-white py-2 text-center">
            <h5 className="mb-0 text-danger">VERIFIED LONG FORM 2026</h5>
          </div>
          <div className="card-body p-3">
            <form onSubmit={handleSubmit}>
              
              {/* ROW 1: Name & Email */}
              <div className="row mb-2">
                <div className="col-6">
                  <label className="form-label fw-bold small mb-1">Full Name *</label>
                  <input name="name" className="form-control form-control-sm" onChange={handleChange} required />
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold small mb-1">Email Address</label>
                  <input name="email" type="email" className="form-control form-control-sm" onChange={handleChange} />
                </div>
              </div>

              {/* ROW 2: Contact & Flight No */}
              <div className="row mb-2">
                <div className="col-6">
                  <label className="form-label fw-bold small mb-1">Contact Number *</label>
                  <input name="contactNumber" className="form-control form-control-sm" onChange={handleChange} required />
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold small mb-1">Flight Number *</label>
                  <input name="flightNumber" className="form-control form-control-sm" onChange={handleChange} required />
                </div>
              </div>

              {/* ROW 3: Flight Date & Time */}
              <div className="row mb-2">
                <div className="col-6">
                  <label className="form-label fw-bold small mb-1">Flight Date *</label>
                  <input name="flightDate" type="date" className="form-control form-control-sm" onChange={handleChange} required />
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold small mb-1">Flight Time</label>
                  <input name="flightTime" type="time" className="form-control form-control-sm" onChange={handleChange} />
                </div>
              </div>

              {/* ROW 4: Arr/Dep & Pax */}
              <div className="row mb-2">
                <div className="col-6">
                  <label className="form-label fw-bold small mb-1">Arrival / Departure *</label>
                  <select name="arrivalDeparture" className="form-select form-select-sm" onChange={handleChange} required>
                    <option value="Arrival">Arrival</option>
                    <option value="Departure">Departure</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold small mb-1">No. of Passengers *</label>
                  <input name="numberOfPassenger" type="number" min="1" className="form-control form-control-sm" onChange={handleChange} required />
                </div>
              </div>

              {/* ROW 5: Category & Corp/Bank */}
              <div className="row mb-2">
                <div className="col-6">
                  <label className="form-label fw-bold small mb-1">Passenger Category *</label>
                  <select name="passengerCategory" className="form-select form-select-sm" onChange={handleChange} required>
                    <option value="Spot">Spot</option>
                    <option value="Bank">Bank</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold small mb-1">Corp/Bank Name *</label>
                  <input name="corporateBankName" className="form-control form-control-sm" onChange={handleChange} required />
                </div>
              </div>

              {/* ROW 6: Service Type & Luggage */}
              <div className="row mb-2">
                <div className="col-6">
                  <label className="form-label fw-bold small mb-1">Service Type *</label>
                  <select name="serviceType" className="form-select form-select-sm" onChange={handleChange} required>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold small mb-1">No. of Luggage</label>
                  <input name="numberOfLuggage" type="number" min="0" className="form-control form-control-sm" onChange={handleChange} />
                </div>
              </div>

              {/* ROW 7: Lounge & Transport */}
              <div className="row mb-2">
                <div className="col-6">
                  <label className="form-label fw-bold small mb-1">Lounge Access</label>
                  <select name="lounge" className="form-select form-select-sm" onChange={handleChange}>
                    <option value="Not Reqd">Not Required</option>
                    <option value="Required">Required</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold small mb-1">Transport Service</label>
                  <select name="transport" className="form-select form-select-sm" onChange={handleChange}>
                    <option value="Not Reqd">Not Required</option>
                    <option value="Required">Required</option>
                  </select>
                </div>
              </div>

              {/* ROW 8: Hotel & Payment */}
              <div className="row mb-2">
                <div className="col-6">
                  <label className="form-label fw-bold small mb-1">Hotel Booking</label>
                  <select name="hotel" className="form-select form-select-sm" onChange={handleChange}>
                    <option value="Not Reqd">Not Required</option>
                    <option value="Required">Required</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold small mb-1">Payment Method *</label>
                  <select name="payment" className="form-select form-select-sm" onChange={handleChange} required>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Invoice">Invoice</option>
                  </select>
                </div>
              </div>

              {/* ROW 9: Requirements */}
              <div className="row mb-3">
                <div className="col-12">
                  <label className="form-label fw-bold small mb-1">Other Requirements</label>
                  <textarea 
                    name="otherRequirement" 
                    className="form-control form-control-sm" 
                    rows="2" 
                    onChange={handleChange} 
                    placeholder="Optional requests..."
                  ></textarea>
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100 fw-bold shadow-sm">
                Confirm & Submit Booking
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;