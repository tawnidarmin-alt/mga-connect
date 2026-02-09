use("mgaconnect");

// 1️⃣ Normalize all Cancelled → correct format
db.bookings.updateMany(
  { status: { $regex: /^cancelled$/i } },
  { $set: { status: "Cancelled" } }
);

// 2️⃣ Fix common wrong spellings & extra spaces
db.bookings.updateMany(
  { status: { $in: [" canceled", "Cancelled ", "cancel", "Cancel", "CANCEL ", "CANCELED", "Canceled"] } },
  { $set: { status: "Cancelled" } }
);

// 3️⃣ Convert empty or missing status → Pending
db.bookings.updateMany(
  { $or: [ { status: "" }, { status: null }, { status: { $exists: false } } ] },
  { $set: { status: "Pending" } }
);

// 4️⃣ Show first 50 results so we can confirm
db.bookings.find(
  {},
  { bookingCode: 1, status: 1 }
).limit(50);
