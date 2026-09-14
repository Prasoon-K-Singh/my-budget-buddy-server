function apiResponse(res, code, message, result, success) {
  result;
  return res.status(code).json({
    message,
    result,
    success,
  });
}
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return Number((((current - previous) / previous) * 100).toFixed(2));
};
export const getPercentWithDirection = (percentage) => {
  return {
    direction: percentage >= 0 ? "increase" : "decrease",
    percentage: Math.abs(percentage),
  };
};
