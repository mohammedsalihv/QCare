const mongoose = require("mongoose");

const ldapSyncLogSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["success", "partial", "failed"],
      required: true,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    totalFetched: {
      type: Number,
      default: 0,
    },
    syncedConfigs: [{
      type: String
    }],
    importedUsers: [
      {
        employeeId: String,
        employeeName: String,
        email: String,
        status: String,
        source: String,
      }
    ],
    failedUsers: [
      {
        employeeId: String,
        reason: String,
        source: String,
      }
    ],
    errorMessage: {
      type: String,
      default: null,
    }
  },
  {
    timestamps: true, // Automatically manages createdAt (fetched timestamp) and updatedAt
  }
);

module.exports = mongoose.model("LdapSyncLog", ldapSyncLogSchema);
