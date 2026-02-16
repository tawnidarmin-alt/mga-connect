import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Booking from "./Booking";
import Dashboard from "./Dashboard";
import CancelBooking from "./CancelBooking"; // 1. Added this import

function App() {
  return (
    <Router>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div className="container">
          <Link className="navbar-brand" to="/">MGA Connect</Link>
          <div className="navbar-nav">
            <Link className="nav-link" to="/">Passenger Booking</Link>
            <Link className="nav-link" to="/dashboard">Staff Dashboard</Link>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Booking />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* 2. Added the dynamic cancellation route */}
        <Route path="/cancel/:id" element={<CancelBooking />} />
      </Routes>
    </Router>
  );
}

export default App;