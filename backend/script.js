// DOM Elements
const authModal = document.getElementById('authModal');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const headerLoginBtn = document.getElementById('headerLoginBtn');
const headerSignupBtn = document.getElementById('headerSignupBtn');
const closeAuthModal = document.getElementById('closeAuthModal');

// Show/Hide Card Modal
const addCardModal = document.getElementById('addCardModal');
const addCardBtn = document.getElementById('addCardBtn');
const closeCardModal = document.getElementById('closeCardModal');

// API URL - Change this to your backend URL
const API_URL = 'http://localhost:5000/api/auth';

// Auth Modal Functions
function showAuthModal() {
    authModal.classList.remove('hidden');
    // Clear any previous error messages
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
        element.classList.add('hidden');
    });
    // Clear form fields
    if (loginForm) loginForm.reset();
    if (signupForm) signupForm.reset();
}

function hideAuthModal() {
    authModal.classList.add('hidden');
}

// Event listeners for showing/hiding auth modal
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
    // Clear any previous error messages
    document.getElementById('loginError')?.classList.add('hidden');
    document.getElementById('signupError')?.classList.add('hidden');
}

function showSignupTab() {
    signupTab.classList.add('border-cyan', 'text-cyan');
    loginTab.classList.remove('border-cyan', 'text-cyan');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    // Clear any previous error messages
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
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include' // Include cookies if your server uses them
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        // Store the token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Dispatch an event to notify other components
        window.dispatchEvent(new CustomEvent('user-authenticated'));
        
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function signupUser(username, email, password) {
    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password }),
            credentials: 'include' // Include cookies if your server uses them
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Signup failed');
        }
        
        // Store the token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Dispatch an event to notify other components
        window.dispatchEvent(new CustomEvent('user-authenticated'));
        
        return data;
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
        const response = await fetch(`${API_URL}/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Include cookies if your server uses them
        });

        if (response.status === 401) {
            // Token is invalid or expired
            logout();
            return null;
        }

        if (!response.ok) {
            throw new Error('Failed to get user data');
        }

        const userData = await response.json();
        return userData;
    } catch (error) {
        console.error('Get user error:', error);
        // Only clear local storage if it's an auth error
        if (error.message.includes('auth') || error.message.includes('token')) {
            logout();
        }
        return null;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Dispatch an event to notify other components
    window.dispatchEvent(new CustomEvent('user-logged-out'));
    // Update UI as needed
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
                    usernameDisplay.textContent = user.username;
                }
                
                // Show protected content
                protectedContent.forEach(element => {
                    element.classList.remove('hidden');
                });
                
                // If you have an add card button (for logged in users only)
                if (addCardBtn) {
                    addCardBtn.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error parsing user data', error);
                logout(); // Handle corrupt data by logging out
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
            
            // If you have an add card button (for logged in users only)
            if (addCardBtn) {
                addCardBtn.classList.add('hidden');
            }
        }
    }
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
            // Show success notification if you have one
            showNotification('Login successful!', 'success');
        } catch (error) {
            if (errorMsg) {
                errorMsg.textContent = error.message || 'Login failed';
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
        const errorMsg = document.getElementById('signupError');
        
        // Basic form validation
        if (!username || !email || !password) {
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
            // Show success notification if you have one
            showNotification('Account created successfully!', 'success');
        } catch (error) {
            if (errorMsg) {
                errorMsg.textContent = error.message || 'Signup failed';
                errorMsg.classList.remove('hidden');
            }
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
}

// Add logout functionality
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
        showNotification('You have been logged out', 'info');
    });
}

// Simple notification function - add this to your HTML or create dynamically
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

// Initialize UI on page load
document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
    
    // Check if user is logged in
    getCurrentUser().then(user => {
        if (user) {
            console.log('User is authenticated:', user);
            // Update user data in local storage in case anything changed server-side
            localStorage.setItem('user', JSON.stringify(user));
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
    
    // Test server connection
    fetch(`${API_URL.replace('/auth', '')}/health`)
        .then(response => response.json())
        .then(data => {
            console.log('Server status:', data.status);
        })
        .catch(error => {
            console.error('Server connection error:', error);
            showNotification('Cannot connect to server. Please check your backend is running.', 'error');
        });
});

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
        if (amount > 1000) riskScore += 30;
        else if (amount > 500) riskScore += 15;
        else if (amount > 200) riskScore += 5;
        
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
        if (amount > 500) resultHTML += `<li>• High transaction amount ($${amount.toFixed(2)})</li>`;
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
    });
}

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