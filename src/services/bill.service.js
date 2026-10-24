const frequencyValues = ["monthly", "half-yearly", "quarterly", "yearly"];

function addMonthsSafely(date, months) {
  const result = new Date(date);
  const originalDay = result.getDate();

  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();

  result.setDate(Math.min(originalDay, lastDay));

  return result;
}

export function getNextDueDate(timestamp, frequency) {
  if (!timestamp || !frequencyValues.includes(frequency)) {
    throw new Error("Invalid date or frequency");
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date or frequency");
  }

  switch (frequency) {
    case "monthly":
      return addMonthsSafely(date, 1).getTime();

    case "quarterly":
      return addMonthsSafely(date, 3).getTime();

    case "half-yearly":
      return addMonthsSafely(date, 6).getTime();

    case "yearly":
      return addMonthsSafely(date, 12).getTime();

    default:
      throw new Error("Unsupported frequency");
  }
}
