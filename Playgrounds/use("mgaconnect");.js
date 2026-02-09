use("mgaconnect");

// 1️⃣ Normalize all Cancelled → correct format
db.bookings.updateMany(
  { status: { $regex: /^cancelled$/i } },
  { $set: { status: "Cancelled" } }
);

// 2️⃣ Fix common wrong spellings
db.bookings.updateMany(
  { status: { $in: [" canceled", "Cancelled ", "cancel", "Cancel", "CANCEL "] } },
  { $set: { status: "Cancelled" } }
);

// 3️⃣ Convert empty status → Pending
db.bookings.updateMany(
  { status: { $in: ["", null] } },
  { $set: { status: "Pending" } }
);

// 4️⃣ SHOW first 50 results so we can confirm
db.bookings.find(
  {},
  { bookingCode: 1, status: 1 }
).limit(50);
