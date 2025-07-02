# models/user.py - User Model
import uuid
import bcrypt
from datetime import datetime
from config.database import get_db_connection

class User:
    def __init__(self, email, first_name, last_name, company=None, industry=None):
        self.id = str(uuid.uuid4())
        self.email = email.lower()
        self.first_name = first_name
        self.last_name = last_name
        self.company = company
        self.industry = industry
        self.is_active = True
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
    
    def set_password(self, password):
        """Hash and set password"""
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def check_password(self, password):
        """Verify password"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def save(self):
        """Save user to database"""
        with get_db_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("""
                INSERT INTO users (id, email, password_hash, first_name, last_name, company, industry, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (self.id, self.email, self.password_hash, self.first_name, self.last_name, 
                  self.company, self.industry, self.is_active))
            connection.commit()
    
    @staticmethod
    def find_by_email(email):
        """Find user by email"""
        with get_db_connection() as connection:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT * FROM users WHERE email = %s", (email.lower(),))
            result = cursor.fetchone()
            if result:
                user = User.__new__(User)
                for key, value in result.items():
                    setattr(user, key, value)
                return user
            return None
    
    @staticmethod
    def find_by_id(user_id):
        """Find user by ID"""
        with get_db_connection() as connection:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            result = cursor.fetchone()
            if result:
                user = User.__new__(User)
                for key, value in result.items():
                    setattr(user, key, value)
                return user
            return None
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'company': self.company,
            'industry': self.industry,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else str(self.created_at),
            'updated_at': self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else str(self.updated_at)
        }