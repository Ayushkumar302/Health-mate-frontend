// change the product name in one place
export const BRAND = {
  name: "Medora",
  tagline: "Healthcare, beautifully simple",
  email: "hello@medora.health",
  phone: "+91 98765 43210",
  address: "Bengaluru, India",
};

// Demo mode: sign-ups are closed and visitors use these shared accounts.
// Set VITE_ALLOW_SIGNUPS=true (and ALLOW_SIGNUPS=true on the backend) to open sign-ups again.
export const DEMO_MODE = import.meta.env.VITE_ALLOW_SIGNUPS !== "true";

// shared by every demo account; unique to this project so browsers don't warn that it was in a data breach
export const DEMO_PASSWORD = "Medora#Demo26";

export const DEMO_ACCOUNTS = [
  {
    role: "patient",
    label: "Demo patient",
    description: "Book doctors, join video calls, see payments",
    email: "patient@healthmate.test",
    password: DEMO_PASSWORD,
  },
  {
    role: "doctor",
    label: "Demo doctor",
    description: "Manage schedule, consult patients, extend calls",
    email: "doctor@healthmate.test",
    password: DEMO_PASSWORD,
  },
  {
    role: "admin",
    label: "Demo admin",
    description: "Verify doctor applications, see revenue and bookings",
    email: "admin@healthmate.test",
    password: DEMO_PASSWORD,
  },
];

// doctors open around the clock in 15 minute slots, so the whole flow (book, accept, video call)
// can be tried right away; separate accounts let several visitors test at the same time
export const DEMO_TESTING_DOCTORS = [
  { name: "Dr. Riya Sen", specialty: "General physician", email: "riya.sen@healthmate.test" },
  { name: "Dr. Kabir Anand", specialty: "Endocrinologist", email: "kabir.anand@healthmate.test" },
  { name: "Dr. Zoya Khan", specialty: "Gynecologist", email: "zoya.khan@healthmate.test" },
];

// where each role lands after logging in
export const dashboardPathFor = role =>
  role === "doctor" ? "/doctors/profile/me" : role === "admin" ? "/admin" : "/users/profile/me";
