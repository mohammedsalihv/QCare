const mongoose = require("mongoose");

const departmentSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a department name"],
      unique: true,
      trim: true,
    },
    head: {
      type: String, // Can be a string name or a reference to User model
      default: "Not Assigned",
    },
    location: {
      type: String,
      default: "Main Campus",
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
