use("mga_connect");

db.bookings.aggregate([
  {
    $project: {
      name: 1,
      corporateBankName: 1,
      passengerCategory: 1,
      status: 1,
      normalizedStatus: { $trim: { input: { $toLower: "$status" } } }
    }
  }
]);









