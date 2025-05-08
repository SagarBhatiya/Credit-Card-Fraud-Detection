
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mongoose = require('mongoose');

const dotenv = require('dotenv');
dotenv.config();
// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); 

// Connect to MongoDB 
const MONGO_URL = "mongodb://localhost:27017/fraud_guard";
mongoose.connect("MONGO_URL")
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

//  schemas and models
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const cardSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    number: { type: String, required: true },
    expiryDate: { type: String, required: true },
    cardholderName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['safe', 'flagged', 'fraud'], default: 'safe' },
    category: { type: String }
});

// Create models
const User = mongoose.model('User', userSchema);
const Card = mongoose.model('Card', cardSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Access denied' });
    
    jwt.verify(token, 'your_jwt_secret_key', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// ========== AUTH ROUTES ==========

// Register a new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }
        
       
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
     
        const user = new User({
            name,
            email,
            password: hashedPassword
        });
        
        const savedUser = await user.save();
        
        // Create and send JWT token
        const token = jwt.sign(
            { id: savedUser._id, email: savedUser.email },
            'your_jwt_secret_key',
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            token,
            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        
       
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        
        // Create and send JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            'your_jwt_secret_key',
            { expiresIn: '24h' }
        );
        
        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// ========== CARD ROUTES ==========

// Get all cards for a user
app.get('/api/cards', authenticateToken, async (req, res) => {
    try {
        const cards = await Card.find({ userId: req.user.id });
        res.status(200).json(cards);
    } catch (error) {
        console.error('Get cards error:', error);
        res.status(500).json({ message: 'Server error while fetching cards' });
    }
});

// Add a new card
app.post('/api/cards', authenticateToken, async (req, res) => {
    try {
        const { name, number, expiryDate, cvv, cardholderName } = req.body;
        
        const maskedNumber = '*'.repeat(number.length - 4) + number.slice(-4);
        
        const card = new Card({
            userId: req.user.id,
            name,
            number: maskedNumber,
            expiryDate,
            cardholderName
        });
        
        const savedCard = await card.save();
        res.status(201).json(savedCard);
    } catch (error) {
        console.error('Add card error:', error);
        res.status(500).json({ message: 'Server error while adding card' });
    }
});

// ========== TRANSACTION ROUTES ==========


app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.id })
            .sort({ date: -1 })
            .limit(10);
        res.status(200).json(transactions);
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ message: 'Server error while fetching transactions' });
    }
});





app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});