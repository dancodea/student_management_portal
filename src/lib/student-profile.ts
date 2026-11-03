export const requiredStudentProfileFields = [
  ['phone', 'Phone Number'],
  ['address', 'Residential Address'],
  ['state', 'State of Origin'],
  ['lga', 'Local Government Area (LGA)'],
  ['placeOfBirth', 'Place of Birth'],
  ['maritalStatus', 'Marital Status'],
  ['tribe', 'Tribe / Ethnicity'],
  ['religion', 'Religion'],
] as const;

export type RequiredStudentProfileField = (typeof requiredStudentProfileFields)[number][0];

export function getMissingStudentProfileFields(
  student: Partial<Record<RequiredStudentProfileField, string | null | undefined>>,
) {
  return requiredStudentProfileFields
    .filter(([field]) => typeof student[field] !== 'string' || !student[field]?.trim())
    .map(([, label]) => label);
}

