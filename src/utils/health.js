// age in whole years from "YYYY-MM-DD"
export const ageFrom = dateOfBirth => {
  if (!dateOfBirth) return null;
  const birth = new Date(`${dateOfBirth}T00:00:00`);
  if (isNaN(birth)) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
};

// body mass index with the usual WHO category
export const bmiOf = (heightCm, weightKg) => {
  if (!heightCm || !weightKg) return null;
  const value = weightKg / (heightCm / 100) ** 2;
  const category = value < 18.5 ? "Underweight" : value < 25 ? "Healthy" : value < 30 ? "Overweight" : "Obese";
  return { value: value.toFixed(1), category };
};

// "28 y · Male · B+"
export const patientSummary = patient =>
  [
    ageFrom(patient?.dateOfBirth) !== null && `${ageFrom(patient.dateOfBirth)} y`,
    patient?.gender && patient.gender[0].toUpperCase() + patient.gender.slice(1),
    patient?.bloodType,
  ]
    .filter(Boolean)
    .join(" · ");

// "Wed, 28 Oct 2026" from "YYYY-MM-DD"
export const formatDay = date =>
  date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    : "";
