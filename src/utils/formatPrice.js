// all prices are in Indian rupees, e.g. 1500 -> "₹1,500"
export const formatPrice = amount => `₹${Number(amount || 0).toLocaleString("en-IN")}`;
