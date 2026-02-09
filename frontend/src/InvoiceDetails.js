// src/InvoiceDetails.js
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function InvoiceDetails() {
  const { clientName } = useParams();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(""); // YYYY-MM format

  // Fetch data
  const fetchClientDetails = useCallback(
    async (month = "") => {
      try {
        let url = `http://localhost:5001/invoices/details?corporateBankName=${encodeURIComponent(
          clientName
        )}`;
        if (month) url += `&month=${month}`;
        const res = await axios.get(url);
        setRows(res.data || []);
      } catch (err) {
        console.error("Error fetching client details:", err);
        alert("Failed to load client invoice details.");
      }
    },
    [clientName]
  );

  useEffect(() => {
    fetchClientDetails(selectedMonth);
  }, [fetchClientDetails, selectedMonth]);

  // Totals
  const totalPax = rows.reduce((sum, b) => sum + Number(b.numberOfPassenger || 0), 0);
  const totalBill = rows.reduce((sum, b) => sum + Number(b.billAmount || 0), 0);
  const vat = +(totalBill * 0.15).toFixed(2);
  const grandTotal = +(totalBill + vat).toFixed(2);

  // Month label
  const monthYearLabel = () => {
    const sample = rows?.[0]?.flightDate || null;
    if (sample && /^\d{4}-\d{2}-\d{2}$/.test(sample)) {
      const [y, m] = sample.split("-").map(Number);
      const d = new Date(y, m - 1, 1);
      return d.toLocaleString("default", { month: "long", year: "numeric" });
    }
    return new Date().toLocaleString("default", { month: "long", year: "numeric" });
  };

  // Download PDF
  const downloadPDF = async () => {
    const invoiceElement = document.getElementById("invoice-content");
    const canvas = await html2canvas(invoiceElement, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${clientName}_Invoice.pdf`);
  };

  const buttonStyle = {
    border: "none",
    borderRadius: "5px",
    padding: "5px 12px",
    fontSize: "13px",
    cursor: "pointer",
    marginBottom: "18px",
    marginRight: "8px",
  };

  return (
    <div
      style={{
        maxWidth: 1280,
        margin: "36px auto",
        padding: "0 24px",
        background: "#f5faff",
        minHeight: "100vh",
      }}
    >
      {/* Month Filter */}
      <div style={{ textAlign: "right", marginBottom: "20px" }}>
        <label style={{ marginRight: "8px" }}>Select Month:</label>
        <select
          value={selectedMonth.split("-")[1] || ""}
          onChange={(e) =>
            setSelectedMonth(`${selectedMonth.split("-")[0] || "2025"}-${e.target.value}`)
          }
        >
          <option value="">--Month--</option>
          <option value="01">January</option>
          <option value="02">February</option>
          <option value="03">March</option>
          <option value="04">April</option>
          <option value="05">May</option>
          <option value="06">June</option>
          <option value="07">July</option>
          <option value="08">August</option>
          <option value="09">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>

        <select
          value={selectedMonth.split("-")[0] || ""}
          onChange={(e) =>
            setSelectedMonth(`${e.target.value}-${selectedMonth.split("-")[1] || "01"}`)
          }
          style={{ marginLeft: "8px" }}
        >
          <option value="">--Year--</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
          <option value="2028">2028</option>
          <option value="2029">2029</option>
        </select>

        <button
          onClick={() => fetchClientDetails(selectedMonth)}
          style={{ marginLeft: "8px", padding: "5px 10px", cursor: "pointer" }}
        >
          Filter
        </button>
      </div>

      {/* Buttons */}
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <button
          onClick={downloadPDF}
          style={{ ...buttonStyle, background: "#007bff", color: "#fff" }}
        >
          📄 Download PDF
        </button>

        <button
          onClick={() => window.print()}
          style={{ ...buttonStyle, background: "#28a745", color: "#fff" }}
        >
          🖨️ Print
        </button>

        <button
          onClick={() => navigate(-1)}
          style={{ ...buttonStyle, background: "#6c757d", color: "#fff" }}
        >
          ← Back to Summary
        </button>
      </div>

      {/* Invoice Content */}
      <div
        id="invoice-content"
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: "28px 28px 20px",
          background: "#ffffff",
          border: "1px solid #cce0ff",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <img
            src="/mga-logo.png"
            alt="MGA Services Logo"
            style={{ width: "120px", height: "auto" }}
          />
          <div style={{ textAlign: "right" }}>
            <h2 style={{ margin: 0, color: "#0077cc", fontSize: "22px" }}>
              {clientName}
            </h2>
            <p style={{ margin: 0, color: "#666" }}>
              Bill for the Month of {monthYearLabel()}
            </p>
          </div>
        </div>

        {/* Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
            marginBottom: "20px",
            tableLayout: "fixed",
            background: "#fff",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f0f6ff" }}>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Date</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Arr/Dep</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Flight No</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Pax Name</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Pax No</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Service Charge</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Card No</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((b, i) => (
              <tr key={i}>
                <td style={{ border: "1px solid #eee", padding: "8px" }}>{b.flightDate}</td>
                <td style={{ border: "1px solid #eee", padding: "8px", textAlign: "center" }}>
                  {b.arrivalDeparture?.toLowerCase().startsWith("arr") ? "Arr" : "Dep"}
                </td>
                <td style={{ border: "1px solid #eee", padding: "8px" }}>{b.flightNumber}</td>
                <td style={{ border: "1px solid #eee", padding: "8px" }}>{b.name}</td>
                <td style={{ border: "1px solid #eee", padding: "8px", textAlign: "center" }}>
                  {b.numberOfPassenger}
                </td>
                <td style={{ border: "1px solid #eee", padding: "8px", textAlign: "right" }}>
                  {b.billAmount}
                </td>
                <td style={{ border: "1px solid #eee", padding: "8px" }}>{b.cardNumber}</td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 12 }}>
                  No details
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ textAlign: "right", marginTop: 10, lineHeight: 1.3, fontSize: "14px" }}>
          <p style={{ margin: "3px 0" }}><strong>Total PAX:</strong> {totalPax}</p>
          <p style={{ margin: "3px 0" }}><strong>Total Bill:</strong> {totalBill.toFixed(2)} BDT</p>
          <p style={{ margin: "3px 0" }}><strong>VAT (15%):</strong> {vat.toFixed(2)} BDT</p>
          <p style={{ margin: "4px 0", fontWeight: "600" }}>
            <strong>Grand Total:</strong> {grandTotal.toFixed(2)} BDT
          </p>
        </div>

        {/* Signature Section */}
        <div style={{ marginTop: "40px", textAlign: "right" }}>
          <div style={{ width: "260px", height: "80px", borderBottom: "1px solid #333", marginLeft: "auto", marginBottom: "6px" }}></div>
          <p style={{ margin: 0, fontSize: "15px" }}>Authorized Signature</p>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "50px", paddingTop: "15px", borderTop: "1px solid #ddd", textAlign: "center", fontSize: "12px", color: "#555", lineHeight: "1.2" }}>
          <p style={{ margin: "4px 0" }}>House No. 2, Road 9/C, Nikunja-1, Dhaka-1229, Bangladesh</p>
          <p style={{ margin: "4px 0" }}>Email: mgaheadoffice.dhaka@gmail.com | travels.mga@gmail.com</p>
          <p style={{ margin: "8px 0", fontStyle: "italic" }}>Thank you for choosing MGA Services.</p>
        </div>
      </div>
    </div>
  );
}
