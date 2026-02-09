import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Booking from "./Booking";
import Dashboard from "./Dashboard";
import CancelBooking from "./CancelBooking";

function App() {
  return (
    <Router>
      {/* We removed the Navbar entirely. 
        Now, the user only sees the component assigned to the URL they visit.
      */}
      <Routes>
        {/* URL: http://192.168.1.5:3000/ */}
        <Route path="/" element={<Booking />} />
        
        {/* URL: http://192.168.1.5:3000/dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* URL for cancellations via email links */}
        <Route path="/cancel/:id" element={<CancelBooking />} />
      </Routes>
    </Router>
  );
}

export default App;