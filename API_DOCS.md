# 🚀 KFintech AI Microservice — API Reference

Welcome to the **KFintech AI Models API**. This documentation provides the exact JSON contracts, request structures, and response schemas required for the Node.js and React teams to integrate with our backend AI services.

The API exposes three primary AI capabilities:
1. **Priority Triage** using fine-tuned DistilBERT models.
2. **Zero-Touch Verification** using EasyOCR.
3. **RAG Chatbot** backed by a local Llama 3 instance and ChromaDB.

> [!NOTE]
> Ensure that your API Gateway or reverse proxy maps the external `/api/ai/*` paths defined below to the internal FastAPI routes appropriately.

---

## 1. Sentiment & Priority Triage

Evaluates the sentiment of a customer complaint or message using a fine-tuned DistilBERT model. If the sentiment is negative, the API flags the priority as `CRITICAL` for immediate escalation.

**Endpoint:** `POST /api/ai/sentiment`

### Request

| Header | Value |
| :--- | :--- |
| `Content-Type` | `application/json` |

```json
{
  "text": "I was charged a management fee twice this month on my index fund. I need this reversed immediately, your system is broken and stealing my money."
}
```

### Response

**Success (200 OK)**

```json
{
  "sentiment": "NEGATIVE",
  "score": 0.9984,
  "priority": "CRITICAL"
}
```

> [!WARNING]
> **Error Codes**
> - `400 Bad Request`: Missing or invalid JSON payload.
> - `422 Unprocessable Entity`: Validation error (e.g., `text` field is missing).
> - `500 Internal Server Error`: Model inference failed.

---

## 2. OCR Zero-Touch Verification

Accepts an uploaded image (e.g., a cheque, bank statement) and an account number. It uses EasyOCR to extract all text from the document and performs robust string-matching to verify if the account number exists within the document.

**Endpoint:** `POST /api/ai/ocr-verify`

### Request

| Header | Value |
| :--- | :--- |
| `Content-Type` | `multipart/form-data` |

**Form-Data Fields:**
- `account_number` *(string, required)*: The target account number to verify.
- `file` *(file, required)*: The image of the document (JPEG, PNG).

*Example Request:*
```bash
curl -X POST "http://localhost:8000/api/ai/ocr-verify" \
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
    "KFintech",
    "Statement of Account",
    "Account No:",
    "123-456 789",
    "Balance: $10,000"
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

## 3. Llama 3 RAG Chatbot

A highly compliant RAG (Retrieval-Augmented Generation) chatbot. It embeds the user's query, retrieves the most relevant KFintech SLA policies from ChromaDB, and forces a local Llama 3 instance to answer the query *strictly* using the retrieved context to prevent hallucination.

**Endpoint:** `POST /api/ai/chat`

### Request

| Header | Value |
| :--- | :--- |
| `Content-Type` | `application/json` |

```json
{
  "question": "What is the notice period to cancel a SIP?"
}
```

### Response

**Success (200 OK)**

```json
{
  "query": "What is the notice period to cancel a SIP?",
  "response": "According to the Systematic Investment Plan (SIP) Cancellation policy, SIP cancellation requests require a strict 30-day notice period prior to the next scheduled deduction date.",
  "retrieved_data_source": [
    "4. Systematic Investment Plan (SIP) Cancellation: SIP cancellation requests require a strict 30-day notice period prior to the next scheduled deduction date."
  ]
}
```

> [!WARNING]
> **Error Codes**
> - `422 Unprocessable Entity`: Missing `question` in JSON payload.
> - `500 Internal Server Error`: Vector store not initialized or Ollama backend is unreachable.
