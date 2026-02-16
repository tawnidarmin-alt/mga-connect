import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

// --- Helper Component for Inline Editing ---
const EditableCell = ({ initialValue, onSave, disabled = false }) => {
  const [localValue, setLocalValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  // THIS FIXES THE BOOKINGSUMMARY ISSUE: 
  // It updates the cell if the database changes elsewhere
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  const handleBlur = async () => {
    if (disabled) return;
    if (localValue !== initialValue) {
      setIsSaving(true);
      const success = await onSave(localValue);
      setIsSaving(false);
      if (!success) setLocalValue(initialValue);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", minWidth: "120px" }}>
      <input
        type="text"
        value={localValue || ""}
        onChange={(e) => !disabled && setLocalValue(e.target.value)}
        onBlur={handleBlur}
        disabled={isSaving || disabled}
        style={{ 
          width: "100%",           // Fill the whole column width
          boxSizing: "border-box", // Ensure padding doesn't break the width
          fontSize: "13px",        // Slightly larger for readability
          padding: "4px",
          border: isSaving ? "1px solid orange" : (disabled ? "none" : "1px solid #ccc"),
          backgroundColor: isSaving ? "#fffdf0" : (disabled ? "transparent" : "white"),
          color: "black",
          textAlign: "center",
          borderRadius: "3px",
          cursor: disabled ? "default" : "text",
          fontWeight: disabled ? "normal" : "500"
        }}
      />
      {isSaving && (
        <span style={{ 
          position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: "-12px", 
          fontSize: "9px", color: "orange", fontWeight: "bold", whiteSpace: "nowrap"
        }}>
          Saving...
        </span>
      )}
    </div>
  );
};

// --- Main Dashboard Component ---
const Dashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const API_BASE = "http://192.168.1.5:5001";

  const fetchBookings = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/bookings`);
      setBookings(response.data);
    } catch (err) { console.error("Fetch Error:", err); }
  }, [API_BASE]);

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 5000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  const updateDatabase = async (id, field, value) => {
    try {
      const response = await axios.put(`${API_BASE}/update-booking/${id}`, { [field]: value });
      if (response.status === 200) {
        setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, ...response.data } : b)));
        return true;
      }
    } catch (err) { return false; }
  };

  const notifyClient = async (id) => {
    try {
      await axios.post(`${API_BASE}/notify-client/${id}`);
      alert("Notification sent successfully!");
      fetchBookings();
    } catch (err) { alert("Failed to send notification."); }
  };

  const handleLogout = () => { setIsAuthenticated(false); setPassword(""); };
  const resetFilters = () => { setSearchTerm(""); setStartDate(""); setEndDate(""); setFilterCategory(""); };

  const filteredBookings = bookings.filter(b => {
    const bDate = b.flightDate;
    const dateInRange = (!startDate || bDate >= startDate) && (!endDate || bDate <= endDate);
    const matchesSearch = (b.name?.toLowerCase().includes(searchTerm.toLowerCase())) || 
                          (b.bookingId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (b.corporateBankName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (b.staffName?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === "" || b.passengerCategory === filterCategory;
    return dateInRange && matchesSearch && matchesCategory;
  });

  const downloadCSV = () => {
    const headers = [
      "Code", "Name", "Email", "Contact No", "Flight", "Flt Date", 
      "Flt Time", "Arr/Dep", "No of Pax", "Category", "Bank/Corp", 
      "Service", "No of Luggage", "Lounge", "Transport", "Hotel", 
      "Payment", "Other Req.", "Staff Name", "Card No", "Status"
    ];
    const rows = filteredBookings.map(b => [
      b.bookingId || "N/A",
      b.name || "N/A",
      b.email || "N/A",
      b.contactNumber || "N/A",
      b.flightNumber || "N/A",
      b.flightDate || "N/A",
      b.flightTime || "N/A",
      b.arrivalDeparture || "N/A",
      b.numberOfPassenger || "0",
      b.passengerCategory || "N/A",
      b.corporateBankName || "N/A",
      b.serviceType || "N/A",
      b.numberOfLuggage || "0",
      b.lounge || "N/A",
      b.transport || "N/A",
      b.hotel || "N/A",
      b.payment || "N/A",
      `"${(b.otherRequirement || "").replace(/"/g, '""')}"`, // Handles commas/quotes in notes
      b.staffName || "",
      b.cardNo || "",
      b.status === "Cancelled" ? "CANCELLED" : (b.notified ? "NOTIFIED" : "ACTIVE")
    ]);
    const csvContent = [headers, ...rows]
      .map(e => e.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `MGA_Full_Report_${new Date().toLocaleDateString()}.csv`);
    link.click();
  };

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px", fontFamily: "Arial" }}>
        <h3 style={{ color: "#003366" }}>Staff Login</h3>
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} style={{ padding: "12px", borderRadius: "4px", border: "1px solid #ccc" }} />
        <button onClick={() => password === "MGA2024" ? setIsAuthenticated(true) : alert("Wrong Password")} style={{ padding: "10px 25px", backgroundColor: "#003366", color: "white", marginLeft: "10px" }}>Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "10px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <img src="/mga-logo.png" alt="MGA Logo" style={{ width: "180px" }} />
        <h2 style={{ color: "#003366" }}>MGA Connect Staff Dashboard</h2>
      </div>

      {/* Blue Search Panel */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginBottom: "20px", backgroundColor: "#e7f1ff", padding: "20px", borderRadius: "10px", border: "1px solid #cfe2ff", alignItems: "flex-end" }}>
        <div style={{ flex: 2, minWidth: "200px" }}>
          <label style={{ fontSize: "12px", fontWeight: "bold" }}>Search Name / Bank / Staff / ID</label>
          <input type="text" value={searchTerm} placeholder="Search..." style={{ padding: "8px", width: "100%" }} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: "12px", fontWeight: "bold" }}>From Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: "8px" }} />
        </div>
        <div>
          <label style={{ fontSize: "12px", fontWeight: "bold" }}>To Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: "8px" }} />
        </div>
        <div>
          <label style={{ fontSize: "12px", fontWeight: "bold" }}>Category</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ padding: "8px" }}>
            <option value="">All Categories</option>
            <option value="Spot">Spot</option>
            <option value="Bank">Bank</option>
            <option value="Corporate">Corporate</option>
          </select>
        </div>
        <button onClick={resetFilters} style={{ padding: "8px 15px", backgroundColor: "#6c757d", color: "white", fontWeight: "bold" }}>Reset All</button>
      </div>

      {/* Blue Status Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", backgroundColor: "#e7f1ff", borderRadius: "8px", border: "1px solid #cfe2ff", marginBottom: "15px" }}>
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "#003366" }}>🔍 Found {filteredBookings.length} Bookings</div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={downloadCSV} style={{ padding: "10px 18px", backgroundColor: "#198754", color: "white", fontWeight: "bold" }}>📥 Download Excel</button>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>

  {/* NEW: Admin Unlock Button */}
  <button 
  onClick={() => {
    if (isAdminUnlocked) {
      setIsAdminUnlocked(false);
    } else {
      const pin = prompt("RESTRICTED: Enter Admin Master PIN:");
      // Use your secret PIN here
      if (pin === "MASTER2024") { 
        setIsAdminUnlocked(true);
        
        // SEND LOG TO BACKEND
        axios.post(`${API_BASE}/audit-log`, {
          action: "ADMIN_UNLOCK",
          timestamp: new Date().toISOString(),
          details: "Master Admin PIN used to unlock restricted fields."
        }).catch(err => console.error("Logging failed", err));
      } else if (pin !== null) {
        alert("Incorrect PIN.");
      }
    }
  }}
  style={{ 
    padding: "10px 18px", 
    backgroundColor: isAdminUnlocked ? "#dc3545" : "#6c757d", 
    color: "white", 
    border: "none", 
    borderRadius: "6px", 
    cursor: "pointer",
    fontWeight: "bold"
  }}
>
  {isAdminUnlocked ? "🔒 Lock Admin Fields" : "🔓 Unlock Admin Edit"}
</button>
</div>
          <button onClick={handleLogout} style={{ padding: "10px 18px", backgroundColor: "#dc3545", color: "white", fontWeight: "bold" }}>🔒 Logout</button>
        </div>
      </div>

      {/* Full Table with All Fields */}
      <div style={{ overflowX: "auto", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", whiteSpace: "nowrap", border: "1px solid #dee2e6" }}>
<thead>
  <tr style={{ backgroundColor: "#003366", color: "white" }}>
    <th style={{ ...pStyle, padding: "12px", width: "130px" }}>Code</th>
    <th style={{ ...pStyle, width: "200px" }}>Name</th>
    <th style={{ ...pStyle, width: "250px" }}>Email</th>
    <th style={{ ...pStyle, width: "160px" }}>Contact No</th>
    <th style={{ ...pStyle, width: "100px" }}>Flight</th>
    <th style={{ ...pStyle, width: "110px" }}>Flt Date</th>
    <th style={{ ...pStyle, width: "90px" }}>Flt Time</th>
    <th style={{ ...pStyle, width: "90px" }}>Arr/Dep</th>
    <th style={{ ...pStyle, width: "80px" }}>No of Pax</th>
    <th style={{ ...pStyle, width: "100px" }}>Category</th>
    <th style={{ ...pStyle, width: "120px" }}>Bank/Corp</th>
    <th style={{ ...pStyle, width: "120px" }}>Service</th>
    <th style={{ ...pStyle, width: "100px" }}>No of Luggage</th>
    <th style={{ ...pStyle, width: "90px" }}>Lounge</th>
    <th style={{ ...pStyle, width: "100px" }}>Transport</th>
    <th style={{ ...pStyle, width: "90px" }}>Hotel</th>
    <th style={{ ...pStyle, width: "100px" }}>Payment</th>
    {/* This one usually needs the most space */}
    <th style={{ ...pStyle, width: "300px" }}>Other Req.</th>
    <th style={{ ...pStyle, width: "140px" }}>Staff Name</th>
    <th style={{ ...pStyle, width: "140px" }}>Card No</th>
    <th style={{ ...pStyle, width: "100px" }}>Action</th>
  </tr>
</thead>
          <tbody>
  {filteredBookings.map((b) => (
    <tr key={b._id} style={{ textAlign: "center", backgroundColor: b.status === "Cancelled" ? "#ffdce0" : "#e6ffed", borderBottom: "1px solid #eee" }}>
      <td style={pStyle}>{b.bookingId || "N/A"}</td>
      
      {/* Each cell below is now EITHER plain text (Locked) OR an Input (Unlocked) */}
      <td style={{ ...pStyle, minWidth: "150px" }}>
  <EditableCell 
    key={`${b._id}-name-${b.name}`} 
    initialValue={b.name} 
    onSave={(val) => updateDatabase(b._id, "name", val)} 
    disabled={!isAdminUnlocked} 
  />
</td>
      <td style={{ ...pStyle, minWidth: "220px" }}>
  <EditableCell 
    key={`${b._id}-email-${b.email}`}
    initialValue={b.email} 
    onSave={(val) => updateDatabase(b._id, "email", val)} 
    disabled={!isAdminUnlocked} 
  />
</td>
      <td style={pStyle}><EditableCell initialValue={b.contactNumber} onSave={(val) => updateDatabase(b._id, "contactNumber", val)} disabled={!isAdminUnlocked} /></td>
      <td style={pStyle}><EditableCell initialValue={b.flightNumber} onSave={(val) => updateDatabase(b._id, "flightNumber", val)} disabled={!isAdminUnlocked} /></td>
      <td style={pStyle}><EditableCell initialValue={b.flightDate} onSave={(val) => updateDatabase(b._id, "flightDate", val)} disabled={!isAdminUnlocked} /></td>
      <td style={pStyle}><EditableCell initialValue={b.flightTime} onSave={(val) => updateDatabase(b._id, "flightTime", val)} disabled={!isAdminUnlocked} /></td>
      <td style={pStyle}><EditableCell initialValue={b.arrivalDeparture} onSave={(val) => updateDatabase(b._id, "arrivalDeparture", val)} disabled={!isAdminUnlocked} /></td>
      <td style={pStyle}><EditableCell initialValue={b.numberOfPassenger} onSave={(val) => updateDatabase(b._id, "numberOfPassenger", val)} disabled={!isAdminUnlocked} /></td>
      <td style={pStyle}><EditableCell initialValue={b.passengerCategory} onSave={(val) => updateDatabase(b._id, "passengerCategory", val)} disabled={!isAdminUnlocked} /></td>
      <td style={pStyle}><EditableCell initialValue={b.corporateBankName} onSave={(val) => updateDatabase(b._id, "corporateBankName", val)} disabled={!isAdminUnlocked} /></td>
      <td style={pStyle}><EditableCell initialValue={b.serviceType} onSave={(val) => updateDatabase(b._id, "serviceType", val)} disabled={!isAdminUnlocked} /></td>
      <td style={pStyle}><EditableCell initialValue={b.numberOfLuggage} onSave={(val) => updateDatabase(b._id, "numberOfLuggage", val)} disabled={!isAdminUnlocked} /></td>
      <td style={pStyle}><EditableCell initialValue={b.lounge} onSave={(val) => updateDatabase(b._id, "lounge", val)} disabled={!isAdminUnlocked} /></td>
      <td style={pStyle}><EditableCell initialValue={b.transport} onSave={(val) => updateDatabase(b._id, "transport", val)} disabled={!isAdminUnlocked} /></td>
      <td style={pStyle}><EditableCell initialValue={b.hotel} onSave={(val) => updateDatabase(b._id, "hotel", val)} disabled={!isAdminUnlocked} /></td>
      <td style={pStyle}><EditableCell initialValue={b.payment} onSave={(val) => updateDatabase(b._id, "payment", val)} disabled={!isAdminUnlocked} /></td>
      <td style={{ ...pStyle, width: "350px", minWidth: "300px" }}>
  <EditableCell 
    initialValue={b.otherRequirement} 
    onSave={(val) => updateDatabase(b._id, "otherRequirement", val)} 
    disabled={!isAdminUnlocked} 
  />
</td>     

      {/* STAFF FIELDS (Always Unlocked) */}
      <td style={pStyle}>
        <EditableCell initialValue={b.staffName} onSave={(val) => updateDatabase(b._id, "staffName", val)} disabled={false} />
      </td>
      <td style={pStyle}>
        <EditableCell initialValue={b.cardNo} onSave={(val) => updateDatabase(b._id, "cardNo", val)} disabled={false} />
      </td>

      <td style={pStyle}>
        {b.status === "Cancelled" ? <span style={{ color: "red", fontWeight: "bold" }}>CANCELLED</span> : 
         b.notified ? <span style={{ color: "green", fontWeight: "bold" }}>NOTIFIED</span> : 
         <button onClick={() => notifyClient(b._id)} style={btnStyle}>Notify</button>}
      </td>
    </tr>
  ))}
</tbody>
        </table>
      </div>
    </div>
  );
};

const pStyle = { padding: "8px", border: "1px solid #ddd" };
const btnStyle = { backgroundColor: "#007bff", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" };

export default Dashboard;