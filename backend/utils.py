from datetime import datetime, timezone, timedelta
from geopy.distance import geodesic

def extract_transaction_features(transaction_data, real_time_detector):
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
        current_location = real_time_detector.get_transaction_location(location_name)
    
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
        "alert_id": f"ALERT-{int(datetime.now().timestamp())}",
        "alert_type": "fraud_detection",
        "alert_time": datetime.now(timezone.utc).isoformat() + "Z"
    }