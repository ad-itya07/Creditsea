export interface BREInput {
  dateOfBirth: Date;
  monthlySalary: number;
  pan: string;
  employmentMode: string;
}

export interface BREResult {
  passed: boolean;
  rejectionReasons: string[];
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const calculateAge = (dob: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

export const runBRE = (input: BREInput): BREResult => {
  const reasons: string[] = [];

  // Rule 1: Age between 23 and 50
  const age = calculateAge(input.dateOfBirth);
  if (age < 23 || age > 50) {
    reasons.push(`Age must be between 23 and 50 years. Your age: ${age}`);
  }

  // Rule 2: Monthly salary >= 25,000
  if (input.monthlySalary < 25000) {
    reasons.push(`Monthly salary must be at least ₹25,000. Provided: ₹${input.monthlySalary.toLocaleString('en-IN')}`);
  }

  // Rule 3: Valid Indian PAN format
  if (!PAN_REGEX.test(input.pan.toUpperCase())) {
    reasons.push('PAN must be a valid Indian PAN (e.g. ABCDE1234F)');
  }

  // Rule 4: Not unemployed
  if (input.employmentMode === 'Unemployed') {
    reasons.push('Unemployed applicants are not eligible for a loan');
  }

  return {
    passed: reasons.length === 0,
    rejectionReasons: reasons,
  };
};
