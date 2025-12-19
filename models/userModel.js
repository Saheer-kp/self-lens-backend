const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true, // Remove extra spaces
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // Ensure email is unique
      lowercase: true, // Convert email to lowercase
      trim: true, // Remove extra spaces
      validate: [validator.isEmail, "Email must be a valid email address"],
    },
    photo: {
      type: String,
      default: "default.jpg", // Default profile photo
    },
    password: {
      type: String,
      required: function () {
        // Only require password for non-social logins
        return !this.is_social_login;
      },
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: function () {
        // Only require passwordConfirm for non-social logins
        return !this.is_social_login;
      },
      validate: {
        validator: function (value) {
          // Only validate if this is not a social login AND password is being set
          if (this.is_social_login) return true;
          return value === this.password;
        },
        message: "Passwords do not match",
      },
    },
    passwordChangedAt: Date,
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    is_social_login: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      select: false,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  // delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

//for password reset
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; //-1000 is used to avoid token is issue after the password chnaged at;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } }); // this prevents documents getting empty which are not having the active field
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword = null
) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return changedTimestamp > JWTTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
