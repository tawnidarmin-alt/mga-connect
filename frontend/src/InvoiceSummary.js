import React, { useEffect, useState } from "react";
import axios from "axios";

export default function InvoiceSummary() {
  const [view, setView] = useState("summary"); // summary | bank | corporate | others | details
  const [summary, setSummary] = useState([]);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentName, setCurrentName] = useState(""); // bank/corporate name for details
  const [category, setCategory] = useState(""); // "Bank", "Corporate", "Others"

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (view === "summary") {
          const res = await axios.get("https://mga-connect.onrender.com/invoices/summary");
          setSummary(res.data);
        } else if (view === "bank") {
          const res = await axios.get("https://mga-connect.onrender.com/invoices/banks");
          setDetails(res.data);
        } else if (view === "corporate") {
          const res = await axios.get("https://mga-connect.onrender.com/invoices/corporates");
          setDetails(res.data);
        } else if (view === "others") {
          const res = await axios.get("https://mga-connect.onrender.com/invoices/others");
          setDetails(res.data);
        } else if (view === "details") {
          const res = await axios.get(
            `https://mga-connect.onrender.com/invoices/pdf?corporateBankName=${encodeURIComponent(currentName)}`,
            { responseType: "blob" } // receive PDF
          );
          const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `Invoice_${currentName.replace(/\s/g, "_")}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          setView(category); // go back to Level 2
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setDetails([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [view, currentName, category]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  // Level 1: Summary Table
  const renderSummaryTable = () => (
    <div>
      <div style={{ marginBottom: 10 }}>
        <button style={buttonStyle} onClick={() => setView("bank")}>Bank</button>
        <button style={buttonStyle} onClick={() => setView("corporate")}>Corporate</button>
        <button style={buttonStyle} onClick={() => setView("others")}>Others</button>
      </div>
      <table style={tableStyle}>
        <thead>
          <tr style={theadStyle}>
            <th style={thStyle}>Passenger Category</th>
            <th style={thStyle}>Total Pax</th>
            <th style={thStyle}>Total Bookings</th>
            <th style={thStyle}>Total Bill Amount (BDT)</th>
            <th style={thStyle}>Action</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((item, idx) => (
            <tr key={idx}>
              <td style={tdStyle}>{item.passengerCategory}</td>
              <td style={tdCenter}>{item.pax}</td>
              <td style={tdCenter}>{item.totalBookings}</td>
              <td style={tdCenter}>{item.billAmount}</td>
              <td style={tdCenter}>
                <button
                  style={buttonStyle}
                  onClick={() => {
                    if (item.passengerCategory === "Bank") setView("bank");
                    else if (item.passengerCategory === "Corporate") setView("corporate");
                    else setView("others");
                  }}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Level 2: Details Table for individual Bank/Corporate/Other
  const renderDetailsTable = () => (
    <div>
      <button
        style={{ marginBottom: 10, ...buttonStyle }}
        onClick={() => {
          setView("summary");
          setDetails([]);
          setCurrentName("");
        }}
      >
        Back to Summary
      </button>
      <h3>{category} Details</h3>
      <table style={tableStyle}>
        <thead>
          <tr style={theadStyle}>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Total Pax</th>
            <th style={thStyle}>Total Bookings</th>
            <th style={thStyle}>Total Bill Amount (BDT)</th>
            <th style={thStyle}>Action</th>
          </tr>
        </thead>
        <tbody>
          {details.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>
                No records found
              </td>
            </tr>
          ) : (
            details.map((item, idx) => {
              const name = item.corporateBankName || item.passengerCategory || "Others";
              return (
                <tr key={idx}>
                  <td style={tdStyle}>{name}</td>
                  <td style={tdCenter}>{item.pax || item.numberOfPassenger}</td>
                  <td style={tdCenter}>{item.totalBookings || 1}</td>
                  <td style={tdCenter}>{item.billAmount || 0}</td>
                  <td style={tdCenter}>
                    <button
                      style={buttonStyle}
                      onClick={() => {
                        setCurrentName(name);
                        setCategory(category);
                        setView("details"); // triggers PDF download
                      }}
                    >
                      Generate Invoice
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>Invoice Summary</h2>
      {view === "summary" ? renderSummaryTable() : renderDetailsTable()}
    </div>
  );
}

// Common styles
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 20 };
const thStyle = { border: "1px solid #ccc", padding: 10 };
const tdStyle = { border: "1px solid #ccc", padding: 10 };
const tdCenter = { ...tdStyle, textAlign: "center" };
const theadStyle = { backgroundColor: "#f5f5f5" };
const buttonStyle = { padding: "5px 10px", cursor: "pointer", marginRight: 5 };
