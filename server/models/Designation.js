const mongoose = require("mongoose");

const designationSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a designation title"],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Please add a designation code"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    grade: {
      type: String,
      required: [true, "Please add a grade level"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please add a job description"],
      trim: true,
    },
    status: {
      type: String,
      default: "Active",
      enum: ["Active", "Inactive"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Designation", designationSchema);
