export const ROLES = {
  DOCTOR: 'doctor',
  PATIENT: 'patient',
};

export const APPOINTMENT_TYPES = {
  CLINIC: 'clinic_visit',
  HOME: 'home_visit',
};

export const APPOINTMENT_STATUS = {
  BOOKED: 'booked',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID_CASH: 'paid_cash',
  PAID_JUICE: 'paid_juice',
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  JUICE: 'mcb_juice',
};

export const MED_FREQUENCY = {
  ONCE_DAILY: 'once_daily',
  TWICE_DAILY: 'twice_daily',
  THREE_DAILY: 'three_daily',
  AS_NEEDED: 'as_needed',
};

export const MED_TIME_OF_DAY = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  NIGHT: 'night',
};

export const MED_LOG_STATUS = {
  TAKEN: 'taken',
  SKIPPED: 'skipped',
  MISSED: 'missed',
};

export const SYMPTOM_SEVERITY = [1, 2, 3, 4, 5];

export const SPECIALTIES = [
  'General Practitioner',
  'Cardiologist',
  'Endocrinologist',
  'Neurologist',
  'Pediatrician',
  'Dermatologist',
];

export const PRICING_TIERS = {
  FREE: { name: 'Free', price: 0, annual: 0 },
  STARTER: { name: 'Starter', price: 990, annual: 9900 },
  PRACTICE: { name: 'Practice', price: 1990, annual: 19900 },
  CLINIC: { name: 'Clinic', price: 4990, annual: 49900 },
};

export const CURRENCY = 'MUR';
