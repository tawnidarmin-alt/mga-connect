// src/BookingSummary.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css"; // reuse your table styling

const BASE_URL = "http://192.168.1.5:5001";

const BookingSummary = ({ isStaff }) => {
  const [bookings, setBookings] = useState([]);

  // Fetch bookings from backend
  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/bookings`);
      setBookings(res.data);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    }
  };

  useEffect(() => {
    if (isStaff) fetchBookings();
  }, [isStaff]);

  // Handle status change
  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${BASE_URL}/bookings/${id}`, { status: newStatus });
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Handle staff change
  const handleStaffChange = async (id, staffName) => {
    try {
      await axios.put(`${BASE_URL}/bookings/${id}`, { staff: staffName });
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, staff: staffName } : b))
      );
    } catch (err) {
      console.error("Error updating staff:", err);
    }
  };

  // Notify client
  const handleNotifyClient = async (bookingCode) => {
    try {
      await axios.post(`${BASE_URL}/bookings/notify/${bookingCode}`);
      setBookings((prev) =>
        prev.map((b) =>
          b.bookingCode === bookingCode
            ? { ...b, action: "Notified", status: "Notified" }
            : b
        )
      );
    } catch (err) {
      console.error("Error notifying client:", err);
    }
  };

  return (
    <div className="summary-container">
      <h3 className="summary-title">Booking Summary</h3>
      <div className="table-wrapper">
        <table className="summary-table">
          <thead>
            <tr>
              <th style={{ width: "80px" }}>Booking Code</th>
              <th style={{ width: "140px" }}>Name</th>
              <th style={{ width: "150px" }}>Email</th>
              <th style={{ width: "100px" }}>Contact No</th>
              <th style={{ width: "70px" }}>Flight No</th>
              <th style={{ width: "80px" }}>Flt Date</th>
              <th style={{ width: "60px" }}>Flt Time</th>
              <th style={{ width: "70px" }}>Arr/Dep</th>
              <th style={{ width: "50px" }}>No of PaX</th>
              <th style={{ width: "90px" }}>Category</th>
              <th style={{ width: "100px" }}>Corp/Bank Name</th>
              <th style={{ width: "80px" }}>Service Type</th>
              <th style={{ width: "60px" }}>No of Luggage</th>
              <th style={{ width: "80px" }}>Lounge</th>
              <th style={{ width: "90px" }}>Transport</th>
              <th style={{ width: "80px" }}>Hotel</th>
              <th style={{ width: "70px" }}>Payment</th>
              <th style={{ width: "150px" }}>Other Req</th>
              <th style={{ width: "100px" }}>Status</th>
              <th style={{ width: "100px" }}>Staff</th>
              <th style={{ width: "90px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b._id}>
                <td>{b.bookingCode}</td>
                <td>{b.name}</td>
                <td>{b.email}</td>
                <td>{b.contactNumber}</td>
                <td>{b.flightNumber}</td>
                <td>{b.flightDate}</td>
                <td>{b.flightTime}</td>
                <td>{b.arrivalDeparture}</td>
                <td>{b.numberOfPassenger}</td>
                <td>{b.passengerCategory}</td>
                <td>{b.corporateBankName}</td>
                <td>{b.serviceType}</td>
                <td>{b.numberOfLuggage}</td>
                <td>{b.lounge}</td>
                <td>{b.transport}</td>
                <td>{b.hotel}</td>
                <td>{b.payment}</td>
                <td>{b.otherRequirement}</td>

                {/* Status Dropdown */}
                <td>
                  <select
                    value={b.status}
                    onChange={(e) =>
                      handleStatusChange(b._id, e.target.value)
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="Updated">Updated</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Notified">Notified</option>
                  </select>
                </td>

                {/* Staff Input */}
                <td>
                  <input
                    type="text"
                    value={b.staff || ""}
                    onChange={(e) => handleStaffChange(b._id, e.target.value)}
                    placeholder="Staff"
                  />
                </td>

                {/* Action Button */}
                <td>
                  {b.action === "Notified" ? (
                    <span style={{ color: "green", fontWeight: "bold" }}>
                      Notified
                    </span>
                  ) : b.action === "Cancelled" ? (
                    <span style={{ color: "red", fontWeight: "bold" }}>
                      Cancelled
                    </span>
                  ) : (
                    <button onClick={() => handleNotifyClient(b.bookingCode)}>
                      Notify Client
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingSummary;