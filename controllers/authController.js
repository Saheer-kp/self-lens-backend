const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const { errorResponse } = require("../utils/response");
const { gOAuth2Client, google } = require("../config/gAuth");

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = async (req, res) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  //checking input data
  if (!email || !password)
    return next(new AppError("Please provide email and password", 400));

  //checking user existing in db
  const user = await User.findOne({ email }).select("+password"); // selecting password as explicitly as it is hidden by default in model.

  const isPasswordCorrect = user ? await user.correctPassword(password) : false;
  if (!user || !isPasswordCorrect)
    return next(new AppError("Incorrect email or password", 422));

  sendToken(user, 200, res);
};

// Backend route for Google OAuth
exports.gLogin = async (req, res) => {
  try {
    const { code } = req.body;

    // Exchange code for tokens
    const { tokens } = await gOAuth2Client.getToken(code);
    gOAuth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: "v2", auth: gOAuth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Find or create user
    let user = await User.findOne({ email: userInfo.data.email });
    if (!user) {
      user = await User.create({
        name: userInfo.data.name,
        email: userInfo.data.email,
        photo: userInfo.data.picture,
        is_social_login: true,
      });
    }

    sendToken(user, 200, res);
  } catch (error) {
    console.error("Google OAuth error:", error);
    errorResponse(res, "Google authentication failed");
  }
};
