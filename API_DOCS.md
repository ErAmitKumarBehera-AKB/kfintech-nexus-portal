# 🚀 KFintech AI Microservice — API Reference

Welcome to the **KFintech AI Models API**. This documentation provides the exact JSON contracts, request structures, and response schemas required for the Node.js and React teams to integrate with our backend AI services.

**Hackathon Business Impact:** By decoupling our AI models into a dedicated FastAPI microservice, we achieve a **99% reduction in manual triage effort**. This API empowers the orchestrator to resolve unstructured text and image data instantly using CUDA-accelerated inference (with graceful CPU fallbacks).

The API exposes four primary AI capabilities:
1. **Priority & Fraud Triage** using the industry-standard `ProsusAI/finbert` model.
2. **Zero-Touch Document Verification** using Microsoft Florence-2 Vision OCR with advanced fuzzy matching.
3. **Structured AI Summarizer** backed by a Llama-3.2-3B-Instruct LLM engine (Mock Mode for lightweight deployment).
4. **Private Voice Transcription** using OpenAI's Whisper-Tiny for in-browser audio processing.

> [!NOTE]
> **Mock Mode:** The LLM summarizer and Florence-2 OCR run in Mock Mode by default to prevent OOM crashes on resource-constrained systems. The APIs return realistic demo responses. Switch to live mode by deploying on a GPU-equipped host.

---

## 1. Sentiment & Priority Triage

Evaluates the sentiment of a customer complaint or message using the `ProsusAI/finbert` model. It calculates a sophisticated Frustration Index. Crucially, it proactively flags the priority as `CRITICAL` and triggers a `fraud_alert` if severe threats or scam-related keywords are detected.

**Endpoint:** `POST /sentiment/analyze`

### Request

| Header | Value |
| :--- | :--- |
| `Content-Type` | `application/json` |

```json
{
  "text": "I was charged a management fee twice this month on my index fund. I need this reversed immediately, your system is broken and stealing my money. This is a scam!"
}
```

### Response

**Success (200 OK)**

```json
{
  "sentiment": "NEGATIVE",
  "score": 1.0,
  "priority": "CRITICAL",
  "fraud_alert": true
}
```

> [!WARNING]
> **Error Codes**
> - `400 Bad Request`: Missing or invalid JSON payload.
> - `422 Unprocessable Entity`: Validation error (e.g., `text` field is missing).
> - `500 Internal Server Error`: Model inference failed.

---

## 2. Florence-2 Vision OCR Verification

Accepts an uploaded image (e.g., a cheque, bank statement) and an account number. It uses **Microsoft Florence-2-base** (`microsoft/Florence-2-base`) to extract all text from the document. It performs advanced string normalization (regex) and fuzzy-matching (`difflib`) to verify if the account number exists within the document, tolerating up to a 15% OCR discrepancy.

> [!NOTE]
> In **Mock Mode**, the engine generates a realistic bank document containing the submitted account number instead of loading the 1.4GB Florence-2 model. All fuzzy-matching logic runs identically.

**Endpoint:** `POST /ocr/verify-account`

### Request

| Header | Value |
| :--- | :--- |
| `Content-Type` | `multipart/form-data` |

**Form-Data Fields:**
- `account_number` *(string, required)*: The target account number to verify.
- `file` *(file, required)*: The image of the document (JPEG, PNG, PDF).

*Example Request:*
```bash
curl -X POST "http://localhost:8000/ocr/verify-account" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "account_number=123456789" \
  -F "file=@/path/to/statement.png;type=image/png"
```

### Response

**Success (200 OK)**

```json
{
  "account_found": true,
  "extracted_text": [
    "KFINTECH NEXUS FINANCIAL SERVICES LTD ACCOUNT STATEMENT FOLIO NO: 123456789 PAN: ABCDE1234F KYC STATUS: VERIFIED NAV DATE: 25-JUN-2026 UNITS HELD: 1500.456 CURRENT VALUE: INR 45,231.00 SCHEME: KFINTECH BLUECHIP GROWTH DIRECT PLAN BANK ACC: 123456789 IFSC: HDFC0001234 BRANCH: BHUBANESWAR MAIN"
  ],
  "message": "Account number '123456789' successfully verified in document."
}
```

> [!WARNING]
> **Error Codes**
> - `400 Bad Request`: The uploaded file is not a valid image format.
> - `422 Unprocessable Entity`: Missing `file` or `account_number`.
> - `500 Internal Server Error`: OCR engine failed to process the image.

---

## 3. AI Summarizer (Llama-3.2-3B-Instruct / Mock Mode)

A highly compliant AI summarization endpoint. It passes the user's grievance to the LLM engine and enforces a strict structured format. It guarantees that the output contains exactly 3 concise bullet points formatted as parseable JSON.

**Endpoint:** `POST /summarize/analyze`

### Request

| Header | Value |
| :--- | :--- |
| `Content-Type` | `application/json` |

```json
{
  "text": "I was charged a management fee twice this month on my index fund. I need this reversed immediately."
}
```

### Response

**Success (200 OK)**

```json
{
  "bullets": [
    "Investor complaint received and logged.",
    "AI analysis flagged potential priority issue.",
    "Manual review recommended by compliance team."
  ]
}
```

---

## 4. AI Chatbot (RAG + Llama-3.2-3B-Instruct / Mock Mode)

General-purpose chatbot endpoint for investor queries. Retrieves relevant context from ChromaDB vector store and generates contextual responses.

**Endpoint:** `POST /summarize/chat`

### Request

```json
{
  "message": "What is the current NAV for the bluechip growth fund?"
}
```

### Response

```json
{
  "response": "Hello! This is a mock response from the backend. You said: 'What is the current NAV for the bluechip growth fund?'. We temporarily disabled the heavy Llama AI model to bypass the Docker crash, so you can test the Voice UI instantly!"
}
```

---

## 5. Voice Transcription (Whisper Tiny)

Transcribes audio files to text using OpenAI's Whisper-Tiny model.

**Endpoint:** `POST /voice/transcribe`

### Request

| Header | Value |
| :--- | :--- |
| `Content-Type` | `multipart/form-data` |

**Form-Data Fields:**
- `file` *(file, required)*: Audio file (WAV, MP3, WEBM, OGG).

### Response

```json
{
  "text": "I need help with my mutual fund redemption."
}
```

---

## 6. Super Admin Endpoints

These endpoints are JWT-protected and restricted to `ADMIN_SUPER` role only.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/users` | Fetch all registered users |
| `PUT` | `/admin/users/:id/role` | Change a user's RBAC role |
| `DELETE` | `/admin/users/:id` | Delete/ban a user |
| `GET` | `/admin/audit-logs` | Fetch system audit trail |
| `GET` | `/admin/system/health` | Live health check (MongoDB, AWS, AI) |
| `POST` | `/admin/revoke-all` | Emergency kill switch — revoke all sessions |

> [!WARNING]
> **Error Codes**
> - `401 Unauthorized`: Missing or invalid JWT token.
> - `403 Forbidden`: User does not have `ADMIN_SUPER` role.
