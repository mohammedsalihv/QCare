const mongoose = require("mongoose");

const departmentSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a department name"],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Please add a department code"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    head: {
      type: String, // Can be a string name or a reference to User model
      default: "Not Assigned",
    },
    location: {
      type: String,
      default: "Main Campus",
    },
    employeesCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Department", departmentSchema);
