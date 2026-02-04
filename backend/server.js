
const express = require("express");
 const bcrypt = require("bcryptjs");
 const nodemailer = require("nodemailer");
const cors = require("cors");
 const mongoose = require("mongoose");
const User = require("./models/User");
const dontenv = require("dotenv");
dontenv.config();

const app = express();
app.use(cors({
  origin: "https://jobforher.in"
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------
//Mongodb Connection
// --------------------
const  connectToDatabase = async()=>{
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🚀 Connected to MongoDB");
    
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }

}

connectToDatabase();

// --------------------



// --------------------
// REGISTER
// --------------------
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields required" });

  try {
    const hash = await bcrypt.hash(password, 10);
    const existingUser = await User.findOne({ email });

    if (existingUser)
      return res.status(400).json({ message: "User already exists" });
    const newUser = new User({
      name,
      email,
      password: hash,
    });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully",signup:true });

  } catch (error) {
    res.status(500).json({ message: "error while creating  new user" });
  }
});

// --------------------
// LOGIN
// --------------------
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "All fields required" });

  User.findOne({ email }).then((user) => {
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });
    bcrypt.compare(password, user.password).then((isMatch) => {
      if (!isMatch)
        return res.status(400).json({ message: "Invalid email or password" });
      res.status(200).json({ message: "Login successful", token:'jobforher@login',name:user.name});
    });
  }).catch((err) => {
    res.status(500).json({ message: "Error during login" });
  });
});


// Email Transporter
// --------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});
// --------------------
// SEND RESET LINK
// --------------------
app.post("/send-reset-link", async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ message: "Email is required" });

  try {
    const user = await User.findOne({ email });
    
    if (!user)
      return res.status(400).json({ message: "User not found" });

  

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your Password Reset Link",
      html: `<h2>Link Click here</h2>
      <a href="https://jobforher.netlify.app/reset.html">Reset Password</a>
             <p>If you didn't request this, please ignore this email.</p>`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Reset link sent to your email" });
  } catch (error) {
    console.error("Error sending reset link:", error);
    res.status(500).json({ message: "Error sending reset link" });
  }
});

 // --------------------
 

// --------------------
// RESET PASSWORD
// --------------------
app.post("/reset-password", async (req, res) => {
  const { email,  newPassword } = req.body;

  if (!email || !newPassword)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ message: "User not found" });


    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successfully", success: true });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
});

// --------------------
app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});
