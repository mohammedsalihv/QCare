const mongoose = require("mongoose");

const locationSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a location name"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Please add a location code"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    building: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    floor: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    department: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    hodName: {
      type: String,
      trim: true,
      default: "",
    },
    inchargeName: {
      type: String,
      trim: true,
      default: "",
    },
    locationType: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      default: 'system',
    },
    updatedBy: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Location", locationSchema);
