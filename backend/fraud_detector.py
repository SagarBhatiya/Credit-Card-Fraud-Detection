from collections import defaultdict
from datetime import datetime, timezone, timedelta
from geopy.distance import geodesic
from geopy.geocoders import Nominatim

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
        self.SAME_TIME_THRESHOLD = timedelta(minutes=1)  # More strict threshold
        self.IMPOSSIBLE_TRAVEL_SPEED = 500  # km/h
        self.MIN_TRAVEL_DISTANCE = 50  # km
        self.HISTORY_WINDOW = timedelta(hours=24)

    def check_fraud(self, transaction):
        card_number = transaction['card_number']
        
        try:
            if isinstance(transaction['transaction_date'], str):
                current_time = datetime.fromisoformat(transaction['transaction_date'].replace('Z', '+00:00'))
            else:
                current_time = transaction['transaction_date']
        except Exception as e:
            print(f"Error parsing transaction date: {e}")
            current_time = datetime.now(timezone.utc)
        
       
        current_location = self.get_transaction_location(transaction)
        
      
        recent_txns = [t for t in self.transaction_history[card_number] 
                      if current_time - t['time'] < self.HISTORY_WINDOW]
        
        fraud_reasons = []
        
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
        
        self.transaction_history[card_number].append({
            'time': current_time,
            'location': current_location,
            'location_name': transaction.get('location', 'unknown'),
            'transaction_id': transaction.get('transaction_id'),
            'amount': transaction.get('amount', 0)
        })
        
        # debugging
        print(f"\nTransaction added to history for card {card_number[-4:]}:")
        print(f"Time: {current_time}")
        print(f"Location: {transaction.get('location', 'unknown')} ({current_location})")
        print(f"Amount: ₹{transaction.get('amount', 0):.2f}")
        
     
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
        
        return (19.0760, 72.8777)  # mumbai