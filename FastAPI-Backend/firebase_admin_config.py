import os
import firebase_admin
from firebase_admin import credentials, firestore, auth
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase Admin SDK
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

# Firestore client
db = firestore.client()

def verify_token(id_token: str):
    """Verify Firebase ID token from frontend"""
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token['uid']
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None

def get_user_preferences(user_id: str):
    """Get user preferences from Firestore"""
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if user_doc.exists:
        data = user_doc.to_dict()
        return data.get('preferences', {})
    return None

def save_user_preferences(user_id: str, preferences: dict):
    """Save user preferences to Firestore"""
    user_ref = db.collection('users').document(user_id)
    user_ref.set({
        'preferences': preferences,
        'updatedAt': firestore.SERVER_TIMESTAMP
    }, merge=True)

def save_activity_rating(user_id: str, activity_data: dict):
    """Save activity rating to user's history"""
    activity_ref = db.collection('users').document(user_id)\
                     .collection('activityHistory').document()
    
    activity_ref.set({
        **activity_data,
        'completedAt': firestore.SERVER_TIMESTAMP
    })

def get_activity_history(user_id: str, limit: int = 50):
    """Get user's activity history"""
    activities = db.collection('users').document(user_id)\
                   .collection('activityHistory')\
                   .order_by('completedAt', direction=firestore.Query.DESCENDING)\
                   .limit(limit).stream()
    
    return [activity.to_dict() for activity in activities]