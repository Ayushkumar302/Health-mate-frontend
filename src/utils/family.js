// Plus Family: a booking can be for one of the account holder's family members

export const RELATIONS = [
  { value: "spouse", label: "Spouse" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "other", label: "Other" },
];

export const relationLabel = relation => RELATIONS.find(item => item.value === relation)?.label || "Family";

// who the visit is for, as the doctor sees them: the family member, or the account holder.
// _id is always the account holder (records, messages); memberId says which family member.
export const patientOf = booking => {
  if (!booking?.user) return null;
  if (booking.familyMember?._id) {
    return {
      _id: booking.user._id,
      memberId: booking.familyMember._id,
      name: booking.familyMember.name,
      relation: booking.familyMember.relation,
      bookedBy: booking.user.name,
    };
  }
  return booking.user;
};

// "Booked by Priya Sharma (child)" under a family member's name
export const bookedByNote = person => (person?.memberId ? `${relationLabel(person.relation)} of ${person.bookedBy || "the account holder"}` : null);
