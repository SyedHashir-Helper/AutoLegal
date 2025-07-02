# routes/upload_routes.py - File Upload Routes
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os, uuid, json
import uuid
from models.contract import Contract
from services.text_extractor import extract_text_from_file
from utils.file_utils import allowed_file
from services.groq_client import GroqClient
from config.database import get_db_connection
from document_classifier.predict import predict_document_type

upload_bp = Blueprint('upload', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}

@upload_bp.route('/contract', methods=['POST'])
@jwt_required()
def upload_contract():
    """Upload contract file and analyze it using Groq AI"""
    try:
        current_user_id = get_jwt_identity()

        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename, ALLOWED_EXTENSIONS):
            return jsonify({
                'error': 'File type not allowed',
                'allowed_types': list(ALLOWED_EXTENSIONS)
            }), 400

        title = request.form.get('title', '').strip() or os.path.splitext(file.filename)[0]
        file_extension = os.path.splitext(file.filename)[1].lower()
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)

        file.save(file_path)
        file_size = os.path.getsize(file_path)
        file_type = file_extension[1:]

        # Create DB record for contract
        contract = Contract(
            title=title,
            filename=file.filename,
            file_path=file_path,
            file_size=file_size,
            file_type=file_type,
            user_id=current_user_id
        )

        try:
            contract.upload_status = 'processing'
            contract.update()

            extracted_text = extract_text_from_file(file_path, file_type)
            contract.content_text = extracted_text or ''

            # Predict document type
            document_type_name = str(predict_document_type(extracted_text)) if extracted_text else ''
            contract.document_type = document_type_name
            print(document_type_name)
            contract.upload_status = 'completed' if extracted_text else 'failed'
            contract.update()

            if not extracted_text:
                return jsonify({'error': 'Text extraction failed'}), 500

            # === Fetch Preferences for the Document Type ===
            with get_db_connection() as db:
                cursor = db.cursor(dictionary=True)

                # Get or insert document_type_id
                cursor.execute("SELECT id FROM document_types WHERE name = %s", (document_type_name,))
                doc = cursor.fetchone()
                if not doc:
                    cursor.execute("INSERT INTO document_types (name) VALUES (%s)", (document_type_name,))
                    db.commit()
                    cursor.execute("SELECT id FROM document_types WHERE name = %s", (document_type_name,))
                    doc = cursor.fetchone()
                document_type_id = doc["id"]
                contract.document_type_id = document_type_id
                contract.save()
                print("Contract Saved")

                # Get preferences for the user and doc type
                cursor.execute("""
                    SELECT preferences FROM user_preferences 
                    WHERE user_id = %s AND document_type_id = %s
                """, (current_user_id, document_type_id))
                row = cursor.fetchone()
                preferences = json.loads(row["preferences"]) if row else {}

                # === Analyze with Groq AI ===
                groq = GroqClient()
                analysis_result = groq.analyze_contract_risk(extracted_text, preferences)

                if not analysis_result:
                    return jsonify({'error': 'Contract uploaded but analysis failed'}), 202

                # Save analysis
                cursor.execute("""
                    INSERT INTO contract_analyses (
                        id, contract_id, analysis_type, risk_score, summary,
                        key_findings, recommendations, flagged_clauses,
                        analysis_status, created_at, updated_at
                    ) VALUES (
                        UUID(), %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                    )
                """, (
                    contract.id,
                    'full',
                    analysis_result.get('overall_risk_score', 0),
                    analysis_result.get('summary', ''),
                    json.dumps(analysis_result.get('key_findings', [])),
                    json.dumps(analysis_result.get('recommendations', [])),
                    json.dumps(analysis_result.get('categories', {})),
                    'completed'
                ))
                db.commit()

        except Exception as e:
            contract.upload_status = 'failed'
            contract.update()
            print(f"[Error] Text extraction or analysis failed: {e}")

        return jsonify({
            'message': 'Contract uploaded and analyzed',
            'contract': contract.to_dict()
        }), 201

    except Exception as e:
        if 'file_path' in locals() and os.path.exists(file_path):
            try: os.remove(file_path)
            except: pass
        return jsonify({'error': 'Upload failed', 'details': str(e)}), 500


@upload_bp.route('/contract/<contract_id>/content', methods=['GET'])
@jwt_required()
def get_contract_content(contract_id):
    """Get contract text content"""
    try:
        current_user_id = get_jwt_identity()
        contract = Contract.find_by_id(contract_id)
        
        if not contract or contract.user_id != current_user_id:
            return jsonify({'error': 'Contract not found'}), 404
        
        return jsonify({
            'contract_id': contract.id,
            'title': contract.title,
            'content': contract.content_text,
            'status': contract.upload_status,
            'word_count': len(contract.content_text.split()) if contract.content_text else 0
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve content', 'details': str(e)}), 500

@upload_bp.route('/contract/<contract_id>/download', methods=['GET'])
@jwt_required()
def download_contract(contract_id):
    """Download contract file"""
    try:
        current_user_id = get_jwt_identity()
        contract = Contract.find_by_id(contract_id)
        
        if not contract or contract.user_id != current_user_id:
            return jsonify({'error': 'Contract not found'}), 404
        
        if not os.path.exists(contract.file_path):
            return jsonify({'error': 'File not found on server'}), 404
        
        return send_file(
            contract.file_path,
            as_attachment=True,
            download_name=contract.filename
        )
        
    except Exception as e:
        return jsonify({'error': 'Download failed', 'details': str(e)}), 500