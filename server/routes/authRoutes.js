const express = require("express");
const { loginUser } = require("../controllers/userController");
const { sendForgotPasswordEmail } = require("../controllers/forgotPasswordController");
const router = express.Router();

router.post("/login", loginUser);
router.post("/forgot-password", sendForgotPasswordEmail);

module.exports = router;

