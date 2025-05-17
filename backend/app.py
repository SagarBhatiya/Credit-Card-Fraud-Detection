import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from geopy.distance import geodesic
from geopy.geocoders import Nominatim
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
from collections import defaultdict
from datetime import datetime, timezone, timedelta
import time


# --- Global Variables ---
app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://127.0.0.1:5501", "http://localhost:5501"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

model = None
scaler = None
real_time_detector = None


@app.route("/")
def home():
    return "Welcome to the Fraud Detection API!"


# --- Real-Time Fraud Detection Class ---
class RealTimeFraudDetector:
    def __init__(self):
        self.transaction_history = defaultdict(list)
        self.geolocator = Nominatim(user_agent="fraud_detection_system")
        
        self.city_coordinates = {
            'Mumbai': (19.0760, 72.8777),
            'Delhi': (28.6139, 77.2090),
            'Bangalore': (12.9716, 77.5946),
            'Hyderabad': (17.3850, 78.4867),
            'Chennai': (13.0827, 80.2707),
            'Kolkata': (22.5726, 88.3639),
            'Pune': (18.5204, 73.8567)
        }
        
        # Adjusted thresholds
        self.SAME_TIME_THRESHOLD = timedelta(minutes=5)  # Time window to consider transactions simultaneous
        self.IMPOSSIBLE_TRAVEL_SPEED = 500  # km/h
        self.MIN_TRAVEL_DISTANCE = 50  # km
        self.HISTORY_WINDOW = timedelta(hours=24)

    def check_fraud(self, transaction):
        card_number = transaction['card_number']
        
        # Parse transaction date
        try:
            if isinstance(transaction['transaction_date'], str):
                current_time = datetime.fromisoformat(transaction['transaction_date'].replace('Z', '+00:00'))
            else:
                current_time = transaction['transaction_date']
        except Exception as e:
            print(f"Error parsing transaction date: {e}")
            current_time = datetime.now(timezone.utc)
        
        # Get location coordinates
        current_location = self.get_transaction_location(transaction)
        
        # Get recent transactions for this card
        recent_txns = [t for t in self.transaction_history[card_number] 
                      if current_time - t['time'] < self.HISTORY_WINDOW]
        
        fraud_reasons = []
        
        # Enhanced same-time different location check
        for txn in recent_txns:
            # Use absolute time difference (critical fix)
            time_diff = abs((current_time - txn['time']).total_seconds())
            distance = geodesic(current_location, txn['location']).km
            
            # Debug print
            print(f"Card: {card_number[-4:]} - Checking against previous transaction:")
            print(f"  Current time: {current_time}, Previous time: {txn['time']}")
            print(f"  Time difference: {time_diff} seconds")
            print(f"  Current location: {transaction.get('location', 'unknown')} {current_location}")
            print(f"  Previous location: {txn['location_name']} {txn['location']}")
            print(f"  Distance: {distance:.1f}km")
            
            # If transactions are within SAME_TIME_THRESHOLD and in different locations (>10km apart)
            if time_diff <= self.SAME_TIME_THRESHOLD.total_seconds() and distance > 10:
                fraud_reasons.append(
                    f"Same card used in {txn['location_name']} and {transaction.get('location', 'unknown')} "
                    f"within {time_diff:.0f} seconds (distance: {distance:.1f}km)"
                )
                print(f"FRAUD DETECTED: Same time different location - "
                     f"Time diff: {time_diff}s, Distance: {distance:.1f}km")
                     
            # Also check for impossible travel speed if not simultaneous
            elif time_diff > 0:  # Avoid division by zero
                # Calculate travel speed in km/h
                travel_speed = distance / (time_diff / 3600)
                print(f"  Travel speed: {travel_speed:.1f} km/h")
                
                # Only flag if significant distance and impossibly fast travel
                if distance > self.MIN_TRAVEL_DISTANCE and travel_speed > self.IMPOSSIBLE_TRAVEL_SPEED:
                    fraud_reasons.append(
                        f"Impossible travel speed: {travel_speed:.1f} km/h from {txn['location_name']} to "
                        f"{transaction.get('location', 'unknown')} (threshold: {self.IMPOSSIBLE_TRAVEL_SPEED} km/h)"
                    )
                    print(f"FRAUD DETECTED: Impossible travel speed - {travel_speed:.1f} km/h")
        
        # Store current transaction in history
        self.transaction_history[card_number].append({
            'time': current_time,
            'location': current_location,
            'location_name': transaction.get('location', 'unknown'),
            'transaction_id': transaction.get('transaction_id'),
            'amount': transaction.get('amount', 0)
        })
        
        # Debug output
        print(f"\nTransaction added to history for card {card_number[-4:]}:")
        print(f"Time: {current_time}")
        print(f"Location: {transaction.get('location', 'unknown')} ({current_location})")
        print(f"Amount: ₹{transaction.get('amount', 0):.2f}")
        
        # Print transaction history for debugging
        print(f"\nTransaction history for card {card_number[-4:]}:")
        for i, t in enumerate(self.transaction_history[card_number]):
            print(f"{i+1}. Time: {t['time']}, Location: {t['location_name']} ({t['location']}), "
                 f"Amount: ₹{t['amount']:.2f}")
        
        return bool(fraud_reasons), "; ".join(fraud_reasons)
    
    def get_transaction_location(self, transaction):
        """Get coordinates from transaction data"""
        if ('latitude' in transaction and 'longitude' in transaction and 
            transaction['latitude'] is not None and transaction['longitude'] is not None):
            return (transaction['latitude'], transaction['longitude'])
        
        location_name = transaction.get('location', '')
        if location_name in self.city_coordinates:
            return self.city_coordinates[location_name]
        
        try:
            location = self.geolocator.geocode(location_name)
            if location:
                self.city_coordinates[location_name] = (location.latitude, location.longitude)
                return (location.latitude, location.longitude)
        except Exception as e:
            print(f"Error geocoding {location_name}: {e}")
        
        return (19.0760, 72.8777)
    def __init__(self):
        self.transaction_history = defaultdict(list)
        self.geolocator = Nominatim(user_agent="fraud_detection_system")
        
        self.city_coordinates = {
            'Mumbai': (19.0760, 72.8777),
            'Delhi': (28.6139, 77.2090),
            'Bangalore': (12.9716, 77.5946),
            'Hyderabad': (17.3850, 78.4867),
            'Chennai': (13.0827, 80.2707),
            'Kolkata': (22.5726, 88.3639),
            'Pune': (18.5204, 73.8567)
        }
        
        # Adjusted thresholds
        self.SAME_TIME_THRESHOLD = timedelta(minutes=1)  # More strict threshold
        self.IMPOSSIBLE_TRAVEL_SPEED = 500  # km/h
        self.MIN_TRAVEL_DISTANCE = 50  # km
        self.HISTORY_WINDOW = timedelta(hours=24)

    def check_fraud(self, transaction):
        card_number = transaction['card_number']
        
        # Parse transaction date
        try:
            if isinstance(transaction['transaction_date'], str):
                current_time = datetime.fromisoformat(transaction['transaction_date'].replace('Z', '+00:00'))
            else:
                current_time = transaction['transaction_date']
        except Exception as e:
            print(f"Error parsing transaction date: {e}")
            current_time = datetime.now(timezone.utc)
        
        # Get location coordinates
        current_location = self.get_transaction_location(transaction)
        
        # Get recent transactions for this card
        recent_txns = [t for t in self.transaction_history[card_number] 
                      if current_time - t['time'] < self.HISTORY_WINDOW]
        
        fraud_reasons = []
        
        # Enhanced same-time different location check
        for txn in recent_txns:
            time_diff = abs((current_time - txn['time']).total_seconds())
            distance = geodesic(current_location, txn['location']).km
            
            # If transactions are within 1 minute and >50km apart
            if (time_diff <= self.SAME_TIME_THRESHOLD.total_seconds() and 
                distance > self.MIN_TRAVEL_DISTANCE):
                fraud_reasons.append(
                    f"Same card used in {txn['location_name']} and {transaction.get('location', 'unknown')} "
                    f"within {time_diff:.0f} seconds (distance: {distance:.1f}km)"
                )
                print(f"FRAUD DETECTED: Same time different location - "
                     f"Time diff: {time_diff}s, Distance: {distance:.1f}km")
        
        # Store current transaction in history
        self.transaction_history[card_number].append({
            'time': current_time,
            'location': current_location,
            'location_name': transaction.get('location', 'unknown'),
            'transaction_id': transaction.get('transaction_id'),
            'amount': transaction.get('amount', 0)
        })
        
        # Debug output
        print(f"\nTransaction added to history for card {card_number[-4:]}:")
        print(f"Time: {current_time}")
        print(f"Location: {transaction.get('location', 'unknown')} ({current_location})")
        print(f"Amount: ₹{transaction.get('amount', 0):.2f}")
        
        # Print transaction history for debugging
        print(f"\nTransaction history for card {card_number[-4:]}:")
        for i, t in enumerate(self.transaction_history[card_number]):
            print(f"{i+1}. Time: {t['time']}, Location: {t['location_name']} ({t['location']}), "
                 f"Amount: ₹{t['amount']:.2f}")
        
        return bool(fraud_reasons), "; ".join(fraud_reasons)
    
    def get_transaction_location(self, transaction):
        """Get coordinates from transaction data"""
        if ('latitude' in transaction and 'longitude' in transaction and 
            transaction['latitude'] is not None and transaction['longitude'] is not None):
            return (transaction['latitude'], transaction['longitude'])
        
        location_name = transaction.get('location', '')
        if location_name in self.city_coordinates:
            return self.city_coordinates[location_name]
        
        try:
            location = self.geolocator.geocode(location_name)
            if location:
                self.city_coordinates[location_name] = (location.latitude, location.longitude)
                return (location.latitude, location.longitude)
        except Exception as e:
            print(f"Error geocoding {location_name}: {e}")
        
        return (19.0760, 72.8777)  # Default to Mumbai coordinates

# --- Data Preprocessing ---
def load_and_preprocess_data(csv_path):
    """
    Load transaction data and prepare it for model training
    """
    print(f"Loading data from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    # Print the columns to understand the data structure
    print("Columns in the dataset:", df.columns.tolist())
    
    # Convert transaction_date to datetime
    if 'transaction_date' in df.columns:
        df['transaction_date'] = pd.to_datetime(df['transaction_date'])
    
    # Feature engineering
    df = create_fraud_features(df)
    
    return df

def get_lat_lon_from_city(city_name):
    """
    Get latitude and longitude of a city using Geopy Nominatim geocoder.
    """
    if hasattr(real_time_detector, 'city_coordinates') and city_name in real_time_detector.city_coordinates:
        return real_time_detector.city_coordinates[city_name]
        
    try:
        location = real_time_detector.geolocator.geocode(city_name)
        if location:
            return location.latitude, location.longitude
    except:
        pass
    return None, None

def create_fraud_features(df):
    """
    Create features for detecting location-time based fraud
    """
    # Sort by card_number and transaction_date
    df = df.sort_values(['card_number', 'transaction_date'])
    
    # Initialize new features
    df['time_since_last_txn'] = 0.0
    df['distance_from_last_txn'] = 0.0
    df['speed_between_txns'] = 0.0
    df['location_changes_24h'] = 0
    df['unique_locations_24h'] = 0
    
    # Calculate time and distance between transactions for each card_number
    for card_number in df['card_number'].unique():
        user_df = df[df['card_number'] == card_number]
        
        if len(user_df) <= 1:
            continue
        
        for i in range(1, len(user_df)):
            idx = user_df.index[i]
            prev_idx = user_df.index[i-1]
            
            # Time difference in hours
            time_diff = (user_df.iloc[i]['transaction_date'] - user_df.iloc[i-1]['transaction_date']).total_seconds() / 3600
            df.at[idx, 'time_since_last_txn'] = time_diff
            
            # Get latitude and longitude based on city name
            current_city = user_df.iloc[i]['location']
            prev_city = user_df.iloc[i-1]['location']
            
            current_lat, current_lon = get_lat_lon_from_city(current_city)
            prev_lat, prev_lon = get_lat_lon_from_city(prev_city)
            
            # Calculate distance between cities (in km) if valid coordinates are found
            if current_lat is not None and prev_lat is not None:
                loc1 = (prev_lat, prev_lon)
                loc2 = (current_lat, current_lon)
                distance = geodesic(loc1, loc2).kilometers
                df.at[idx, 'distance_from_last_txn'] = distance
                
                # Calculate speed (km/h)
                if time_diff > 0:
                    df.at[idx, 'speed_between_txns'] = distance / time_diff
            
            # Calculate location changes (last 24 hours)
            window_start = user_df.iloc[i]['transaction_date'] - timedelta(hours=24)
            prev_txns = user_df[(user_df['transaction_date'] >= window_start) & 
                              (user_df['transaction_date'] <= user_df.iloc[i]['transaction_date'])]
            
            df.at[idx, 'location_changes_24h'] = len(prev_txns)
            df.at[idx, 'unique_locations_24h'] = prev_txns['location'].nunique()
    
    # Create a fraud indicator (for training purposes)
    df['is_suspicious'] = ((df['speed_between_txns'] > 500) | 
                          (df['unique_locations_24h'] > 3)).astype(int)
    
    return df

# --- Model Training ---
def train_fraud_model(df):
    """
    Train a machine learning model to detect fraudulent transactions
    """
    # Select relevant features
    features = ['time_since_last_txn', 'distance_from_last_txn', 'speed_between_txns',
               'location_changes_24h', 'unique_locations_24h']
    X = df[features]
    y = df['is_suspicious']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    print("Training the fraud detection model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    train_accuracy = model.score(X_train_scaled, y_train)
    test_accuracy = model.score(X_test_scaled, y_test)
    print(f"Train accuracy: {train_accuracy:.4f}")
    print(f"Test accuracy: {test_accuracy:.4f}")
    
    # Save model and scaler
    joblib.dump(model, 'fraud_model.pkl')
    joblib.dump(scaler, 'scaler.pkl')
    
    return model, scaler

def load_model():
    global model, scaler, real_time_detector
    real_time_detector = RealTimeFraudDetector()
    
    if os.path.exists('fraud_model.pkl') and os.path.exists('scaler.pkl'):
        model = joblib.load('fraud_model.pkl')
        scaler = joblib.load('scaler.pkl')
        return True
    return False

# --- Enhanced CORS headers ---
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:5501')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# --- API Implementation ---
@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict_fraud():
    """
    Enhanced fraud prediction endpoint with proper error handling
    """
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        # Validate request
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Invalid content type. Expected application/json'
            }), 400

        data = request.get_json()
        
        # Print received data for debugging
        print(f"Received transaction data: {data}")
        
        # Required fields validation
        required_fields = {
            'card_number': str,
            'transaction_date': str,
            'amount': (int, float),
            'merchant': str,
            'category': str,
            'location': str  # Added location as required field
        }
        
        # Either latitude/longitude or location must be provided
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400

        # Type validation
        type_errors = []
        for field, expected_type in required_fields.items():
            if field in data and not isinstance(data[field], expected_type):
                if isinstance(expected_type, tuple):
                    if not any(isinstance(data[field], t) for t in expected_type):
                        type_errors.append(f'{field} should be one of {[t.__name__ for t in expected_type]}')
                else:
                    type_errors.append(f'{field} should be {expected_type.__name__}')
        
        if type_errors:
            return jsonify({
                'success': False,
                'error': f'Type errors: {"; ".join(type_errors)}'
            }), 400

        # Generate transaction ID if not provided
        if 'transaction_id' not in data:
            data['transaction_id'] = f"TX{int(time.time() * 1000)}"
        
        # Get coordinates from location if not provided
        if ('latitude' not in data or 'longitude' not in data) and 'location' in data:
            location_name = data['location']
            lat, lon = real_time_detector.get_coordinates(location_name)
            data['latitude'] = lat
            data['longitude'] = lon
            print(f"Set coordinates for {location_name}: ({lat}, {lon})")

        # Real-time fraud detection
        is_rt_fraud, rt_reason = real_time_detector.check_fraud(data)
        
        # ML model prediction - FIXED FEATURE NAMES WARNING
        ml_probability = 0.0
        ml_reason = ""
        if model and scaler:
            try:
                features = extract_transaction_features(data)
                # Convert to DataFrame with correct feature names to prevent warning
                feature_names = [
                    'time_since_last_txn', 
                    'distance_from_last_txn', 
                    'speed_between_txns',
                    'location_changes_24h', 
                    'unique_locations_24h'
                ]
                features_df = pd.DataFrame([features], columns=feature_names)
                features_scaled = scaler.transform(features_df)
                ml_probability = model.predict_proba(features_scaled)[0, 1]
                
                if ml_probability > 0.7:
                    ml_reason = (
                        f"High fraud probability ({ml_probability*100:.1f}%). "
                        f"Patterns detected: {model.predict(features_scaled)[0]}"
                    )
            except Exception as e:
                app.logger.error(f"Model prediction error: {str(e)}")
                ml_reason = "Model evaluation incomplete"

        # Combine results
        is_fraud = is_rt_fraud or (ml_probability > 0.7)
        reasons = []
        
        if is_rt_fraud and rt_reason:
            reasons.append(rt_reason)
        if ml_probability > 0.7 and ml_reason:
            reasons.append(ml_reason)
        
        # Add a default reason if none provided but fraud detected
        if is_fraud and not reasons:
            reasons.append("Suspicious transaction pattern detected")
        
        # Fraud alert handling
        alert_details = None
        if is_fraud:
            alert_details = send_fraud_alert(data, reasons)
            app.logger.info(f"Fraud alert generated for transaction {data['transaction_id']}")

        # Prepare response with FIXED DATETIME WARNING
        response = {
            'success': True,
            'data': {
                'is_fraud': bool(is_fraud),
                'fraud_probability': float(ml_probability),
                'reasons': reasons,
                'transaction_id': data['transaction_id'],
                'alert_generated': bool(is_fraud),
                'alert_details': alert_details,
                'timestamp': datetime.now(timezone.utc).isoformat() + "Z"
            }
        }

        return jsonify(response)

    except Exception as e:
        app.logger.error(f"Unexpected error in /predict: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'details': str(e)
        }), 500

def extract_transaction_features(transaction_data):
    """
    Extract features from a single transaction for prediction
    """
    features = {
        'time_since_last_txn': 0,
        'distance_from_last_txn': 0,
        'speed_between_txns': 0,
        'location_changes_24h': 0,
        'unique_locations_24h': 0
    }
    
    card_number = transaction_data['card_number']
    
    if isinstance(transaction_data['transaction_date'], str):
        current_time = datetime.fromisoformat(transaction_data['transaction_date'].replace('Z', '+00:00'))
    else:
        current_time = transaction_data['transaction_date']
    
    # Get coordinates
    if 'latitude' in transaction_data and transaction_data['latitude'] is not None:
        current_location = (transaction_data['latitude'], transaction_data['longitude'])
    else:
        # Get from city name
        location_name = transaction_data.get('location', '')
        current_location = real_time_detector.get_coordinates(location_name)
    
    # Get recent transactions (last 24 hours)
    recent_txns = [t for t in real_time_detector.transaction_history.get(card_number, [])
                  if (current_time - t['time']) < timedelta(hours=24)]
    
    if recent_txns:
        # Time and distance features
        last_txn = max(recent_txns, key=lambda x: x['time'])
        features['time_since_last_txn'] = (current_time - last_txn['time']).total_seconds() / 3600
        features['distance_from_last_txn'] = geodesic(current_location, last_txn['location']).km
        
        if features['time_since_last_txn'] > 0:
            features['speed_between_txns'] = features['distance_from_last_txn'] / features['time_since_last_txn']
        
        # Location pattern features
        features['location_changes_24h'] = len(recent_txns)
        features['unique_locations_24h'] = len(set((t['location'][0], t['location'][1]) for t in recent_txns))
    
    return list(features.values())

def send_fraud_alert(transaction, reasons):
    """
    Send fraud alert (implement your actual alert mechanism here)
    """
    alert_message = f"""
    FRAUD ALERT!
    Transaction ID: {transaction.get('transaction_id', 'N/A')}
    Card Number: {transaction['card_number'][-4:]}
    Amount: {transaction.get('amount', 0):.2f}
    Time: {transaction['transaction_date']}
    Location: {transaction.get('location', 'N/A')}
    
    Reasons:
    - """ + "\n- ".join(reasons)
    
    print("\n" + "="*50)
    print(alert_message)
    print("="*50 + "\n")
    
    # Here you would implement actual alert sending:
    # - Email to customer
    # - SMS notification
    # - In-app notification
    # - Log to database
    
    return {
        "alert_id": f"ALERT-{int(time.time())}",
        "alert_type": "fraud_detection",
        "alert_time": datetime.now(timezone.utc).isoformat() + "Z"
    }

# --- Main Function ---
def main():
    """
    Main function to run the fraud detection system
    """
    # Initialize real-time detector
    global real_time_detector
    real_time_detector = RealTimeFraudDetector()
    
    # Check if model already exists
    if not load_model():
        try:
            # Try multiple potential paths for the data file
            potential_paths = [
                'data.csv',  
                './data.csv',
                './backend/data.csv',
                '../data.csv',
                os.path.join(os.getcwd(), 'data.csv')
            ]
            
            csv_path = None
            for path in potential_paths:
                if os.path.exists(path):
                    csv_path = path
                    break
            
            if csv_path:
                print(f"Found data file at: {csv_path}")
                df = load_and_preprocess_data(csv_path)
                train_fraud_model(df)
            else:
                print("Could not find data file. Continuing with real-time detection only.")
        except Exception as e:
            print(f"Error training model: {e}")
            print("Continuing with real-time detection only")
        finally:
            load_model()
    
    # Start the API server
    print("Starting the API server...")
    app.run(host='0.0.0.0', port=5000, debug=True)

if __name__ == "__main__":
    main()