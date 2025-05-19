const addCardModal = document.getElementById('addCardModal');
const addCardBtn = document.getElementById('addCardBtn');
const closeCardModal = document.getElementById('closeCardModal');
const addCardForm = document.getElementById('addCardForm');

const cardsList = document.querySelector('.cards-list');
const historyList = document.querySelector('.history-list');

const FRAUD_API_URL = 'http://localhost:5000/predict';

const INDIAN_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune'];
const INDIAN_BANKS = ['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB'];

let userCards = [];
let userTransactions = [];

function showCardModal() {
    if (addCardModal) addCardModal.classList.remove('hidden');
}

function hideCardModal() {
    if (addCardModal) addCardModal.classList.add('hidden');
}

if (addCardBtn) addCardBtn.addEventListener('click', showCardModal);
if (closeCardModal) closeCardModal.addEventListener('click', hideCardModal);

// Card management functions
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

// Card form handling
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

// Fraud detection system
class FraudDetectionSystem {
    constructor() {
        this.recentTransactions = {};
        this.allRecentTransactions = [];
        this.timeWindow = 5 * 60 * 1000;
        this.globalTimeWindow = 60 * 1000;
        this.distanceThreshold = 100;
        this.maxTransactionHistory = 50;
    }
    
    processTransaction(transaction) {
        const result = {
            isFraud: false,
            reasons: [],
            confidence: 0.0
        };
        
        if (!transaction.card_number || !transaction.transaction_date ||
            !transaction.latitude || !transaction.longitude) {
            return result;
        }
        
        const cardNumber = transaction.card_number;
        const timestamp = new Date(transaction.transaction_date).getTime();
        
        if (this.recentTransactions[cardNumber]) {
            for (const prevTrans of this.recentTransactions[cardNumber]) {
                const prevTimestamp = new Date(prevTrans.transaction_date).getTime();
                const timeDiff = Math.abs(timestamp - prevTimestamp);
                
                if (timeDiff <= this.timeWindow) {
                    const distance = this.calculateDistance(
                        transaction.latitude, transaction.longitude,
                        prevTrans.latitude, prevTrans.longitude
                    );
                    
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
        
        let recentLocationCount = 0;
        const recentTimestamp = timestamp - this.globalTimeWindow;
        
        for (const trans of this.allRecentTransactions) {
            const transTimestamp = new Date(trans.transaction_date).getTime();
            
            if (transTimestamp >= recentTimestamp && 
                trans.location === transaction.location &&
                trans.card_number !== cardNumber) {
                
                recentLocationCount++;
                
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
        
        if (transaction.amount > 50000) {
            result.confidence = Math.max(result.confidence, 0.7);
            result.reasons.push(`Unusually high transaction amount: ₹${transaction.amount}`);
            
            if (result.reasons.length > 1) {
                result.isFraud = true;
            }
        }
        
        if (transaction.location === 'Mumbai' || transaction.location === 'Kolkata') {
            const suspiciousPattern = this.detectCityFraudPattern('Mumbai', 'Kolkata');
            
            if (suspiciousPattern) {
                result.confidence = Math.max(result.confidence, 0.75);
                result.reasons.push(`Suspicious transactions detected in both Mumbai and Kolkata`);
                result.isFraud = true;
            }
        }
        
        this.storeTransaction(transaction);
        
        return result;
    }
    
    storeTransaction(transaction) {
        const cardNumber = transaction.card_number;
        
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
        
        this.recentTransactions[cardNumber].push(transactionData);
        
        if (this.recentTransactions[cardNumber].length > 10) {
            this.recentTransactions[cardNumber].shift();
        }
        
        this.allRecentTransactions.push(transactionData);
        
        if (this.allRecentTransactions.length > this.maxTransactionHistory) {
            this.allRecentTransactions.shift();
        }
    }
    
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
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
    
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    clearTransactionHistory() {
        this.recentTransactions = {};
        this.allRecentTransactions = [];
    }
    
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

const fraudDetector = new FraudDetectionSystem();
let pendingTransactions = [];

async function submitTransaction(transactionData) {
    try {
        console.log("Sending transaction data:", transactionData);
        
        const clientFraudCheck = fraudDetector.processTransaction(transactionData);
        
        if (clientFraudCheck.isFraud) {
            console.log("Client-side fraud detection result:", clientFraudCheck);
            showNotification('Potential fraud detected! Same card used in multiple locations simultaneously.', 'error');
        }

        const response = await fetch("http://localhost:5000/predict", {
            method: 'POST',
            mode: 'cors', 
            headers: {  
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result || typeof result !== 'object') {
            throw new Error('Invalid response from server');
        }
        
        if (clientFraudCheck.isFraud) {
            if (result.data) {
                result.data.is_fraud = true;
                result.data.reasons = result.data.reasons || [];
                
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

    const amount = document.getElementById("amount").value;
    const location = document.getElementById("location").value;
    const timeInput = document.getElementById("time").value;
    const merchant = document.getElementById("merchant").value;
    const category = document.getElementById("category").value;
    
    const resultContent = document.getElementById("resultContent");
    const resultsContainer = document.getElementById("results");
    
    resultsContainer.classList.add("hidden");

    try {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        let formattedDateTime;
        if (timeInput) {
            formattedDateTime = `${year}-${month}-${day}T${timeInput}:00.000Z`;
        } else {
            formattedDateTime = new Date().toISOString();
        }

        const cardNumber = '4111111111123456';
        
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

        resultContent.innerHTML = `
            <div class="flex justify-center items-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                <span class="ml-2 text-gray-300">Processing transaction...</span>
            </div>
        `;
        resultsContainer.classList.remove("hidden");

        const result = await submitTransaction(transactionData);
        
        if (!result) {
            throw new Error('Failed to process transaction');
        }

        if (result.success === false) {
            resultContent.innerHTML = `
                <div class="bg-red-500 text-white p-4 rounded">
                    <p class="font-bold">Error:</p>
                    <p>${result.error || 'Unknown error occurred'}</p>
                    ${result.details ? `<p class="text-sm mt-2">${result.details}</p>` : ''}
                </div>
            `;
            return;
        }

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
    const transaction1 = {
        card_number: '4111111111123456',
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
        card_number: '4111111111123456',  
        transaction_date: new Date().toISOString(),
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
    
    const result1 = await submitTransaction(transaction1);
    console.log("Result for transaction 1:", result1);
    
    const result2 = await submitTransaction(transaction2);
    console.log("Result for transaction 2:", result2);
    
    return { result1, result2 };
}

window.testSimultaneousTransactions = testSimultaneousTransactions;

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
    // Initialize UI
    updateCardsList();
    updateTransactionsList();
    
    window.addEventListener('click', function(event) {
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