# 📄 AutoLegal – AI-Powered Legal Document Assistant

**AutoLegal** is an advanced AI-powered platform designed to automate, simplify, and enhance legal document workflows for law firms, legal teams, and freelancers. It empowers users to upload, analyze, compare, summarize, and even generate legally sound contracts using natural language input and structured templates.

---

## 🚀 What This Project Does

AutoLegal combines the power of AI language models (via Groq) with dynamic document structuring and generation tools to offer:

- 📤 **Contract Upload & Storage**
- 📊 **Contract Risk Analysis**
- 🔍 **Document Version Comparison**
- 🧠 **Legal Language Simplification & Clause Explanation**
- 🧾 **Dynamic Contract Generation (NDA, SOW, Freelancer, Service Agreement)**
- 📎 **Secure Downloadable File Links (Docx Format)**

---

## ⚙️ Technologies Used

| Tech                      | Purpose                                                         |
|---------------------------|-----------------------------------------------------------------|
| **React.js (Ant Design)** | Frontend interface with tabbed document workflows and clean forms |
| **Flask (Python)**        | REST API backend handling contract logic, file uploads, and AI workflows |
| **Groq + LLaMA 3**        | Large language model (via API) for text comparison, summarization, enhancement |
| **MySQL**                 | Relational storage of contracts, comparisons, and analysis records |
| **python-docx**           | Generate `.docx` legal documents from structured templates       |
| **Custom HTTP Server**    | Serve download links for generated documents                    |
| **Temporary File System** | Auto-expiring document download mechanism                       |

---

## 💡 Feature-by-Feature Explanation

### 1. 📂 Contract Upload & Management
- Upload contracts as `.pdf`, `.doc`, or `.docx`
- Stores metadata like file type, size, and upload timestamp
- Automatically extracts content text from supported formats

### 2. 🔍 Risk Analysis (AI-Powered)
- Extracts clauses and flags legal risks
- Provides:
  - Risk score (0-100)
  - Clause summaries
  - Recommendations
- Customizable using user preferences per contract type

### 3. 📄 Compare Contract Versions
- Upload new version and compare it against an existing contract
- AI highlights:
  - Changes in clauses (Before vs. After)
  - Summary of key differences
- Stores all comparison history with modal-based review

### 4. 🧠 Simplify Legal Language
- Upload or select a document
- AI returns:
  - Layman’s summary
  - Key definitions
  - Plain English clause explanations

### 5. 🧾 Contract Generation (Template-Based)
- Choose contract type:
  - NDA
  - SOW
  - Freelancer Agreement
  - Service Agreement
- Dynamic forms tailored to contract type
- Generates `.docx` using structured templates
- Each template enhanced via Groq's LLM for:
  - Legal professionalism
  - Language precision
  - Smart clause filling

### 6. 🔗 Temporary Download Links
- Each generated document receives a temporary link
- User can view/download the document securely
- Auto-expires after 30–60 minutes

---

## 📋 Example Use Cases

| Role         | Usage                                                                 |
|--------------|-----------------------------------------------------------------------|
| **Lawyer**   | Generate and review custom NDAs in seconds                            |
| **Freelancer** | Compare client-agency agreements over time                          |
| **Startup**  | Get plain English summaries of investor contracts                     |
| **Paralegal** | Automate routine contract generation                                 |

---

## 📍 API Highlights

| Endpoint                                         | Description                                           |
|--------------------------------------------------|-------------------------------------------------------|
| `/api/contracts/upload`                         | Upload a contract                                     |
| `/api/contracts/compare`                        | Compare two versions of a contract                    |
| `/api/contracts/summarize`                      | Summarize and simplify a contract                     |
| `/api/contracts/<document_type>/generate`       | Generate a contract based on structured template      |
| `/api/contracts/comparisons`                    | Fetch past comparisons                                |
| `/download/<file_id>`                           | Secure file download URL                              |

---

## 📌 Summary

AutoLegal eliminates legal document bottlenecks by leveraging cutting-edge AI and structured automation. Whether you're generating a new NDA, comparing contract revisions, or explaining legal jargon in simple terms — this tool simplifies the legal lifecycle.

**🧠 AI + 📄 Contracts = ⚡ Legal Superpowers**
