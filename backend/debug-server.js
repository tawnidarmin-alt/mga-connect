console.log(">>> INITIALIZING DEBUG SERVER <<<");

const express = require("express");
const app = express();

console.log(">>> EXPRESS LOADED SUCCESSFULLY <<<");

app.get("/", (req, res) => res.send("Server is alive!"));

app.listen(5002, () => {
    console.log("🚀 Debug Server running on http://localhost:5002");
});