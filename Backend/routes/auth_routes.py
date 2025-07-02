# routes/auth_routes.py - Authentication Routes
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
import re
from models.user import User
from utils.validators import validate_email, validate_password
from config.database import get_db_connection
import uuid, json, os

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate email format
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength
        password_error = validate_password(data['password'])
        if password_error:
            return jsonify({'error': password_error}), 400
        
        # Check if user already exists
        if User.find_by_email(data['email']):
            return jsonify({'error': 'Email already registered'}), 409
        
        # Create new user
        user = User(
            email=data['email'],
            first_name=data['first_name'].strip(),
            last_name=data['last_name'].strip(),
            company=data.get('company', '').strip() or None,
            industry=data.get('industry', '').strip() or None
        )
        user.set_password(data['password'])
        user.save()
        
        # Create tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': 'Registration failed', 'details': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = User.find_by_email(data['email'])
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check if user is active
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Create tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Login failed', 'details': str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        current_user_id = get_jwt_identity()
        user = User.find_by_id(current_user_id)
        
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 404
        
        access_token = create_access_token(identity=current_user_id)
        return jsonify({'access_token': access_token}), 200
        
    except Exception as e:
        return jsonify({'error': 'Token refresh failed', 'details': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        current_user_id = get_jwt_identity()
        user = User.find_by_id(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch profile', 'details': str(e)}), 500

# --- Update Profile ---
@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.get_json()
    with get_db_connection() as db:
        cursor = db.cursor()
        cursor.execute("""
            UPDATE users SET
              first_name = %s,
              last_name = %s,
              company = %s,
              industry = %s,
              updated_at = NOW()
            WHERE id = %s
        """, (
            data.get('first_name'),
            data.get('last_name'),
            data.get('company'),
            data.get('industry'),
            user_id
        ))
        db.commit()
    return jsonify({"message": "Profile updated successfully"}), 200


# --- Set Preferences ---
@auth_bp.route('/preferences', methods=['POST'])
@jwt_required()
def set_preferences():
    user_id = get_jwt_identity()
    raw_data = request.get_json()  # flat object from frontend

    # Step 1: Group keys by document type
    grouped = {
        "NDA": {},
        "SOW": {},
        "Freelancer Agreement": {},
        "Service Agreement": {}
    }

    for key, value in raw_data.items():
        if key.startswith("nda_"):
            grouped["NDA"][key] = value
        elif key.startswith("sow_"):
            grouped["SOW"][key] = value
        elif key.startswith("freelancer_"):
            grouped["Freelancer Agreement"][key] = value
        elif key.startswith("service_"):
            grouped["Service Agreement"][key] = value

    # Step 2: Insert or update each group
    with get_db_connection() as db:
        cursor = db.cursor()

        for doc_type, prefs in grouped.items():
            if not prefs:
                continue

            cursor.execute("SELECT id FROM document_types WHERE name = %s", (doc_type,))
            doc = cursor.fetchone()
            if not doc:
                cursor.execute("INSERT INTO document_types (name) VALUES (%s)", (doc_type,))
                db.commit()
                cursor.execute("SELECT id FROM document_types WHERE name = %s", (doc_type,))
                doc = cursor.fetchone()

            doc_type_id = doc[0]

            # UPSERT
            cursor.execute("""
                INSERT INTO user_preferences (id, user_id, document_type_id, preferences)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE preferences = VALUES(preferences), updated_at = NOW()
            """, (str(uuid.uuid4()), user_id, doc_type_id, json.dumps(prefs)))

        db.commit()

    return jsonify({"message": "Preferences updated"}), 200



# --- Get Preferences ---
@auth_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_preferences():
    user_id = get_jwt_identity()

    with get_db_connection() as db:
        cursor = db.cursor(dictionary=True)

        # Join preferences with document type names
        cursor.execute("""
            SELECT dt.name AS document_type, up.preferences
            FROM user_preferences up
            JOIN document_types dt ON up.document_type_id = dt.id
            WHERE up.user_id = %s
        """, (user_id,))
        
        rows = cursor.fetchall()
        preferences = {}

        for row in rows:
            preferences[row['document_type']] = row['preferences']

        return jsonify({"preferences": preferences}), 200