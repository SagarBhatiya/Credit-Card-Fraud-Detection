import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
from datetime import timedelta
from geopy.distance import geodesic

def load_and_preprocess_data(csv_path, real_time_detector):
    """
    Load transaction data and prepare it for model training
    """
    print(f"Loading data from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    print("Columns in the dataset:", df.columns.tolist())
    
    if 'transaction_date' in df.columns:
        df['transaction_date'] = pd.to_datetime(df['transaction_date'])
    

    df = create_fraud_features(df, real_time_detector)
    
    return df

def get_lat_lon_from_city(city_name, real_time_detector):
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

def create_fraud_features(df, real_time_detector):
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
    
    for card_number in df['card_number'].unique():
        user_df = df[df['card_number'] == card_number]
        
        if len(user_df) <= 1:
            continue
        
        for i in range(1, len(user_df)):
            idx = user_df.index[i]
            prev_idx = user_df.index[i-1]
            
            time_diff = (user_df.iloc[i]['transaction_date'] - user_df.iloc[i-1]['transaction_date']).total_seconds() / 3600
            df.at[idx, 'time_since_last_txn'] = time_diff
            
            current_city = user_df.iloc[i]['location']
            prev_city = user_df.iloc[i-1]['location']
            
            current_lat, current_lon = get_lat_lon_from_city(current_city, real_time_detector)
            prev_lat, prev_lon = get_lat_lon_from_city(prev_city, real_time_detector)
            
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