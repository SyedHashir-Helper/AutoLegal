# models/contract.py - Contract Model
import uuid
from datetime import datetime
from config.database import get_db_connection

class Contract:
    def __init__(self, title, filename, file_path, file_size, file_type, user_id):
        self.id = str(uuid.uuid4())
        self.title = title
        self.filename = filename
        self.file_path = file_path
        self.file_size = file_size
        self.file_type = file_type
        self.content_text = None
        self.upload_status = 'uploaded'
        self.user_id = user_id
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.document_type_id = ''
    
    def save(self):
        """Save contract to database"""
        with get_db_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("""
                INSERT INTO contracts (id, title, filename, file_path, file_size, file_type, 
                                     content_text, upload_status, user_id, document_type_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (self.id, self.title, self.filename, self.file_path, self.file_size,
                  self.file_type, self.content_text, self.upload_status, self.user_id, self.document_type_id))
            connection.commit()
    
    def update(self):
        """Update contract in database"""
        with get_db_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("""
                UPDATE contracts SET title = %s, content_text = %s, upload_status = %s,
                                   updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (self.title, self.content_text, self.upload_status, self.id))
            connection.commit()
    
    @staticmethod
    def find_by_id(contract_id):
        """Find contract by ID"""
        with get_db_connection() as connection:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT * FROM contracts WHERE id = %s", (contract_id,))
            result = cursor.fetchone()
            if result:
                contract = Contract.__new__(Contract)
                for key, value in result.items():
                    setattr(contract, key, value)
                return contract
            return None
    
    @staticmethod
    def find_by_user_id(user_id, limit=10, offset=0):
        """Find contracts by user ID with pagination"""
        with get_db_connection() as connection:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("""
                SELECT * FROM contracts WHERE user_id = %s 
                ORDER BY created_at DESC LIMIT %s OFFSET %s
            """, (user_id, limit, offset))
            results = cursor.fetchall()
            contracts = []
            for result in results:
                contract = Contract.__new__(Contract)
                for key, value in result.items():
                    setattr(contract, key, value)
                contracts.append(contract)
            return contracts
    
    @staticmethod
    def get_user_stats(user_id):
        """Get contract statistics for user"""
        with get_db_connection() as connection:
            cursor = connection.cursor(dictionary=True)
            
            # Total contracts
            cursor.execute("SELECT COUNT(*) as total FROM contracts WHERE user_id = %s", (user_id,))
            total = cursor.fetchone()['total']
            
            # Status counts
            cursor.execute("""
                SELECT upload_status, COUNT(*) as count 
                FROM contracts WHERE user_id = %s 
                GROUP BY upload_status
            """, (user_id,))
            status_counts = {row['upload_status']: row['count'] for row in cursor.fetchall()}
            
            # Total file size
            cursor.execute("SELECT SUM(file_size) as total_size FROM contracts WHERE user_id = %s", (user_id,))
            total_size = cursor.fetchone()['total_size'] or 0
            
            return {
                'total_contracts': total,
                'completed_contracts': status_counts.get('completed', 0),
                'processing_contracts': status_counts.get('processing', 0),
                'failed_contracts': status_counts.get('failed', 0),
                'total_size_bytes': total_size
            }
    
    def delete(self):
        """Delete contract from database"""
        with get_db_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("DELETE FROM contracts WHERE id = %s", (self.id,))
            connection.commit()
    
    def to_dict(self):
        """Convert contract to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'filename': self.filename,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'upload_status': self.upload_status,
            'has_content': bool(self.content_text),
            'analysis_count': 0,  # TODO: Implement analysis count
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else str(self.created_at),
            'updated_at': self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else str(self.updated_at)
        }

    @staticmethod
    def find_all_by_user_id(user_id):
        """Find all contracts by user ID without pagination"""
        with get_db_connection() as connection:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("""
                SELECT * FROM contracts WHERE user_id = %s 
                ORDER BY created_at DESC
            """, (user_id,))
            results = cursor.fetchall()
            contracts = []
            for result in results:
                contract = Contract.__new__(Contract)
                for key, value in result.items():
                    setattr(contract, key, value)
                contracts.append(contract)
            return contracts