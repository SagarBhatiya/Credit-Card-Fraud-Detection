


const API_URL = 'http://localhost:3000/api';


const authModal = document.getElementById('authModal');
const addCardModal = document.getElementById('addCardModal');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const headerLoginBtn = document.getElementById('headerLoginBtn');
const headerSignupBtn = document.getElementById('headerSignupBtn');
const closeAuthModal = document.getElementById('closeAuthModal');
const addCardBtn = document.getElementById('addCardBtn');
const closeCardModal = document.getElementById('closeCardModal');
const addCardForm = document.getElementById('addCardForm');
const fraudForm = document.getElementById('fraudForm');
const resultSafe = document.getElementById('resultSafe');
const resultWarning = document.getElementById('resultWarning');
const resultFraud = document.getElementById('resultFraud');
const loadingIndicator = document.querySelector('.loading');


let currentUser = null;
let authToken = null;


document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    setupEventListeners();
});

function checkAuthentication() {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedToken && storedUser) {
        authToken = storedToken;
        currentUser = JSON.parse(storedUser);
        updateUIForAuthenticatedUser();
        loadUserData();
    }
}

function setupEventListeners() {
    
    headerLoginBtn.addEventListener('click', () => {
        setActiveTab('login');
        showModal(authModal);
    });
    
    headerSignupBtn.addEventListener('click', () => {
        setActiveTab('signup');
        showModal(authModal);
    });
    
    closeAuthModal.addEventListener('click', () => {
        hideModal(authModal);
    });
    
    loginTab.addEventListener('click', () => setActiveTab('login'));
    signupTab.addEventListener('click', () => setActiveTab('signup'));
    
    
    loginForm.addEventListener('submit', handleLoginSubmit);
    signupForm.addEventListener('submit', handleSignupSubmit);
    
   
    addCardBtn.addEventListener('click', () => showModal(addCardModal));
    closeCardModal.addEventListener('click', () => hideModal(addCardModal));
    addCardForm.addEventListener('submit', handleAddCardSubmit);
    
   
    fraudForm.addEventListener('submit', handleFraudFormSubmit);
    
    const logoutBtn = document.querySelector('.sidebar-footer button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    
    window.addEventListener('click', (e) => {
        if (e.target === authModal) hideModal(authModal);
        if (e.target === addCardModal) hideModal(addCardModal);
    });
}


function showModal(modal) {
    modal.classList.remove('hidden');
}

function hideModal(modal) {
    modal.classList.add('hidden');
}

function setActiveTab(tab) {
    if (tab === 'login') {
        loginTab.classList.add('border-b-2', 'border-blue-500', 'text-blue-500');
        signupTab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-500');
        signupTab.classList.add('text-gray-500');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        signupTab.classList.add('border-b-2', 'border-blue-500', 'text-blue-500');
        loginTab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-500');
        loginTab.classList.add('text-gray-500');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

function updateUIForAuthenticatedUser() {
    
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        authButtons.innerHTML = `
            <span class="text-gray-700">Welcome, ${currentUser.name}</span>
        `;
    }
    
    
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        const initials = currentUser.name.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();
            
        userProfile.querySelector('.user-profile div:first-child').innerHTML = `
            <div class="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
                ${initials}
            </div>
            <div class="ml-3">
                <p class="font-medium text-gray-800">${currentUser.name}</p>
                <p class="text-sm text-gray-500">${currentUser.email}</p>
            </div>
        `;
    }
}


async function loadUserData() {
    if (!authToken) return;
    
    try {
        
        const cardsResponse = await fetch(`${API_URL}/cards`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (cardsResponse.ok) {
            const cards = await cardsResponse.json();
            renderCards(cards);
        }
        
    
        const transactionsResponse = await fetch(`${API_URL}/transactions`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (transactionsResponse.ok) {
            const transactions = await transactionsResponse.json();
            renderTransactions(transactions);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}


function renderCards(cards) {
    const cardsList = document.querySelector('.cards-list');
    if (!cardsList) return;
    
    cardsList.innerHTML = '';
    
    if (cards.length === 0) {
        cardsList.innerHTML = '<p class="text-gray-500 text-sm">No cards added yet.</p>';
        return;
    }
    
    cards.forEach((card, index) => {
        const borderColor = index % 2 === 0 ? 'border-blue-500' : 'border-green-500';
        const cardElement = document.createElement('div');
        cardElement.className = `card-item p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition cursor-pointer border-l-4 ${borderColor}`;
        cardElement.innerHTML = `
            <p class="font-medium text-gray-800">${card.name}</p>
            <p class="text-sm text-gray-500">${card.number}</p>
        `;
        cardsList.appendChild(cardElement);
    });
}


function renderTransactions(transactions) {
    const historyList = document.querySelector('.history-list');
    if (!historyList) return;
    
    historyList.innerHTML = '';
    
    if (transactions.length === 0) {
        historyList.innerHTML = '<p class="text-gray-500 text-sm">No recent transactions.</p>';
        return;
    }
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const formattedDate = `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        const formattedTime = `${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        
        
        let statusColor = 'green';
        let statusText = 'Safe';
        
        if (transaction.status === 'flagged') {
            statusColor = 'yellow';
            statusText = 'Flagged';
        } else if (transaction.status === 'fraud') {
            statusColor = 'red';
            statusText = 'Fraud';
        }
        
        const transactionElement = document.createElement('div');
        transactionElement.className = 'history-item p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition cursor-pointer';
        transactionElement.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-medium text-gray-800">${transaction.name}</p>
                    <p class="text-xs text-gray-500">${formattedDate} • ${formattedTime}</p>
                </div>
                <span class="text-sm font-medium text-gray-800">$${transaction.amount.toFixed(2)}</span>
            </div>
            <div class="mt-1 flex items-center">
                <span class="inline-block w-2 h-2 rounded-full bg-${statusColor}-500 mr-1"></span>
                <span class="text-xs text-${statusColor}-500">${statusText}</span>
            </div>
        `;
        historyList.appendChild(transactionElement);
    });
}


async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            alert(data.message || 'Login failed');
            return;
        }
        
        
        authToken = data.token;
        currentUser = data.user;
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        
        updateUIForAuthenticatedUser();
        hideModal(authModal);
        loadUserData();
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

async function handleSignupSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            alert(data.message || 'Registration failed');
            return;
        }
        
       
        authToken = data.token;
        currentUser = data.user;
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
       
        updateUIForAuthenticatedUser();
        hideModal(authModal);
        loadUserData();
        
    } catch (error) {
        console.error('Signup error:', error);
        alert('Registration failed. Please try again.');
    }
}

async function handleAddCardSubmit(e) {
    e.preventDefault();
    
    if (!authToken) {
        alert('Please log in to add a card');
        hideModal(addCardModal);
        showModal(authModal);
        return;
    }
    
    const name = document.getElementById('cardName').value;
    const number = document.getElementById('cardNumber').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    const cardholderName = document.getElementById('cardholderName').value;
    
    try {
        const response = await fetch(`${API_URL}/cards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ name, number, expiryDate, cvv, cardholderName })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            alert(data.message || 'Failed to add card');
            return;
        }
        
        
        addCardForm.reset();
        hideModal(addCardModal);
        
      
        loadUserData();
        
    } catch (error) {
        console.error('Add card error:', error);
        alert('Failed to add card. Please try again.');
    }
}

async function handleFraudFormSubmit(e) {
    e.preventDefault();
    
    if (!authToken) {
        alert('Please log in to use the fraud detection system');
        showModal(authModal);
        return;
    }
    
  
    const amount = document.getElementById('amount').value;
    const location = document.getElementById('location').value;
    const time = document.getElementById('time').value;
    const category = document.getElementById('category').value;
    const history = document.getElementById('history').value;
    
   
    hideResults();
    
 
    loadingIndicator.classList.remove('hidden');
    
    try {
        const response = await fetch(`${API_URL}/analyze-transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ amount, location, time, category, history })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Analysis failed');
        }
        
        
        loadingIndicator.classList.add('hidden');
        
        
        showResult(data.result, data);
        
        
        loadUserData();
        
    } catch (error) {
        console.error('Fraud analysis error:', error);
        loadingIndicator.classList.add('hidden');
        alert('Analysis failed. Please try again.');
    }
}

function hideResults() {
    resultSafe.classList.add('hidden');
    resultWarning.classList.add('hidden');
    resultFraud.classList.add('hidden');
}

function showResult(result, data) {
    if (result === 'safe') {
        resultSafe.classList.remove('hidden');
        renderChart('safeChart', data.fraudScore);
    } else if (result === 'warning') {
        resultWarning.classList.remove('hidden');
        renderChart('warningChart', data.fraudScore);
    } else if (result === 'fraud') {
        resultFraud.classList.remove('hidden');
        renderChart('fraudChart', data.fraudScore);
    }
}

function renderChart(containerId, score) {
    
    const container = document.getElementById(containerId);
    
   
    container.innerHTML = `
        <div class="flex items-center justify-center h-full">
            <div class="w-48 h-48 rounded-full border-8 border-gray-200 flex items-center justify-center">
                <div class="text-3xl font-bold">
                    ${score}%
                </div>
            </div>
        </div>
        <div class="text-center mt-4">
            <p class="text-gray-700">Fraud Score</p>
            <p class="text-sm text-gray-500">Based on transaction analysis</p>
        </div>
    `;
}

function handleLogout() {
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    
  
    window.location.reload();
}


document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideModal(authModal);
        hideModal(addCardModal);
    }
});