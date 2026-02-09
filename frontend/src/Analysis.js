import React, { useState } from "react";

const Analysis = () => {
  const [activeTab, setActiveTab] = useState("category");

  const renderContent = () => {
    switch (activeTab) {
      case "category":
        return <div>Category Analysis Charts/Stats go here</div>;
      case "staff":
        return <div>Staff Analysis Charts/Stats go here</div>;
      case "service":
        return <div>Service Type Analysis Charts/Stats go here</div>;
      default:
        return <div>Category Analysis Charts/Stats go here</div>;
    }
  };

  return (
    <div>
      <h3>Analysis Page</h3>
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setActiveTab("category")}>Category</button>
        <button onClick={() => setActiveTab("staff")}>Staff</button>
        <button onClick={() => setActiveTab("service")}>Service</button>
      </div>

      <div>{renderContent()}</div>
    </div>
  );
};

export default Analysis;
