
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


const INDIAN_NAMES = ['Aarav Sharma', 'Priya Patel', 'Rahul Singh', 'Ananya Gupta', 'Vikram Joshi'];
const INDIAN_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune'];
const INDIAN_BANKS = ['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB'];


let userCards = [];
let userTransactions = [];

// Auth Modal Functions
function showAuthModal() {
    authModal.classList.remove('hidden');
    // Clear any previous error messages
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
        // not real only simulation
        const user = {
            id: 'user123',
            username: INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)],
            email: email,
            token: 'demo-token-123'
        };
        
        // Store the token in localStorage
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
        // not real only simulation
        const user = {
            id: 'user' + Math.floor(Math.random() * 1000),
            username: username,
            email: email,
            token: 'demo-token-' + Math.floor(Math.random() * 1000)
        };
        
        // Store the token in localStorage
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
    // Clear cards and transactions
    userCards = [];
    userTransactions = [];
   
    window.dispatchEvent(new CustomEvent('user-logged-out'));
    // Update UI
    updateAuthUI();
}

// Update UI based on authentication state
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const userInfo = document.getElementById('userInfo');
    const authButtons = document.getElementById('authButtons');
    const protectedContent = document.querySelectorAll('.protected-content');
    
    if (token) {
        // User is logged in
        if (userInfo && authButtons) {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                userInfo.classList.remove('hidden');
                authButtons.classList.add('hidden');
                
                // Update user info display
                const usernameDisplay = document.getElementById('usernameDisplay');
                if (usernameDisplay && user) {
                    usernameDisplay.textContent = user.username.split(' ')[0]; // Show first name only
                }
                
                // Update sidebar user info
                if (sidebarUsername && sidebarUserEmail && sidebarUsernameInitials) {
                    sidebarUsername.textContent = user.username;
                    sidebarUserEmail.textContent = user.email;
                    // Get initials
                    const names = user.username.split(' ');
                    const initials = names[0].charAt(0) + (names[1] ? names[1].charAt(0) : '');
                    sidebarUsernameInitials.textContent = initials;
                }
                
                // Show protected content
                protectedContent.forEach(element => {
                    element.classList.remove('hidden');
                });
                
                // Show add card button
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
        // User is logged out
        if (userInfo && authButtons) {
            userInfo.classList.add('hidden');
            authButtons.classList.remove('hidden');
            
            // Hide protected content
            protectedContent.forEach(element => {
                element.classList.add('hidden');
            });
            
            // Hide add card button
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

    // Add event listeners to remove buttons
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
    // Very basic detection for demo
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
        
        // Basic form validation
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
        
        // Show loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        
        try {
            await loginUser(email, password);
            // Close modal after successful login
            hideAuthModal();
            updateAuthUI();
            // Show success notification
            showNotification('Login successful!', 'success');
        } catch (error) {
            if (errorMsg) {
                errorMsg.textContent = error.message || 'Login failed. Please try again.';
                errorMsg.classList.remove('hidden');
            }
        } finally {
            // Reset button state
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
        
        // Basic form validation
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
        
        // Show loading state
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
        
        try {
            await signupUser(username, email, password);
            // Close modal after successful signup
            hideAuthModal();
            updateAuthUI();
            // Show success notification
            showNotification('Account created successfully!', 'success');
        } catch (error) {
            if (errorMsg) {
                errorMsg.textContent = error.message || 'Signup failed. Please try again.';
                errorMsg.classList.remove('hidden');
            }
        } finally {
            // Reset button state
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
        
        // Basic validation
        if (!cardData.nickname || !cardData.number || !cardData.expiry || !cardData.cvv || !cardData.name) {
            showNotification('Please fill in all card details', 'error');
            return;
        }
        
        if (cardData.number.length < 16) {
            showNotification('Please enter a valid card number', 'error');
            return;
        }
        
        // Add the card
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

// Fraud Detection Form
const fraudForm = document.getElementById('fraudForm');
const results = document.getElementById('results');
const resultContent = document.getElementById('resultContent');

if (fraudForm) {
    fraudForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Check if user is logged in before processing
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Please log in to use this feature', 'error');
            showAuthModal();
            return;
        }
        
        // Get form values
        const amount = parseFloat(document.getElementById('amount').value);
        const location = document.getElementById('location').value;
        const time = document.getElementById('time').value;
        const category = document.getElementById('category').value;
        const history = document.getElementById('history').value;
        
        // Simple mock fraud detection algorithm
        let riskScore = 0;
        
        // High amount increases risk
        if (amount > 10000) riskScore += 30; // ₹10,000+
        else if (amount > 5000) riskScore += 15; // ₹5,000-₹10,000
        else if (amount > 2000) riskScore += 5; // ₹2,000-₹5,000
        
        // International transactions are riskier
        if (location === 'international') riskScore += 20;
        
        // Late night purchases are riskier
        if (time === 'night') riskScore += 15;
        
        // Unusual purchase history is riskier
        if (history === 'rare') riskScore += 30;
        else if (history === 'unusual') riskScore += 15;
        
        // Certain categories are riskier
        if (category === 'online' || category === 'travel') riskScore += 10;
        
        // Determine risk level
        let riskLevel, riskClass, riskIcon;
        
        if (riskScore >= 50) {
            riskLevel = 'High Risk';
            riskClass = 'text-red-500';
            riskIcon = '<span class="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>';
        } else if (riskScore >= 25) {
            riskLevel = 'Medium Risk';
            riskClass = 'text-yellow-400';
            riskIcon = '<span class="inline-block w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>';
        } else {
            riskLevel = 'Low Risk';
            riskClass = 'text-green-400';
            riskIcon = '<span class="inline-block w-3 h-3 rounded-full bg-green-400 mr-2"></span>';
        }
        
        // Display results
        let resultHTML = `
            <div class="flex items-center justify-between mb-4">
                <h4 class="text-xl font-semibold flex items-center ${riskClass}">
                    ${riskIcon} ${riskLevel} (Score: ${riskScore}/100)
                </h4>
            </div>
            <div class="mb-4">
                <p class="text-gray-300">
                    Based on our analysis of this transaction:
                </p>
                <ul class="mt-2 space-y-1 text-gray-300">
        `;
        
        // Add specific risk factors
        if (amount > 5000) resultHTML += `<li>• High transaction amount (₹${amount.toLocaleString('en-IN')})</li>`;
        if (location === 'international') resultHTML += '<li>• International transaction location</li>';
        if (time === 'night') resultHTML += '<li>• Unusual transaction time</li>';
        if (history === 'rare' || history === 'unusual') resultHTML += '<li>• Unusual for your spending pattern</li>';
        
        resultHTML += `
                </ul>
            </div>
            <div class="recommendation p-3 ${riskScore >= 50 ? 'bg-red-900 bg-opacity-20' : riskScore >= 25 ? 'bg-yellow-900 bg-opacity-20' : 'bg-green-900 bg-opacity-20'} rounded-md">
                <p class="font-medium mb-1">Recommendation:</p>
                <p>${riskScore >= 50 ? 'We recommend declining this transaction and contacting your bank immediately.' : 
                    riskScore >= 25 ? 'Proceed with caution. Consider verifying this transaction with your bank.' : 
                    'This transaction appears to be legitimate based on your normal spending patterns.'}
                </p>
            </div>
        `;
        
        // Show results
        if (resultContent) resultContent.innerHTML = resultHTML;
        if (results) {
            results.classList.remove('hidden');
            // Scroll to results
            results.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Add this transaction to history
        const now = new Date();
        userTransactions.unshift({
            id: 'trans' + (userTransactions.length + 1),
            date: now,
            amount: amount,
            category: category.charAt(0).toUpperCase() + category.slice(1),
            merchant: getMerchantForCategory(category),
            location: location === 'international' ? 'International' : INDIAN_CITIES[Math.floor(Math.random() * INDIAN_CITIES.length)],
            isFlagged: riskScore >= 25
        });
        
        updateTransactionsList();
    });
}


function getMerchantForCategory(category) {
    const merchants = {
        grocery: ['Big Bazaar', 'D-Mart', 'Reliance Fresh', 'More', 'Nature\'s Basket'],
        retail: ['Amazon India', 'Flipkart', 'Myntra', 'Ajio', 'Tata Cliq'],
        restaurant: ['Swiggy', 'Zomato', 'Domino\'s', 'McDonald\'s', 'KFC'],
        travel: ['IRCTC', 'MakeMyTrip', 'Goibibo', 'Yatra', 'Cleartrip'],
        entertainment: ['BookMyShow', 'PVR Cinemas', 'INOX', 'Netflix', 'Amazon Prime'],
        online: ['Google Play', 'Apple App Store', 'Paytm', 'PhonePe', 'Spotify'],
        other: ['General Store', 'Local Vendor', 'Kirana Shop', 'Street Vendor']
    };
    
    const categoryMerchants = merchants[category] || merchants.other;
    return categoryMerchants[Math.floor(Math.random() * categoryMerchants.length)];
}

// Simple notification function
function showNotification(message, type = 'info') {
    // Check if notification container exists, if not create it
    let notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.className = 'fixed top-4 right-4 z-50';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification mb-2 p-3 rounded shadow-lg ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white`;
    notification.textContent = message;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}


document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
    
    // Check if user is logged in
    getCurrentUser().then(user => {
        if (user) {
            console.log('User is authenticated:', user);
            updateAuthUI();
        }
    }).catch(error => {
        console.error('Error checking authentication status:', error);
    });
    
    // Handle outside clicks to close modal
    window.addEventListener('click', function(event) {
        if (event.target === authModal) {
            hideAuthModal();
        }
        if (event.target === addCardModal) {
            hideCardModal();
        }
    });
    
    // Format card number input
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            // Remove all non-digit characters
            let value = this.value.replace(/\D/g, '');
            
            // Add space after every 4 digits
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            
            // Update the input value
            this.value = value;
        });
    }
    
    // Format expiry date input
    const expiryDateInput = document.getElementById('expiryDate');
    if (expiryDateInput) {
        expiryDateInput.addEventListener('input', function(e) {
            // Remove all non-digit characters
            let value = this.value.replace(/\D/g, '');
            
            // Add slash after 2 digits (MM/YY)
            if (value.length > 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            
            // Update the input value
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