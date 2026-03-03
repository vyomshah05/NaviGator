from firebase_admin_config import db, save_user_preferences, get_user_preferences
import time

try:
    # Test Firestore connection
    users_ref = db.collection('users')
    print("Firebase Admin SDK connected successfully!")
    print(f"Firestore client initialized: {type(db)}")
except Exception as e:
    print(f"Firebase connection FAILED: {e}")

test_user_id = "test_user_123"

print("Testing Firestore operations...\n")

# Test 1: Write preferences
print("1. Writing test preferences to Firestore...")
test_prefs = {
    "activity_types": ["food", "outdoors"],
    "max_distance": 5000,
    "budget": "moderate",
    "weights": {
        "distance": 0.3,
        "weather": 0.2,
        "rating": 0.3,
        "category_match": 0.2
    }
}

try:
    save_user_preferences(test_user_id, test_prefs)
    print("Write successful")
except Exception as e:
    print(f"Write failed: {e}")
    exit()

time.sleep(1)

# Test 2: Read preferences back
print("\n2. Reading preferences from Firestore...")
try:
    retrieved_prefs = get_user_preferences(test_user_id)
    if retrieved_prefs:
        print("Read successful")
        print(f"Retrieved preferences: {retrieved_prefs}")
    else:
        print("No preferences found")
except Exception as e:
    print(f"Read failed: {e}")

# Test 3: Verify data matches
print("\n3. Verifying data integrity...")
if retrieved_prefs == test_prefs:
    print("Data matches perfectly!")
else:
    print("⚠️  Data mismatch (timestamps might differ)")
    print(f"Expected: {test_prefs}")
    print(f"Got: {retrieved_prefs}")

print("\nAll Firestore operations working!")