use("mga_connect"); // or mgaconnect — whichever one has your bookings

db.getCollection("bookings").find(
  {},
  {
    passengerCategory: 1,
    flightDate: 1,
    status: 1,
    corporateBankName: 1,
    serviceType: 1,
    _id: 0
  }
).limit(100);
