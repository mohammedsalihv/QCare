const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    employeeName: {
      type: String,
      required: true,
      trim: true,
    },

    photo: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    confirmPassword: {
      type: String,
      required: false,
    },

    role: {
      type: String,
      enum: ["superadmin", "admin", "MRD", "Quality", "user", "Director"],
      default: "user",
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    designation: {
      type: String,
      required: true,
      trim: true,
    },
    
    lastLogin: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ['active', 'blocked', 'inactive'],
      default: 'active',
    },

    authSource: {
      type: String,
      default: 'local',
    },
  },
  {
    timestamps: true, 
  }
);


userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return; // Exit early, don't rehash
  }

  const bcrypt = require("bcryptjs");
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  // If the stored password is not hashed (for legacy/test users like the one just added)
  if (!this.password.startsWith('$2')) {
    return enteredPassword === this.password;
  }
  const bcrypt = require("bcryptjs");
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);