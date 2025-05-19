from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import joblib
from datetime import datetime, timezone
import time

from fraud_detector import RealTimeFraudDetector
from utils import extract_transaction_features, send_fraud_alert
from model import load_and_preprocess_data, train_fraud_model

# Global Variables 
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

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:5501')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# API 
@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict_fraud():
    """
    Enhanced fraud prediction endpoint with proper error handling
    """
    
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        # Validation
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Invalid content type. Expected application/json'
            }), 400

        data = request.get_json()
        
        
        print(f"Received transaction data: {data}")
        
        # Required fields validation
        required_fields = {
            'card_number': str,
            'transaction_date': str,
            'amount': (int, float),
            'merchant': str,
            'category': str,
            'location': str  
        }
        
        
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

        
        if 'transaction_id' not in data:
            data['transaction_id'] = f"TX{int(time.time() * 1000)}"
        
       
        if ('latitude' not in data or 'longitude' not in data) and 'location' in data:
            location_name = data['location']
            lat, lon = real_time_detector.get_transaction_location(location_name)
            data['latitude'] = lat
            data['longitude'] = lon
            print(f"Set coordinates for {location_name}: ({lat}, {lon})")

        # Real-time fraud detection
        is_rt_fraud, rt_reason = real_time_detector.check_fraud(data)
        
        # ML model prediction 
        ml_probability = 0.0
        ml_reason = ""
        if model and scaler:
            try:
                features = extract_transaction_features(data, real_time_detector)
                import pandas as pd
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

        is_fraud = is_rt_fraud or (ml_probability > 0.7)
        reasons = []
        
        if is_rt_fraud and rt_reason:
            reasons.append(rt_reason)
        if ml_probability > 0.7 and ml_reason:
            reasons.append(ml_reason)
            
        if is_fraud and not reasons:
            reasons.append("Suspicious transaction pattern detected")
        
        alert_details = None
        if is_fraud:
            alert_details = send_fraud_alert(data, reasons)
            app.logger.info(f"Fraud alert generated for transaction {data['transaction_id']}")

       
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

def load_model():
    global model, scaler, real_time_detector
    real_time_detector = RealTimeFraudDetector()
    
    if os.path.exists('fraud_model.pkl') and os.path.exists('scaler.pkl'):
        model = joblib.load('fraud_model.pkl')
        scaler = joblib.load('scaler.pkl')
        return True
    return False

# Main Function 
def main():
    """
    Main function to run the fraud detection system
    """
    # Initialize real-time detector
    global real_time_detector
    real_time_detector = RealTimeFraudDetector()
    
  
    if not load_model():
        try:
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
                df = load_and_preprocess_data(csv_path, real_time_detector)
                model, scaler = train_fraud_model(df)
            else:
                print("Could not find data file. Continuing with real-time detection only.")
        except Exception as e:
            print(f"Error training model: {e}")
            print("Continuing with real-time detection only")
        finally:
            load_model()
    
    print("Starting the API server...")
    app.run(host='0.0.0.0', port=5000, debug=True)

if __name__ == "__main__":
    main()