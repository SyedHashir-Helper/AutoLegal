# routes/contract_routes.py - Contract Management Routes
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.contract import Contract
from config.database import get_db_connection
contract_bp = Blueprint('contracts', __name__)
import json, os
import uuid
from services.text_extractor import extract_text_from_file
from utils.file_utils import allowed_file
from services.groq_client import GroqClient
from document_classifier.predict import predict_document_type
from document_generator.document_generator import DocumentGenerator

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}

@contract_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_contracts():
    try:
        user_id = get_jwt_identity()
        contracts = Contract.find_all_by_user_id(user_id)
        return jsonify({
            'contracts': [contract.to_dict() for contract in contracts]
        }), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch contracts', 'details': str(e)}), 500

@contract_bp.route('/', methods=['GET'])
@jwt_required()
def list_contracts():
    """List contracts for current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 50)
        
        offset = (page - 1) * per_page
        contracts = Contract.find_by_user_id(current_user_id, limit=per_page, offset=offset)
        
        return jsonify({
            'contracts': [contract.to_dict() for contract in contracts],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'has_next': len(contracts) == per_page,
                'has_prev': page > 1
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve contracts', 'details': str(e)}), 500

@contract_bp.route('/<contract_id>', methods=['GET'])
@jwt_required()
def get_contract(contract_id):
    """Get contract details"""
    try:
        current_user_id = get_jwt_identity()
        contract = Contract.find_by_id(contract_id)
        
        if not contract or contract.user_id != current_user_id:
            return jsonify({'error': 'Contract not found'}), 404
        
        contract_data = contract.to_dict()
        contract_data['analyses'] = []  # TODO: Implement analyses
        
        return jsonify({'contract': contract_data}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve contract', 'details': str(e)}), 500

@contract_bp.route('/<contract_id>', methods=['PUT'])
@jwt_required()
def update_contract(contract_id):
    """Update contract"""
    try:
        current_user_id = get_jwt_identity()
        contract = Contract.find_by_id(contract_id)
        
        if not contract or contract.user_id != current_user_id:
            return jsonify({'error': 'Contract not found'}), 404
        
        data = request.get_json()
        
        if 'title' in data:
            new_title = data['title'].strip()
            if not new_title:
                return jsonify({'error': 'Title cannot be empty'}), 400
            contract.title = new_title
        
        contract.update()
        
        return jsonify({
            'message': 'Contract updated successfully',
            'contract': contract.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to update contract', 'details': str(e)}), 500

@contract_bp.route('/<contract_id>', methods=['DELETE'])
@jwt_required()
def delete_contract(contract_id):
    """Delete contract"""
    try:
        current_user_id = get_jwt_identity()
        contract = Contract.find_by_id(contract_id)
        
        if not contract or contract.user_id != current_user_id:
            return jsonify({'error': 'Contract not found'}), 404
        
        # Delete file from disk
        import os
        if os.path.exists(contract.file_path):
            try:
                os.remove(contract.file_path)
            except Exception as e:
                print(f"Failed to delete file: {e}")
        
        contract.delete()
        
        return jsonify({'message': 'Contract deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to delete contract', 'details': str(e)}), 500

@contract_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_contract_stats():
    """Get contract statistics"""
    try:
        current_user_id = get_jwt_identity()
        stats = Contract.get_user_stats(current_user_id)
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve statistics', 'details': str(e)}), 500


@contract_bp.route('/<contract_id>/analysis', methods=['GET'])
@jwt_required()
def get_contract_analysis(contract_id):
    try:
        print(f"Fetching analysis for contract: {contract_id}")
        current_user_id = get_jwt_identity()
        print(f"Authenticated user: {current_user_id}")

        with get_db_connection() as db:
            cursor = db.cursor(dictionary=True)
            cursor.execute("""
                SELECT
                    analysis_type,
                    risk_score,
                    summary,
                    key_findings,
                    recommendations,
                    flagged_clauses,
                    analysis_status,
                    created_at
                FROM contract_analyses
                WHERE contract_id = %s
                ORDER BY created_at DESC
                LIMIT 1
            """, (contract_id,))
            result = cursor.fetchone()

        if not result:
            return jsonify({'message': 'No analysis found for this contract'}), 404

        print("[DEBUG] Raw result from DB:", result)

        return jsonify({
            'contract_id': contract_id,
            'analysis': {
                'analysis_type': result['analysis_type'],
                'risk_score': result['risk_score'],
                'summary': result['summary'],
                'key_findings': json.loads(result['key_findings']),
                'recommendations': json.loads(result['recommendations']),
                'flagged_clauses': json.loads(result['flagged_clauses']),
                'status': result['analysis_status'],
                'created_at': result['created_at']
            }
        }), 200

    except Exception as e:
        print("[ERROR] Failed to fetch analysis:", e)
        return jsonify({'error': 'Failed to fetch analysis', 'details': str(e)}), 500

@contract_bp.route('/compare', methods=['POST'])
@jwt_required()
def compare_contracts():
    user_id = get_jwt_identity()
    contract_id_a = request.form.get('contract_id_a')
    file_b = request.files.get('fileB')

    if not contract_id_a or not file_b:
        return jsonify({'error': 'Missing contract A or file B'}), 400

    # --- Get Contract A from DB ---
    with get_db_connection() as db:
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM contracts WHERE id = %s AND user_id = %s", (contract_id_a, user_id))
        contract_a = cursor.fetchone()
        if not contract_a:
            return jsonify({'error': 'Contract A not found'}), 404

    text_a = contract_a.get("content_text", "")
    if not text_a:
        return jsonify({'error': 'Contract A has no extracted text'}), 500

    # --- Save File B ---
    file_ext = os.path.splitext(file_b.filename)[1].lower()
    if file_ext[1:] not in ALLOWED_EXTENSIONS:
        return jsonify({'error': 'Unsupported file type'}), 400

    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], f"{uuid.uuid4()}{file_ext}")
    file_b.save(file_path)
    file_size = os.path.getsize(file_path)
    file_type = file_ext[1:]

    # --- Extract text from File B ---
    extracted_text_b = extract_text_from_file(file_path, file_type)
    if not extracted_text_b:
        return jsonify({'error': 'Text extraction from File B failed'}), 500

    # --- Predict document type of B ---
    document_type_name_b = str(predict_document_type(extracted_text_b)) if extracted_text_b else ''

    try:
        with get_db_connection() as db:
            cursor = db.cursor(dictionary=True)

            # --- Get document_type_id ---
            cursor.execute("SELECT id FROM document_types WHERE name = %s", (document_type_name_b,))
            doc = cursor.fetchone()
            if not doc:
                cursor.execute("INSERT INTO document_types (name) VALUES (%s)", (document_type_name_b,))
                db.commit()
                cursor.execute("SELECT id FROM document_types WHERE name = %s", (document_type_name_b,))
                doc = cursor.fetchone()
            document_type_id_b = doc['id']

            # === Validate Document Type ===
            if contract_a.get('document_type_id') != document_type_id_b:
                return jsonify({
                    'error': 'Document types do not match',
                    'details': f"Contract A is {contract_a.get('document_type')} but File B is {document_type_name_b}"
                }), 400
            print("Validate")
            # --- Save Contract B ---
            contract_b = Contract(
                title=os.path.splitext(file_b.filename)[0],
                filename=file_b.filename,
                file_path=file_path,
                file_size=file_size,
                file_type=file_type,
                user_id=user_id,
                )
            contract_b.content_text =extracted_text_b
            contract_b.document_type_id=str(document_type_id_b)
            print("Object Created")
            print("Contract Inserted Into DB")
            # cursor.execute("""
            #     INSERT INTO contracts (id, title, filename, file_path, file_size, file_type, 
            #                            content_text, document_type, document_type_id, upload_status, user_id)
            #     VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'completed', %s)
            # """, (
            #     contract_id_b,
            #     os.path.splitext(file_b.filename)[0],
            #     file_b.filename,
            #     file_path,
            #     file_size,
            #     file_type,
            #     extracted_text_b,
            #     document_type_name_b,
            #     document_type_id_b,
            #     user_id
            # ))
            
            # db.commit()

            # --- Get preferences for user and document type ---
            cursor.execute("""
                SELECT preferences FROM user_preferences 
                WHERE user_id = %s AND document_type_id = %s
            """, (user_id, document_type_id_b))
            row = cursor.fetchone()
            preferences = json.loads(row["preferences"]) if row else {}
            print("Analyzing B")

            # --- Analyze B using Groq ---
            groq = GroqClient()
            analysis_result = groq.analyze_contract_risk(extracted_text_b, preferences)

            if analysis_result:
                contract_b.upload_status = 'completed'
                contract_b.save()
                cursor.execute("""
                    INSERT INTO contract_analyses (
                        id, contract_id, analysis_type, risk_score, summary,
                        key_findings, recommendations, flagged_clauses,
                        analysis_status, created_at, updated_at
                    ) VALUES (
                        UUID(), %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                    )
                """, (
                    contract_b.id,
                    'full',
                    analysis_result.get('overall_risk_score', 0),
                    analysis_result.get('summary', ''),
                    json.dumps(analysis_result.get('key_findings', [])),
                    json.dumps(analysis_result.get('recommendations', [])),
                    json.dumps(analysis_result.get('categories', {})),
                    'completed'
                ))
                db.commit()
            
            

            print("Comparison Start")
            # --- Compare A and B ---
            comparison_result = groq.compare_contract_versions(text_a, extracted_text_b)
            if not comparison_result or 'summary' not in comparison_result or 'changes' not in comparison_result:
                return jsonify({'error': 'Comparison failed'}), 502
            print("Saving Comparison")
            # --- Save Comparison Entry ---
            comparison_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO contract_comparisons (id, contract_id_a, contract_id_b, summary, changes)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                comparison_id,
                contract_id_a,
                contract_b.id,
                comparison_result['summary'],
                json.dumps(comparison_result['changes'])
            ))
            db.commit()
            print("Commited Comparison")

            return jsonify({
                "message": "File uploaded, analyzed, and compared",
                "contract_id_a": contract_id_a,
                "contract_id_b": contract_b.id,
                "summary": comparison_result['summary'],
                "changes": comparison_result['changes'],
                "comparison_id": comparison_id
            }), 200

    except Exception as e:
        if os.path.exists(file_path):
            try: os.remove(file_path)
            except: pass
        return jsonify({'error': 'Internal error', 'details': str(e)}), 500


# --- Get All Comparisons (Slider Info) ---
@contract_bp.route('/comparisons', methods=['GET'])
@jwt_required()
def get_all_comparisons():
    user_id = get_jwt_identity()

    with get_db_connection() as db:
        cursor = db.cursor(dictionary=True)

        # Get comparisons with joined contract info
        cursor.execute("""
            SELECT cc.id AS comparison_id,
                   ca.title AS contract_a_title,
                   cb.title AS contract_b_title,
                   ca.id AS contract_a_id,
                   cb.id AS contract_b_id,
                   caa.risk_score AS contract_a_risk,
                   cab.risk_score AS contract_b_risk,
                   cc.created_at
            FROM contract_comparisons cc
            JOIN contracts ca ON cc.contract_id_a = ca.id
            JOIN contracts cb ON cc.contract_id_b = cb.id
            LEFT JOIN contract_analyses caa ON caa.contract_id = ca.id AND caa.analysis_type = 'full'
            LEFT JOIN contract_analyses cab ON cab.contract_id = cb.id AND cab.analysis_type = 'full'
            WHERE ca.user_id = %s AND cb.user_id = %s
            ORDER BY cc.created_at DESC
        """, (user_id, user_id))

        comparisons = cursor.fetchall()

    return jsonify({
        "comparisons": comparisons
    }), 200


# --- Get Specific Comparison Detail (Summary + Changes) ---
@contract_bp.route('/comparisons/<comparison_id>', methods=['GET'])
@jwt_required()
def get_comparison_details(comparison_id):
    user_id = get_jwt_identity()

    with get_db_connection() as db:
        cursor = db.cursor(dictionary=True)

        # Validate user owns both contracts in this comparison
        cursor.execute("""
            SELECT cc.*, ca.user_id AS user_a, cb.user_id AS user_b
            FROM contract_comparisons cc
            JOIN contracts ca ON cc.contract_id_a = ca.id
            JOIN contracts cb ON cc.contract_id_b = cb.id
            WHERE cc.id = %s
        """, (comparison_id,))
        comparison = cursor.fetchone()

        if not comparison:
            return jsonify({"error": "Comparison not found"}), 404

        if comparison['user_a'] != user_id or comparison['user_b'] != user_id:
            return jsonify({"error": "Unauthorized access"}), 403

        return jsonify({
            "summary": comparison['summary'],
            "changes": json.loads(comparison['changes'])
        }), 200


# --- Contract Summarization ---
@contract_bp.route('/summarize', methods=['POST'])
@jwt_required()
def summarize_contract():
    user_id = get_jwt_identity()

    # Option 1: use existing contract ID
    contract_id = request.form.get('contract_id')
    contract_text = None

    if contract_id:
        with get_db_connection() as db:
            cursor = db.cursor(dictionary=True)
            cursor.execute("SELECT content_text FROM contracts WHERE id = %s AND user_id = %s", (contract_id, user_id))
            row = cursor.fetchone()
            if not row or not row['content_text']:
                return jsonify({'error': 'Contract not found or missing content'}), 404
            contract_text = row['content_text']

    # Option 2: user uploads a new file
    elif 'file' in request.files:
        file = request.files['file']
        ext = os.path.splitext(file.filename)[1].lower().lstrip(".")
        if ext not in ALLOWED_EXTENSIONS:
            return jsonify({'error': 'Unsupported file type'}), 400
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], f"{uuid.uuid4()}.{ext}")
        file.save(file_path)
        contract_text = extract_text_from_file(file_path, ext)

    else:
        return jsonify({'error': 'No file or contract ID provided'}), 400

    if not contract_text:
        return jsonify({'error': 'Could not extract text from contract'}), 500

    # Summarize using Groq
    groq = GroqClient()
    result = groq.summarize_contract(contract_text)

    if result:
        return jsonify(result), 200
    else:
        return jsonify({'error': 'Failed to summarize contract'}), 500

@contract_bp.route('/<document_type>/generate', methods=['POST'])
@jwt_required()
def generate_contract_document(document_type):
    try:
        user_id = get_jwt_identity()
        input_data = request.get_json()

        # Supported types and paths
        template_file_map = {
            "nda": "document_generator/templates/nda_templates.json",
            "sow": "document_generator/templates/sow_templates.json",
            "service-agreement": "document_generator/templates/service_agreement_template.json",
            "freelancer-agreement": "document_generator/templates/freelancer_agreement_template.json"
        }

        print("1")

        document_type = document_type.lower()
        if document_type not in template_file_map:
            return jsonify({"error": "Unsupported document type"}), 400

        print("2")
        template_path = template_file_map[document_type]
        if not os.path.exists(template_path):
            return jsonify({"error": "Template not found"}), 404

        print("3")
        # Load template JSON
        with open(template_path, 'r', encoding='utf-8') as f:
            template_json = json.load(f)
        print("4")

        # Enhance using Groq
        groq = GroqClient()
        enhanced_json = groq.enhance_template(template_json, document_type, input_data)
        if not enhanced_json:
            return jsonify({"error": "Failed to enhance document content"}), 500
        print("5")

        print(enhanced_json)

        # Save enhanced JSON to temp file
        # temp_input_path = f"temp_input_{document_type}.json"
        # with open(temp_input_path, 'w', encoding='utf-8') as f:
        #     json.dump(enhanced_json, f, indent=2)

        print("6")
        # Generate document using document_generator
        generator = DocumentGenerator(combined_json_data=enhanced_json)
        result = generator.generate_document()

        if not result:
            return jsonify({"error": "Failed to generate document"}), 500

        print("7")
        return jsonify({
            "message": "Document generated successfully",
            "download_url": result["download_url"],
            "expires_in_minutes": result["expiry_minutes"]
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
