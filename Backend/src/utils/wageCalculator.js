/**
 * Calculate wage based on attendance and rate
 *
 * @param {Object} params
 * @param {Number} params.hoursWorked
 * @param {Number} params.overtimeHours
 * @param {Number} params.dailyRate
 * @param {Number} params.overtimeRatePerHour
 *
 * @returns {Object} wage breakdown
 */

export const calculateWage = ({
  hoursWorked,
  overtimeHours = 0,
  dailyRate,
  overtimeRatePerHour,
}) => {
  if (
    hoursWorked === undefined ||
    dailyRate === undefined ||
    overtimeRatePerHour === undefined
  ) {
    throw new Error("Missing required wage calculation fields");
  }

  if (hoursWorked < 0 || overtimeHours < 0) {
    throw new Error("Hours cannot be negative");
  }

  // Standard assumption: 8-hour workday
  const STANDARD_HOURS = 8;

  // Base wage logic
  let baseWage = 0;

  if (hoursWorked >= STANDARD_HOURS) {
    baseWage = dailyRate;
  } else {
    // Proportional wage for half-day or partial work
    baseWage = (dailyRate / STANDARD_HOURS) * hoursWorked;
  }

  // Overtime wage
  const overtimeWage = overtimeHours * overtimeRatePerHour;

  // Final total
  const totalWage = baseWage + overtimeWage;

  return {
    baseWage: Number(baseWage.toFixed(2)),
    overtimeWage: Number(overtimeWage.toFixed(2)),
    totalWage: Number(totalWage.toFixed(2)),
  };
};
