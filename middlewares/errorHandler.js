const AppError = require("../utils/appError");

const handleValidationError = (err) => {
  const errors = {};

  Object.values(err.errors).forEach((error) => {
    errors[error.path] = error.message;
  });

  return new AppError("Validation failed", 422, errors);
};

const handleDuplicateFieldsError = (err) => {
  const field =
    Object.keys(err.keyValue)[0].charAt(0).toUpperCase() +
    Object.keys(err.keyValue)[0].slice(1);
  const errors = {};
  errors[field.toLowerCase()] = `${field} already exists`;

  return new AppError("Validation failed", 422, errors);
};

const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleMulterError = (err) => {
  let message = "";
  let statusCode = 422;
  const errors = {};

  switch (err.code) {
    case "LIMIT_FILE_SIZE":
      message = "File too large";
      errors.file = `Maximum file size is 1MB`;
      break;

    case "LIMIT_FILE_COUNT":
      message = "Too many files";
      errors.files = `Maximum 3 files allowed`;
      break;

    case "LIMIT_UNEXPECTED_FILE":
      message = "Unexpected field";
      errors.upload = "Please check your file upload fields";
      break;

    case "LIMIT_PART_COUNT":
      message = "Too many form parts";
      break;

    case "LIMIT_FIELD_KEY":
      message = "Field name too long";
      break;

    case "LIMIT_FIELD_VALUE":
      message = "Field value too long";
      break;

    case "LIMIT_FIELD_COUNT":
      message = "Too many fields";
      break;

    default:
      // For custom file filter errors
      if (err.message === "Only image files are allowed!") {
        message = "Invalid file type";
        errors.file = "Only image files (JPG, PNG, GIF, WEBP) are allowed";
      } else {
        message = `Upload error: ${err.message}`;
      }
  }

  return new AppError(message, statusCode, errors);
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  let error = { ...err };
  console.log(error);

  error.message = err.message;

  // Log error for debugging
  if (process.env.NODE_ENV === "development") {
    console.log("Error:", err);
  }

  if (err.name === "ValidationError") error = handleValidationError(error);
  if (err.code === 11000) error = handleDuplicateFieldsError(error);
  if (err.name === "CastError") error = handleCastError(error);
  if (err.code && err.code.startsWith("LIMIT_"))
    error = handleMulterError(error);

  // Laravel-style error response
  if (error.isOperational) {
    const response = {
      status: error.status,
      message: error.message,
    };

    // Only include errors object if it exists and has properties
    if (error.errors && Object.keys(error.errors).length > 0) {
      response.errors = error.errors;
    }

    res.status(error.statusCode).json(response);
  } else {
    // Programming or unknown errors
    console.error("ERROR 💥", err);

    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

module.exports = globalErrorHandler;
