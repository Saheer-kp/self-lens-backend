function successResponse(res, message = "Success", data = {}) {
  res.status(200).json({
    success: true,
    message,
    ...(data && { data }),
  });
}

function errorResponse(
  res,
  message = "Error",
  statusCode = 500,
  errors = null
) {
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
}

module.exports = { successResponse, errorResponse };
