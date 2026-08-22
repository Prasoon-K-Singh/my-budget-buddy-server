function apiResponse(res, code, message, result, success) {
  result;
  return res.status(code).json({
    message,
    result,
    success,
  });
}
