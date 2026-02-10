import React, { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const CancelBooking = () => {
  const { id } = useParams();
  const [status, setStatus] = useState("pending"); // pending, success, error

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      // Changed the path from /bookings/ to /update-booking/ to match the dashboard logic
     axios.put(`https://mga-connect.onrender.com/update-booking/${id}`, { status: "Cancelled" })
        .then(() => setStatus("success"))
        .catch((err) => {
          console.error("Error details:", err);
          setStatus("error");
        });
    }
  };

  return (
    <div className="container py-5 text-center">
      <div className="card shadow mx-auto" style={{ maxWidth: "400px" }}>
        <div className="card-body p-4">
          {status === "pending" && (
            <>
              <h3 className="text-primary mb-3">MGA Connect</h3>
              <p>Would you like to cancel your booking?</p>
              <button onClick={handleCancel} className="btn btn-danger w-100 fw-bold">
                Confirm Cancellation
              </button>
            </>
          )}

          {status === "success" && (
            <div className="text-success">
              <i className="bi bi-check-circle-fill" style={{ fontSize: "3rem" }}></i>
              <h4 className="mt-3">Cancelled Successfully</h4>
              <p>Your request has been processed. Our staff has been notified.</p>
            </div>
          )}

          {status === "error" && (
            <div className="text-danger">
              <h4>Something went wrong</h4>
              <p>Please contact MGA support directly to cancel your booking.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CancelBooking;