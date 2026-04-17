import Decimal from 'decimal.js';

// Shared input validation utilities for CPQ services.
// Every Decimal.js constructor call and Date parse should go through these.

// Validate a string can be safely converted to a Decimal.
// Returns the Decimal or throws a descriptive error.
export const safeDecimal = (value: unknown, fieldName: string): Decimal => {
  if (value === null || value === undefined || value === '') {
    throw new CpqValidationError(`${fieldName} is required`);
  }

  const stringValue = String(value);

  if (stringValue === 'NaN' || stringValue === 'Infinity' || stringValue === '-Infinity' || stringValue === 'null' || stringValue === 'undefined') {
    throw new CpqValidationError(`${fieldName} must be a valid number, got "${stringValue}"`);
  }

  try {
    const decimal = new Decimal(stringValue);

    if (!decimal.isFinite()) {
      throw new CpqValidationError(`${fieldName} must be a finite number`);
    }

    return decimal;
  } catch (error) {
    if (error instanceof CpqValidationError) throw error;
    throw new CpqValidationError(`${fieldName} is not a valid number: "${stringValue}"`);
  }
};

// Validate a number is positive and finite.
export const safePositiveNumber = (value: unknown, fieldName: string): number => {
  const num = Number(value);

  if (!Number.isFinite(num)) {
    throw new CpqValidationError(`${fieldName} must be a finite number, got "${value}"`);
  }

  if (num < 0) {
    throw new CpqValidationError(`${fieldName} must be non-negative, got ${num}`);
  }

  return num;
};

// Validate a number is a positive integer.
export const safePositiveInteger = (value: unknown, fieldName: string): number => {
  const num = safePositiveNumber(value, fieldName);

  if (!Number.isInteger(num)) {
    throw new CpqValidationError(`${fieldName} must be an integer, got ${num}`);
  }

  return num;
};

// Validate a string is a valid date and return a Date object.
export const safeDate = (value: unknown, fieldName: string): Date => {
  if (value === null || value === undefined || value === '') {
    throw new CpqValidationError(`${fieldName} is required`);
  }

  const dateValue = value instanceof Date ? value : new Date(String(value));

  if (isNaN(dateValue.getTime())) {
    throw new CpqValidationError(`${fieldName} is not a valid date: "${value}"`);
  }

  return dateValue;
};

// Clamp a number to a range.
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

// Validate that a discount percent is in [0, 100].
export const safeDiscountPercent = (value: unknown, fieldName: string): number => {
  const num = safePositiveNumber(value, fieldName);

  if (num > 100) {
    throw new CpqValidationError(`${fieldName} cannot exceed 100%, got ${num}%`);
  }

  return num;
};

// Custom error class for CPQ validation failures.
// In a NestJS context, the controller should catch these and return 400.
export class CpqValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CpqValidationError';
  }
}
