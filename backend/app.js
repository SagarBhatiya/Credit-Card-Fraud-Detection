// const express = require("express");
// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const cors = require("cors");
// const path = require('path'); 
// const bodyParser = require('body-parser');
// const axios = require("axios");
// require("dotenv").config();

// const app = express();
// app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, "frontend")));

// // Middleware
// app.use(express.json());
// app.use(cors({
//   origin: "http://127.0.0.1:5501",
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
// }));

// // MongoDB Connection 
// mongoose
//   .connect(process.env.MONGO_URI || "mongodb://localhost:27017/auth-app")
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => {
//     console.error("MongoDB Connection Error:", err);
//     process.exit(1);
//   });

// // User Model
// const UserSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true, trim: true },
//   email: { type: String, required: true, unique: true, trim: true, lowercase: true },
//   password: { type: String, required: true, minlength: 6 },
//   createdAt: { type: Date, default: Date.now },
// });

// UserSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// const User = mongoose.model("User", UserSchema);

// // Auth Middleware
// const auth = async (req, res, next) => {
//   try {
//     const token = req.header("Authorization")?.replace("Bearer ", "");
//     if (!token) return res.status(401).json({ message: "No authentication token, access denied" });
    
//     const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key");
//     const user = await User.findById(decoded.id).select("-password");
//     if (!user) return res.status(401).json({ message: "Token is valid, but user not found" });
    
//     req.user = user;
//     next();
//   } catch (error) {
//     console.error("Auth middleware error:", error);
//     res.status(401).json({ message: "Token is not valid" });
//   }
// };

// // Proxy endpoint to Flask fraud detection
// app.post('/predict', auth, async (req, res) => {
//   try {
//     // Input validation
//     if (!req.is('application/json')) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid content type. Expected application/json'
//       });
//     }

//     const requiredFields = {
//       'card_number': 'string',
//       'transaction_date': 'string',
//       'latitude': 'number',
//       'longitude': 'number',
//       'amount': 'number',
//       'merchant': 'string',
//       'category': 'string'
//     };

//     // Validate required fields
//     const missingFields = [];
//     const typeErrors = [];
    
//     for (const [field, type] of Object.entries(requiredFields)) {
//       if (!(field in req.body)) {
//         missingFields.push(field);
//       } else if (typeof req.body[field] !== type) {
//         typeErrors.push(`${field} should be ${type}`);
//       }
//     }

//     if (missingFields.length > 0) {
//       return res.status(400).json({
//         success: false,
//         error: `Missing required fields: ${missingFields.join(', ')}`
//       });
//     }

//     if (typeErrors.length > 0) {
//       return res.status(400).json({
//         success: false,
//         error: `Type errors: ${typeErrors.join('; ')}`
//       });
//     }

//     // Generate transaction ID if not provided
//     if (!req.body.transaction_id) {
//       req.body.transaction_id = `TX${Date.now()}`;
//     }

//     // Add user information to the transaction data
//     req.body.user_id = req.user._id;
//     req.body.username = req.user.username;

//     // Call Flask fraud detection API
//     const flaskResponse = await axios.post('http://localhost:5000/predict', req.body);
    
//     // Forward the response
//     res.json(flaskResponse.data);

//   } catch (error) {
//     console.error("Error in /predict:", error);
//     res.status(500).json({
//       success: false,
//       error: 'Internal server error',
//       details: error.message
//     });
//   }
// });

// // Auth Routes
// app.post("/api/auth/signup", async (req, res) => {
//   try {
//     const { username, email, password } = req.body;

//     // Check if user already exists
//     let user = await User.findOne({ email });
//     if (user) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     // Create new user
//     user = new User({ username, email, password });
//     await user.save();

//     // Create token
//     const token = jwt.sign(
//       { id: user._id },
//       process.env.JWT_SECRET || "your_jwt_secret_key",
//       { expiresIn: "1h" }
//     );

//     res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email } });
//   } catch (error) {
//     console.error("Signup error:", error);
//     res.status(500).json({ message: "Error creating user" });
//   }
// });

// app.post("/api/auth/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Check if user exists
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     // Validate password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     // Create token
//     const token = jwt.sign(
//       { id: user._id },
//       process.env.JWT_SECRET || "your_jwt_secret_key",
//       { expiresIn: "1h" }
//     );

//     res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ message: "Error logging in" });
//   }
// });

// app.get("/api/auth/user", auth, async (req, res) => {
//   res.json(req.user);
// });

// app.get("/api/health", (req, res) => {
//   res.json({ status: "OK", timestamp: new Date().toISOString() });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));