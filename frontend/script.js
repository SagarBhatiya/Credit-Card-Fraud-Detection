const authModal = document.getElementById('authModal');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const headerLoginBtn = document.getElementById('headerLoginBtn');
const headerSignupBtn = document.getElementById('headerSignupBtn');
const closeAuthModal = document.getElementById('closeAuthModal');

const addCardModal = document.getElementById('addCardModal');
const addCardBtn = document.getElementById('addCardBtn');
const closeCardModal = document.getElementById('closeCardModal');
const addCardForm = document.getElementById('addCardForm');

const sidebarUsername = document.getElementById('sidebarUsername');
const sidebarUsernameInitials = document.getElementById('sidebarUsernameInitials');
const sidebarUserEmail = document.getElementById('sidebarUserEmail');
const cardsList = document.querySelector('.cards-list');
const historyList = document.querySelector('.history-list');

const API_URL = 'http://localhost:5000/api/auth';
const FRAUD_API_URL = 'http://localhost:5000/predict';

const INDIAN_NAMES = ['Aarav Sharma', 'Priya Patel', 'Rahul Singh', 'Ananya Gupta', 'Vikram Joshi'];
const INDIAN_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune'];
const INDIAN_BANKS = ['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB'];

let userCards = [];
let userTransactions = [];

// Auth Modal Functions
function showAuthModal() {
    authModal.classList.remove('hidden');
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
        element.classList.add('hidden');
    });
   
    if (loginForm) loginForm.reset();
    if (signupForm) signupForm.reset();
}

function hideAuthModal() {
    authModal.classList.add('hidden');
}

if (headerLoginBtn) {
    headerLoginBtn.addEventListener('click', () => {
        showLoginTab();
        showAuthModal();
    });
}

if (headerSignupBtn) {
    headerSignupBtn.addEventListener('click', () => {
        showSignupTab();
        showAuthModal();
    });
}

if (closeAuthModal) {
    closeAuthModal.addEventListener('click', hideAuthModal);
}

// Tab switching functions
function showLoginTab() {
    loginTab.classList.add('border-cyan', 'text-cyan');
    signupTab.classList.remove('border-cyan', 'text-cyan');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    
    document.getElementById('loginError')?.classList.add('hidden');
    document.getElementById('signupError')?.classList.add('hidden');
}

function showSignupTab() {
    signupTab.classList.add('border-cyan', 'text-cyan');
    loginTab.classList.remove('border-cyan', 'text-cyan');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    
    document.getElementById('loginError')?.classList.add('hidden');
    document.getElementById('signupError')?.classList.add('hidden');
}

if (loginTab) loginTab.addEventListener('click', showLoginTab);
if (signupTab) signupTab.addEventListener('click', showSignupTab);

// Card Modal Functions
function showCardModal() {
    if (addCardModal) addCardModal.classList.remove('hidden');
}

function hideCardModal() {
    if (addCardModal) addCardModal.classList.add('hidden');
}

if (addCardBtn) addCardBtn.addEventListener('click', showCardModal);
if (closeCardModal) closeCardModal.addEventListener('click', hideCardModal);

// Auth Functions
async function loginUser(email, password) {
    try {
        const user = {
            id: 'user123',
            username: INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)],
            email: email,
            token: 'demo-token-123'
        };
        
        localStorage.setItem('token', user.token);
        localStorage.setItem('user', JSON.stringify(user));
        
        window.dispatchEvent(new CustomEvent('user-authenticated'));
        
        return user;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function signupUser(username, email, password) {
    try {
        const user = {
            id: 'user' + Math.floor(Math.random() * 1000),
            username: username,
            email: email,
            token: 'demo-token-' + Math.floor(Math.random() * 1000)
        };
        
        localStorage.setItem('token', user.token);
        localStorage.setItem('user', JSON.stringify(user));
       
        window.dispatchEvent(new CustomEvent('user-authenticated'));
        
        return user;
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
}

async function getCurrentUser() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return null;
    }
    
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        return user;
    } catch (error) {
        console.error('Get user error:', error);
        logout();
        return null;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    userCards = [];
    userTransactions = [];
   
    window.dispatchEvent(new CustomEvent('user-logged-out'));
    updateAuthUI();
}

// Update UI based on authentication state
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const userInfo = document.getElementById('userInfo');
    const authButtons = document.getElementById('authButtons');
    const protectedContent = document.querySelectorAll('.protected-content');
    
    if (token) {
        if (userInfo && authButtons) {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                userInfo.classList.remove('hidden');
                authButtons.classList.add('hidden');
                
                const usernameDisplay = document.getElementById('usernameDisplay');
                if (usernameDisplay && user) {
                    usernameDisplay.textContent = user.username.split(' ')[0];
                }
                
                if (sidebarUsername && sidebarUserEmail && sidebarUsernameInitials) {
                    sidebarUsername.textContent = user.username;
                    sidebarUserEmail.textContent = user.email;
                    const names = user.username.split(' ');
                    const initials = names[0].charAt(0) + (names[1] ? names[1].charAt(0) : '');
                    sidebarUsernameInitials.textContent = initials;
                }
                
                protectedContent.forEach(element => {
                    element.classList.remove('hidden');
                });
                
                if (addCardBtn) {
                    addCardBtn.classList.remove('hidden');
                }
                
                loadUserData();
            } catch (error) {
                console.error('Error parsing user data', error);
                logout();
            }
        }
    } else {
        if (userInfo && authButtons) {
            userInfo.classList.add('hidden');
            authButtons.classList.remove('hidden');
            
            protectedContent.forEach(element => {
                element.classList.add('hidden');
            });
            
            if (addCardBtn) {
                addCardBtn.classList.add('hidden');
            }
        }
    }
}

// Load user cards and transactions
function loadUserData() {
    userCards = [];
    userTransactions = [];
    
    updateCardsList();
    updateTransactionsList();
}

function updateCardsList() {
    if (!cardsList) return;
    
    cardsList.innerHTML = '';
    
    if (userCards.length === 0) {
        cardsList.innerHTML = `
            <div class="text-center py-4 text-gray-400">
                No cards added yet. Click "+ Add Card" to add one.
            </div>
        `;
        return;
    }
    
    userCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = `card-item relative p-2 card-gradient rounded-md hover:bg-gray-800 transition cursor-pointer border-l-4 border-${card.color}-400 mb-2`;
        cardElement.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <p class="font-medium text-gray-200">${card.nickname}</p>
                    <p class="text-sm text-gray-400">**** **** **** ${card.last4}</p>
                </div>
                <button class="remove-card-btn text-red-400 hover:text-red-300 text-sm" data-index="${index}">
                    Remove
                </button>
            </div>
        `;
        cardsList.appendChild(cardElement);
    });

    document.querySelectorAll('.remove-card-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(button.dataset.index);
            removeCard(index);
        });
    });
}

function removeCard(index) {
    if (index >= 0 && index < userCards.length) {
        userCards.splice(index, 1);
        updateCardsList();
        showNotification('Card removed successfully', 'success');
    }
}

function updateTransactionsList() {
    if (!historyList) return;
    
    historyList.innerHTML = '';
    
    if (userTransactions.length === 0) {
        historyList.innerHTML = `
            <div class="text-center py-4 text-gray-400">
                No transactions yet. Submit a transaction to see history.
            </div>
        `;
        return;
    }
    
    userTransactions.forEach(trans => {
        const dateStr = trans.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = trans.date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        
        const transElement = document.createElement('div');
        transElement.className = 'history-item p-2 card-gradient rounded-md hover:bg-gray-800 transition cursor-pointer';
        transElement.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-medium text-gray-200">${trans.merchant}</p>
                    <p class="text-xs text-gray-400">${dateStr} • ${timeStr}</p>
                </div>
                <span class="text-sm font-medium text-gray-200">₹${trans.amount.toLocaleString('en-IN')}</span>
            </div>
            <div class="mt-1 flex items-center">
                <span class="inline-block w-2 h-2 rounded-full ${trans.isFlagged ? 'bg-yellow-400' : 'bg-green-400'} mr-1"></span>
                <span class="text-xs ${trans.isFlagged ? 'text-yellow-400' : 'text-green-400'}">${trans.isFlagged ? 'Flagged' : 'Safe'}</span>
            </div>
        `;
        historyList.appendChild(transElement);
    });
}

function addCard(cardData) {
    const newCard = {
        id: 'card' + (userCards.length + 1),
        nickname: cardData.nickname,
        last4: cardData.number.slice(-4),
        type: detectCardType(cardData.number),
        color: getRandomColor()
    };
    
    userCards.push(newCard);
    updateCardsList();
    showNotification('Card added successfully!', 'success');
}

function detectCardType(number) {
    if (/^4/.test(number)) return 'Visa';
    if (/^5[1-5]/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'Amex';
    return 'Card';
}

function getRandomColor() {
    const colors = ['cyan', 'green', 'blue', 'purple', 'pink'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Form Validations
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

function validatePassword(password) {
    return password.length >= 6;
}

// Form Submissions
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const errorMsg = document.getElementById('loginError');
        
        if (!email || !password) {
            if (errorMsg) {
                errorMsg.textContent = 'Please fill in all fields';
                errorMsg.classList.remove('hidden');
            }
            return;
        }
        
        if (!validateEmail(email)) {
            if (errorMsg) {
                errorMsg.textContent = 'Please enter a valid email address';
                errorMsg.classList.remove('hidden');
            }
            return;
        }
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        
        try {
            await loginUser(email, password);
            hideAuthModal();
            updateAuthUI();
            showNotification('Login successful!', 'success');
        } catch (error) {
            if (errorMsg) {
                errorMsg.textContent = error.message || 'Login failed. Please try again.';
                errorMsg.classList.remove('hidden');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('signupUsername').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorMsg = document.getElementById('signupError');
        
        if (!username || !email || !password || !confirmPassword) {
            if (errorMsg) {
                errorMsg.textContent = 'Please fill in all fields';
                errorMsg.classList.remove('hidden');
            }
            return;
        }
        
        if (!validateEmail(email)) {
            if (errorMsg) {
                errorMsg.textContent = 'Please enter a valid email address';
                errorMsg.classList.remove('hidden');
            }
            return;
        }
        
        if (!validatePassword(password)) {
            if (errorMsg) {
                errorMsg.textContent = 'Password must be at least 6 characters';
                errorMsg.classList.remove('hidden');
            }
            return;
        }
        
        if (password !== confirmPassword) {
            if (errorMsg) {
                errorMsg.textContent = 'Passwords do not match';
                errorMsg.classList.remove('hidden');
            }
            return;
        }
        
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
        
        try {
            await signupUser(username, email, password);
            hideAuthModal();
            updateAuthUI();
            showNotification('Account created successfully!', 'success');
        } catch (error) {
            if (errorMsg) {
                errorMsg.textContent = error.message || 'Signup failed. Please try again.';
                errorMsg.classList.remove('hidden');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
}

// Add Card Form Submission
if (addCardForm) {
    addCardForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const cardData = {
            nickname: document.getElementById('cardName').value.trim(),
            number: document.getElementById('cardNumber').value.replace(/\s/g, ''),
            expiry: document.getElementById('expiryDate').value.trim(),
            cvv: document.getElementById('cvv').value.trim(),
            name: document.getElementById('cardholderName').value.trim()
        };
        
        if (!cardData.nickname || !cardData.number || !cardData.expiry || !cardData.cvv || !cardData.name) {
            showNotification('Please fill in all card details', 'error');
            return;
        }
        
        if (cardData.number.length < 16) {
            showNotification('Please enter a valid card number', 'error');
            return;
        }
        
        addCard(cardData);
        hideCardModal();
        addCardForm.reset();
    });
}

// Add logout functionality
const logoutBtn = document.getElementById('logoutBtn');
const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
        showNotification('You have been logged out', 'info');
    });
}
if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
        showNotification('You have been logged out', 'info');
    });
}

/**
 * Client-side fraud detection system to catch suspicious transactions
 * This class maintains transaction history and detects common fraud patterns
 */
class FraudDetectionSystem {
    constructor() {
        // Store recent transactions for pattern detection
        this.recentTransactions = {};
        // Store all recent transactions for global pattern detection
        this.allRecentTransactions = [];
        // Time window in milliseconds for detecting simultaneous transactions (5 minutes)
        this.timeWindow = 5 * 60 * 1000;
        // Time window for global suspicious activity (1 minute)
        this.globalTimeWindow = 60 * 1000;
        // Distance threshold in kilometers that's suspicious for same card usage
        this.distanceThreshold = 100;
        // Maximum number of transactions to keep in history
        this.maxTransactionHistory = 50;
    }
    
    /**
     * Process a new transaction and check for fraud patterns
     * @param {Object} transaction - Transaction data
     * @returns {Object} Analysis result with fraud detection
     */
    processTransaction(transaction) {
        // Default result
        const result = {
            isFraud: false,
            reasons: [],
            confidence: 0.0
        };
        
        // Skip processing if missing critical data
        if (!transaction.card_number || !transaction.transaction_date ||
            !transaction.latitude || !transaction.longitude) {
            return result;
        }
        
        const cardNumber = transaction.card_number;
        const timestamp = new Date(transaction.transaction_date).getTime();
        
        // PATTERN 1: Check for simultaneous transactions from different locations (same card)
        if (this.recentTransactions[cardNumber]) {
            for (const prevTrans of this.recentTransactions[cardNumber]) {
                const prevTimestamp = new Date(prevTrans.transaction_date).getTime();
                const timeDiff = Math.abs(timestamp - prevTimestamp);
                
                // Only check transactions within the time window
                if (timeDiff <= this.timeWindow) {
                    // Calculate distance between transaction locations
                    const distance = this.calculateDistance(
                        transaction.latitude, transaction.longitude,
                        prevTrans.latitude, prevTrans.longitude
                    );
                    
                    // If distance is greater than threshold within time window, flag as fraud
                    if (distance > this.distanceThreshold) {
                        result.isFraud = true;
                        result.confidence = 0.9;
                        result.reasons.push(
                            `Simultaneous transactions detected ${distance.toFixed(0)}km apart (${transaction.location} and ${prevTrans.location})`
                        );
                        break;
                    }
                }
            }
        }
        
        // PATTERN 2: Check for rapid-fire global activity (multiple transactions from same location)
        let recentLocationCount = 0;
        const recentTimestamp = timestamp - this.globalTimeWindow;
        
        for (const trans of this.allRecentTransactions) {
            const transTimestamp = new Date(trans.transaction_date).getTime();
            
            // Check if the transaction is recent and from the same location
            if (transTimestamp >= recentTimestamp && 
                trans.location === transaction.location &&
                trans.card_number !== cardNumber) { // Different card
                
                recentLocationCount++;
                
                // If we have multiple transactions from same location but different cards
                if (recentLocationCount >= 3) {
                    result.isFraud = true;
                    result.confidence = Math.max(result.confidence, 0.8);
                    result.reasons.push(
                        `Multiple cards used at ${transaction.location} within a short time frame`
                    );
                    break;
                }
            }
        }
        
        // PATTERN 3: Check for unusual transaction amount
        if (transaction.amount > 50000) {
            // High value transaction
            result.confidence = Math.max(result.confidence, 0.7);
            result.reasons.push(`Unusually high transaction amount: ₹${transaction.amount}`);
            
            // If already other suspicious factors, mark as fraud
            if (result.reasons.length > 1) {
                result.isFraud = true;
            }
        }
        
        // PATTERN 4: Check for transactions at unusual locations (Mumbai and Kolkata specifically)
        if (transaction.location === 'Mumbai' || transaction.location === 'Kolkata') {
            const suspiciousPattern = this.detectCityFraudPattern('Mumbai', 'Kolkata');
            
            if (suspiciousPattern) {
                result.confidence = Math.max(result.confidence, 0.75);
                result.reasons.push(`Suspicious transactions detected in both Mumbai and Kolkata`);
                result.isFraud = true;
            }
        }
        
        // Store the transaction for future reference
        this.storeTransaction(transaction);
        
        return result;
    }
    
    /**
     * Store transaction in history for pattern detection
     * @param {Object} transaction - Transaction data to store
     */
    storeTransaction(transaction) {
        const cardNumber = transaction.card_number;
        
        // Add to card-specific history
        if (!this.recentTransactions[cardNumber]) {
            this.recentTransactions[cardNumber] = [];
        }
        
        const transactionData = {
            transaction_date: transaction.transaction_date,
            amount: transaction.amount,
            latitude: transaction.latitude,
            longitude: transaction.longitude,
            location: transaction.location,
            merchant: transaction.merchant,
            card_number: transaction.card_number
        };
        
        // Add to card-specific history
        this.recentTransactions[cardNumber].push(transactionData);
        
        // Keep only recent transactions (limit history to last 10 transactions per card)
        if (this.recentTransactions[cardNumber].length > 10) {
            this.recentTransactions[cardNumber].shift();
        }
        
        // Add to global transaction history
        this.allRecentTransactions.push(transactionData);
        
        // Trim global history if it gets too large
        if (this.allRecentTransactions.length > this.maxTransactionHistory) {
            this.allRecentTransactions.shift();
        }
    }
    
    /**
     * Calculate distance between two points using Haversine formula
     * @param {number} lat1 - Latitude of point 1
     * @param {number} lon1 - Longitude of point 1
     * @param {number} lat2 - Latitude of point 2
     * @param {number} lon2 - Longitude of point 2
     * @returns {number} Distance in kilometers
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance;
    }
    
    /**
     * Convert degrees to radians
     * @param {number} degrees - Angle in degrees
     * @returns {number} Angle in radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    /**
     * Clear transaction history
     */
    clearTransactionHistory() {
        this.recentTransactions = {};
        this.allRecentTransactions = [];
    }
    
    /**
     * Check for specific city-based fraud patterns
     * @param {string} cityA - First city name
     * @param {string} cityB - Second city name
     * @returns {boolean} True if a pattern is detected
     */
   detectCityFraudPattern() {
    const suspiciousCityPairs = [
        ['Mumbai', 'Kolkata'],
        ['Delhi', 'Chennai'],
        ['Bangalore', 'Jaipur'],
        ['Hyderabad', 'Lucknow']
    ];
    
    const lastHour = new Date();
    lastHour.setHours(lastHour.getHours() - 1);
    
    const recentTransactions = this.allRecentTransactions.filter(trans => {
        const transDate = new Date(trans.transaction_date);
        return transDate >= lastHour;
    });
    
    for (const [cityA, cityB] of suspiciousCityPairs) {
        let cityAFound = false;
        let cityBFound = false;
        
        for (const trans of recentTransactions) {
            if (trans.location === cityA) cityAFound = true;
            if (trans.location === cityB) cityBFound = true;
            
            if (cityAFound && cityBFound) return true;
        }
    }
    
    return false;
}
}
// Initialize our fraud detection system
const fraudDetector = new FraudDetectionSystem();

// Keep track of pending transactions
let pendingTransactions = [];

// Function to submit transaction to fraud detection API
async function submitTransaction(transactionData) {
    try {
        const user = await getCurrentUser();
        const token = localStorage.getItem('token');
        
        if (!user || !token) {
            showNotification('Please login first', 'error');
            return null;
        }
        
        console.log("Sending transaction data:", transactionData);
        
        // First, check with our client-side detector
        const clientFraudCheck = fraudDetector.processTransaction(transactionData);
        
        // If our client-side detector found fraud, we can already flag it
        if (clientFraudCheck.isFraud) {
            console.log("Client-side fraud detection result:", clientFraudCheck);
            showNotification('Potential fraud detected! Same card used in multiple locations simultaneously.', 'error');
        }

        // Now send to backend for server-side validation
        const response = await fetch("http://localhost:5000/predict", {
            method: 'POST',
            mode: 'cors', 
            headers: {  
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(transactionData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Check if the response has the expected structure
        if (!result || typeof result !== 'object') {
            throw new Error('Invalid response from server');
        }
        
        // If either client-side or server-side detected fraud, mark as fraud
        if (clientFraudCheck.isFraud) {
            // Override server result if we detected fraud client-side
            if (result.data) {
                result.data.is_fraud = true;
                result.data.reasons = result.data.reasons || [];
                
                // Add our client-side reasons if they don't exist in server response
                clientFraudCheck.reasons.forEach(reason => {
                    if (!result.data.reasons.includes(reason)) {
                        result.data.reasons.push(reason);
                    }
                });
            } else if (result.success === true) {
                result.data = {
                    is_fraud: true,
                    fraud_probability: 1.0,
                    reasons: clientFraudCheck.reasons,
                    transaction_id: transactionData.transaction_id,
                    alert_generated: true
                };
            }
        }
        
        return result;
    } catch (error) {
        console.error("Error submitting transaction:", error);
        return {
            success: false,
            error: 'Network error',
            details: error.message
        };
    }
}

document.getElementById("fraudForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    // Get form elements
    const amount = document.getElementById("amount").value;
    const location = document.getElementById("location").value;
    const timeInput = document.getElementById("time").value;
    const merchant = document.getElementById("merchant").value;
    const category = document.getElementById("category").value;
    
    // Get results container elements
    const resultContent = document.getElementById("resultContent");
    const resultsContainer = document.getElementById("results");
    
    // Reset results
    resultsContainer.classList.add("hidden");

    try {
        // Properly format the time
        // First, get today's date
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        // Check if timeInput is provided
        let formattedDateTime;
        if (timeInput) {
            // Combine today's date with the input time
            formattedDateTime = `${year}-${month}-${day}T${timeInput}:00.000Z`;
        } else {
            // If no time provided, use current time
            formattedDateTime = new Date().toISOString();
        }

        
        const cardNumber =  '4111111111123456';
        
        // Get coordinates for location
       const INDIAN_CITIES = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 
    'Kolkata', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur',
    'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
    'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad'
];

const cityCoordinates = {
    'Mumbai': {lat: 19.0760, lon: 72.8777},
    'Delhi': {lat: 28.6139, lon: 77.2090},
    'Bangalore': {lat: 12.9716, lon: 77.5946},
    'Hyderabad': {lat: 17.3850, lon: 78.4867},
    'Chennai': {lat: 13.0827, lon: 80.2707},
    'Kolkata': {lat: 22.5726, lon: 88.3639},
    'Pune': {lat: 18.5204, lon: 73.8567},
    'Ahmedabad': {lat: 23.0225, lon: 72.5714},
    'Surat': {lat: 21.1702, lon: 72.8311},
    'Jaipur': {lat: 26.9124, lon: 75.7873},
    'Lucknow': {lat: 26.8467, lon: 80.9462},
    'Kanpur': {lat: 26.4499, lon: 80.3319},
    'Nagpur': {lat: 21.1458, lon: 79.0882},
    'Indore': {lat: 22.7196, lon: 75.8577},
    'Thane': {lat: 19.2183, lon: 72.9781},
    'Bhopal': {lat: 23.2599, lon: 77.4126},
    'Visakhapatnam': {lat: 17.6868, lon: 83.2185},
    'Patna': {lat: 25.5941, lon: 85.1376},
    'Vadodara': {lat: 22.3072, lon: 73.1812},
    'Ghaziabad': {lat: 28.6692, lon: 77.4538}
};
        
        const coords = cityCoordinates[location] || {lat: 19.0760, lon: 72.8777};

        // Prepare request data
        const transactionData = {
            card_number: cardNumber,
            transaction_date: formattedDateTime,
            amount: parseFloat(amount),
            location: location,
            latitude: coords.lat,
            longitude: coords.lon,
            merchant: merchant,
            category: category,
            transaction_id: 'TX' + Date.now()
        };

        // Show loading state
        resultContent.innerHTML = `
            <div class="flex justify-center items-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                <span class="ml-2 text-gray-300">Processing transaction...</span>
            </div>
        `;
        resultsContainer.classList.remove("hidden");

        // Submit the transaction
        const result = await submitTransaction(transactionData);
        
        if (!result) {
            throw new Error('Failed to process transaction');
        }

        // Update the result display
        if (result.success === false) {
            // Handle error response
            resultContent.innerHTML = `
                <div class="bg-red-500 text-white p-4 rounded">
                    <p class="font-bold">Error:</p>
                    <p>${result.error || 'Unknown error occurred'}</p>
                    ${result.details ? `<p class="text-sm mt-2">${result.details}</p>` : ''}
                </div>
            `;
            return;
        }

        // Handle successful response
        const resultData = result.data || result;
        
        resultContent.innerHTML = `
            <div class="space-y-3">
                <p class="text-gray-300">Transaction ID: <strong>${resultData.transaction_id}</strong></p>
                <p class="text-gray-300">Fraudulent Transaction: 
                    <strong class="${resultData.is_fraud ? 'text-red-400' : 'text-green-400'}">
                        ${resultData.is_fraud ? 'Yes' : 'No'}
                    </strong>
                </p>
                <p class="text-gray-300">Confidence: 
                    <strong>${(resultData.fraud_probability * 100).toFixed(2)}%</strong>
                </p>
                ${resultData.reasons && resultData.reasons.length > 0 ? `
                    <div class="mt-4">
                        <p class="text-gray-300 font-medium mb-1">Reasons:</p>
                        <ul class="list-disc list-inside text-gray-400 space-y-1">
                            ${resultData.reasons.map(reason => `<li>${reason}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${resultData.alert_generated ? `
                    <p class="text-yellow-400 mt-3">Fraud alert has been generated</p>
                ` : ''}
            </div>
        `;

        // Add to transaction history
        if (resultData.is_fraud !== undefined) {
            addToTransactionHistory(transactionData, resultData);
        }

    } catch (error) {
        console.error("Error detecting fraud:", error);
        resultsContainer.classList.remove("hidden");
        resultContent.innerHTML = `
            <div class="bg-red-500 text-white p-4 rounded">
                <p class="font-bold">Network Error:</p>
                <p>Could not connect to fraud detection service.</p>
                <p class="text-sm mt-2">${error.message}</p>
                <p class="text-sm">Make sure the backend server is running on http://localhost:5000</p>
            </div>
        `;
    }
});

async function testSimultaneousTransactions() {
    // This function can be called from the console to test the detection
    const transaction1 = {
        card_number: cardNumber,
        transaction_date: new Date().toISOString(),
        amount: 3000,
        location: 'Mumbai',
        latitude: 19.076,
        longitude: 72.8777,
        merchant: 'Shopping Mall',
        category: 'Shopping',
        transaction_id: 'TX' + Date.now()
    };
    
    const transaction2 = {
        card_number: cardNumber,  
        transaction_date: new Date().toISOString(), // Same timestamp
        amount: 2500,
        location: 'Kolkata',
        latitude: 22.5726,
        longitude: 88.3639,
        merchant: 'Electronics Store',
        category: 'Electronics',
        transaction_id: 'TX' + (Date.now() + 1)
    };
    
    console.log("Testing simultaneous transactions");
    console.log("Transaction 1:", transaction1);
    console.log("Transaction 2:", transaction2);
    
    // Submit both transactions
    const result1 = await submitTransaction(transaction1);
    console.log("Result for transaction 1:", result1);
    
    // The second transaction should be detected as fraudulent
    const result2 = await submitTransaction(transaction2);
    console.log("Result for transaction 2:", result2);
    
    return { result1, result2 };
}

// Make test function available globally
window.testSimultaneousTransactions = testSimultaneousTransactions;

// Update the addToTransactionHistory function
function addToTransactionHistory(transactionData, fraudResult) {
    const newTransaction = {
        id: transactionData.transaction_id,
        amount: transactionData.amount,
        merchant: transactionData.merchant,
        location: transactionData.location,
        date: new Date(transactionData.transaction_date),
        isFlagged: fraudResult.is_fraud || false,
        category: transactionData.category
    };
    
    userTransactions.unshift(newTransaction);
    
    if (userTransactions.length > 10) {
        userTransactions = userTransactions.slice(0, 10);
    }
    
    updateTransactionsList();
    
    if (fraudResult.is_fraud) {
        showNotification('⚠️ Potential fraud detected! Transaction has been flagged.', 'error');
    } else {
        showNotification('Transaction processed successfully.', 'success');
    }
}
// Simple notification function
function showNotification(message, type = 'info') {
    let notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.className = 'fixed top-4 right-4 z-50';
        document.body.appendChild(notificationContainer);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification mb-2 p-3 rounded shadow-lg ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white`;
    notification.textContent = message;
    
    notificationContainer.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
    
    getCurrentUser().then(user => {
        if (user) {
            console.log('User is authenticated:', user);
            updateAuthUI();
        }
    }).catch(error => {
        console.error('Error checking authentication status:', error);
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === authModal) {
            hideAuthModal();
        }
        if (event.target === addCardModal) {
            hideCardModal();
        }
    });
    
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = this.value.replace(/\D/g, '');
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            this.value = value;
        });
    }
    
    const expiryDateInput = document.getElementById('expiryDate');
    if (expiryDateInput) {
        expiryDateInput.addEventListener('input', function(e) {
            let value = this.value.replace(/\D/g, '');
            if (value.length > 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            this.value = value;
        });
    }
});

// Export functions for use in other scripts
window.authFunctions = {
    loginUser,
    signupUser,
    getCurrentUser,
    logout,
    updateAuthUI,
    showAuthModal,
    hideAuthModal
};