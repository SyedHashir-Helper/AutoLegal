# services/groq_client.py - Groq API Client
import os
import requests
import json, re
from typing import Optional, Dict, List


import json

def extract_json_object(text):
    brace_count = 0
    start_index = None

    for i, char in enumerate(text):
        if char == '{':
            if brace_count == 0:
                start_index = i
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0 and start_index is not None:
                json_str = text[start_index:i+1]
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    pass  # Continue searching if this one fails

    raise ValueError("Valid JSON object not found in the response.")


class GroqClient:
    """Client for interacting with Groq API"""
    
    def __init__(self):
        self.api_key = os.getenv('GROQ_API_KEY')
        self.model = os.getenv('GROQ_MODEL', 'llama-3.1-70b-versatile')
        self.base_url = "https://api.groq.com/openai/v1"
    
    def chat_completion(self, messages: List[Dict], temperature: float = 0.7, 
                       max_tokens: int = 1000) -> Optional[str]:
        """Send chat completion request to Groq API"""
        if not self.api_key:
            print("Groq API key not configured")
            return None
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return data['choices'][0]['message']['content']
            else:
                print(f"Groq API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"Groq API request failed: {e}")
            return None



    def compare_contract_versions(self, text_a, text_b):
        prompt = f"""
        You are a legal assistant. Compare the following two contract versions and return a JSON with:
        - summary: a high-level description of the main changes
        - changes: a list of key modifications in the format:

        {{
            "clause": "Clause name or heading",
            "before": "Text from old version",
            "after": "Text from new version"
        }}

        Version A:
        {text_a}

        Version B:
        {text_b}
        """
        messages = [
            {"role": "system", "content": "You are a legal AI specialized in analyzing differences between two versions of contracts."},
            {"role": "user", "content": prompt}
        ]

        response = self.chat_completion(messages, temperature=0.3, max_tokens=1500)

        if response:
            try:
                return extract_json_object(response)
            except Exception as e:
                print(f"[Error extracting JSON] {e}")
                return None
        else:
            print("No response from Groq for comparison.")
            return None



    def analyze_contract_risk(self, contract_text: str, preferences: dict) -> Optional[Dict]:
        """Analyze contract for potential risks using Groq API and return structured clause analysis"""
        if not contract_text or not contract_text.strip():
            return None

        # Truncate if too long
        max_chars = 8000
        if len(contract_text) > max_chars:
            mid_point = max_chars // 2
            contract_text = contract_text[:mid_point] + "\n\n[... content truncated ...]\n\n" + contract_text[-mid_point:]

        messages = [
            {
                "role": "system",
                "content": """You are a legal AI assistant that performs deep contract risk analysis.
    For the given contract text, extract and analyze individual clause categories (e.g., Payment Terms, IP Ownership, Termination, Liability).

    Each clause should include:
    - A short summary of the clause
    - Detected risk (if any)
    - Risk score (0-10)
    - Severity (low, medium, high)
    - Recommendation to improve or fix
    - Optional flag if clause is missing

    Return the response as a JSON object like:
    {
    "overall_risk_score": 74,        # Integer 0-100
    "summary": "Short summary",
    "categories": {
        "payment_terms": {
        "summary": "...",
        "risk_score": 6,
        "severity": "medium",
        "risk": "Delayed payment terms (Net-60)",
        "recommendation": "Negotiate for Net-30 payment or include late fee."
        },
        "ip_ownership": {
        "summary": "...",
        "risk_score": 8,
        "severity": "high",
        "risk": "All IP is transferred to client without restriction",
        "recommendation": "Limit IP transfer scope or retain partial rights"
        },
        ...
    },
    "recommendations": [
        "Revise IP clause to ensure partial ownership",
        "Cap liability to contract amount"
    ],
    "key_findings": [
        "Missing dispute resolution jurisdiction",
        "Unlimited liability clause found"
    ]
    }
    """
            },
            {
                "role": "user",
                "content": f"Please analyze this contract for legal risks:\n\n{contract_text}"
            }
        ]

        response = self.chat_completion(messages, temperature=0.3, max_tokens=2000)

        if response:
            try:
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response[json_start:json_end]
                    return json.loads(json_str)
            except json.JSONDecodeError:
                print("Failed to parse Groq response as JSON")

        return None

    def summarize_contract(self, text: str) -> Optional[dict]:
        """Simplify and summarize legal contract using Groq API"""
        if not text or not text.strip():
            return None

        messages = [
            {
                "role": "system",
                "content": """You are a legal AI assistant. Your job is to help non-lawyers understand legal documents.

    Given a contract, you must:
    1. Summarize the overall content in plain English
    2. Explain complex clauses in simple terms
    3. Extract key legal terms and define them simply

    Return the output as a valid JSON object like:
    {
    "summary": "...",
    "explanations": [
        {
        "clause": "Clause name",
        "explanation": "Explanation in plain language"
        }
    ],
    "definitions": [
        {
        "term": "Legal term",
        "definition": "What it means"
        }
    ]
    }"""
            },
            {
                "role": "user",
                "content": f"Please simplify and summarize the following contract:\n\n{text}"
            }
        ]

        response = self.chat_completion(messages, temperature=0.3, max_tokens=2000)

        if response:
            try:
                return extract_json_object(response)
            except Exception as e:
                print("Failed to parse Groq summary:", e)
        return None


    def enhance_template(self, template_json, document_type, input_json):
        prompt = f"""
    You are an expert legal document and content enhancement AI. Your task is to take a template JSON structure, document type, and input values, then enhance the template with improved, professional content while maintaining the exact same JSON structure.

    Input Format:
    You will receive three inputs:

    Template JSON: The base structure with placeholders and basic content
    Document Type: {document_type}
    Input Values JSON: {json.dumps(input_json, indent=2)}

    Enhancement Guidelines:
    - Maintain Structure: Keep the exact same JSON structure - do not add, remove, or rename any keys
    - Replace Placeholders: Fill all {{placeholder}} values with corresponding data from input values
    - Enhance Text Quality: Improve language clarity, professionalism, and legal precision
    - Context Awareness: Tailor content to the specific document type and business context
    - Legal Compliance: Ensure enhanced content follows standard legal document conventions
    - Consistency: Maintain consistent terminology and tone throughout the document

    Return only the enhanced JSON:
    {json.dumps(template_json, indent=2)}
    """

        response = self.chat_completion([
            {"role": "user", "content": prompt}
        ], temperature=0.3, max_tokens=4000)

        if response:
            try:
                return json.loads(response[response.find('{'):response.rfind('}')+1])
            except json.JSONDecodeError:
                print("⚠️ Could not parse enhanced JSON")
                return None
        return None
