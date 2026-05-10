const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const kpiRoutes = require("./routes/kpiRoutes");
const documentRoutes = require("./routes/documentRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const riskRoutes = require("./routes/riskRoutes");
const auditRoutes = require("./routes/auditRoutes");
const complianceRoutes = require("./routes/complianceRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const path = require("path");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this in production
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
});

// Middleware to attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect Database
connectDB();

// Initialize Cron Jobs
const cron = require("node-cron");
const { syncLDAPUsers } = require("./utils/ldapSync");

// Run LDAP Sync daily at midnight
cron.schedule("0 0 * * *", () => {
  console.log("Running scheduled LDAP Sync...");
  syncLDAPUsers();
});

// Initialize License Reminders
require("./scheduledJobs/licenseReminder");

// Socket.io connection logic
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their personal room`);
  });

  socket.on("join-admins", () => {
    socket.join("admins");
    console.log("A user joined the admins room");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/kpi", kpiRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/incidents", incidentRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/jawda', require('./routes/jawdaRoutes'));
app.use("/api/risks", riskRoutes);
app.use("/api/audits", auditRoutes);
app.use("/api/compliance", complianceRoutes);
app.use("/api/audit", require("./routes/clinicalAuditRoutes"));
app.use("/api/training", require("./routes/trainingRoutes"));
app.use("/api/patient-experience", require("./routes/patientExperienceRoutes"));
app.use("/api/ipc", require("./routes/ipcRoutes"));
app.use("/api/medication", require("./routes/medicationRoutes"));
app.use("/api/fms", require("./routes/fmsRoutes"));
app.use("/api/cp", require("./routes/cpRoutes"));
app.use("/api/feedback", feedbackRoutes);
app.use("/api/settings", require("./routes/settingsRoutes"));

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("API with Socket.io running");
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
