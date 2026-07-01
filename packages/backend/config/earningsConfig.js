// Configurable earnings rules — Blinkit/Zepto-style payout structure
module.exports = {
  // Base payout per delivery (Rs.)
  BASE_PAYOUT: 25,

  // Distance-based bonus
  DISTANCE_RATE_PER_KM: 8,   // Rs. per km
  MIN_DISTANCE_KM: 1,         // no distance bonus below this
  MAX_DISTANCE_BONUS: 100,    // cap distance bonus

  // Peak hour windows [startHour, endHour) — 24h format
  PEAK_HOURS: [
    [11, 14], // lunch rush
    [19, 22], // dinner rush
  ],
  PEAK_HOUR_BONUS: 15,        // Rs. extra during peak

  // High-value order bonus
  ORDER_VALUE_THRESHOLD: 500,  // order total >= this triggers bonus
  ORDER_VALUE_BONUS: 10,       // Rs. extra

  // Minimum guarantee per delivery
  MINIMUM_GUARANTEE: 30,

  // Default estimated distance when coordinates unavailable (km)
  DEFAULT_DISTANCE_KM: 3,
};
