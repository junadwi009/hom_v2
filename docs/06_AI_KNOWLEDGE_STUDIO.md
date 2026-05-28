# 06 - AI Knowledge Studio and Behavior Intelligence

## 1. Goal

Knowledge Studio lets the business owner update the AI knowledge base without coding. It supports uploaded files such as PDF, DOCX, XLSX, CSV, images, screenshots, SOP documents, pricing sheets, and campaign examples.

The feature also learns customer behavior from WhatsApp conversations, but it does not automatically train the model or change policy without human approval.

## 2. Why This Matters

A studio owner often changes:

- Pricing
- Service packages
- Campaign messages
- Cancellation rules
- Practitioner schedule info
- FAQs
- Tone of customer service
- Safety disclaimers
- Admin SOP

Hardcoding all of this into prompts will become messy. Knowledge Studio turns business knowledge into versioned, reviewable, testable data.

## 3. Main Pages

### 3.1 Knowledge Sources

Shows all uploaded files.

Columns:

- Title
- Type
- Scope
- Status
- Version
- Uploaded by
- Last processed
- Published status
- Actions

Statuses:

```text
uploaded
processing
extracted
review_needed
approved
embedded
tested
published
archived
failed
```

### 3.2 Upload Panel

The owner can upload:

- PDF
- DOCX
- XLSX
- CSV
- PNG/JPG
- Screenshots

The upload form asks:

- Title
- Document type
- Scope
- Is this public chatbot knowledge?
- Is this internal admin knowledge?
- Is this finance knowledge?
- Is this clinical safety knowledge?

### 3.3 Extraction Review

After processing, the owner sees:

- Extracted text
- Detected tables
- Image descriptions
- Possible errors
- Confidence score
- Suggested scope
- Suggested chunks

The owner can edit before publishing.

### 3.4 Spreadsheet Mapping

XLSX files are not treated like normal text.

The owner must select:

- Sheet name
- Header row
- Date column
- Amount column
- Category column
- Practitioner column if relevant
- Client column if relevant
- Whether this sheet is finance, attendance, clients, services, or pricing

### 3.5 Business Rules Editor

Allows owner to create rules like:

```text
If customer asks about pain or injury:
- Do not diagnose.
- Explain that assessment is recommended.
- Escalate to human if post-surgery or severe symptoms are mentioned.
```

Rules have:

- Scope
- Priority
- Active/inactive
- Version
- Test cases

### 3.6 Chatbot Behavior Profile

Owner can set:

- Language: Indonesian, English, mixed
- Tone: warm, premium, concise, clinical-safe
- Emoji usage: none, minimal, allowed
- Autonomy level: draft only, safe FAQ auto-reply, booking info auto-reply
- Escalation rules

### 3.7 Test Lab

Owner can test AI before publishing.

Example test questions:

```text
Berapa harga private session?
Saya habis operasi lutut, boleh ikut kelas apa?
Saya mau refund.
Saya mau reschedule dengan Firly hari Kamis.
Apa bedanya clinical pilates dan pilates biasa?
```

Output:

- AI answer
- Retrieved sources
- Confidence
- Policy flags
- Latency
- Cost estimate
- Pass/fail

### 3.8 Publish and Rollback

Knowledge is not active until published.

Publish record must save:

- Version
- Published by
- Published at
- Affected scope
- Test result
- Rollback target

## 4. Knowledge Scopes

| Scope | Used By | Examples |
|---|---|---|
| public_chatbot | WhatsApp customer AI | FAQ, location, service explanation, pricing |
| internal_admin | Admin assistant | SOP, reschedule rules, refund process |
| clinical_safety | Policy guard | non-diagnostic rules, escalation triggers |
| finance | AI Business Agent | category definitions, commission rules |
| marketing | Campaign assistant | tone, campaign examples, segment logic |
| owner_only | Studio Director | sensitive strategy notes |

## 5. Document Ingestion Pipeline

```text
Upload
  ↓
Store raw file
  ↓
Create knowledge_sources row
  ↓
Extract content
  ↓
Owner review
  ↓
Chunk content
  ↓
Create embeddings
  ↓
Run test cases
  ↓
Publish
```

## 6. Parser Recommendation

Start simple:

- PDF/DOCX: Docling or Unstructured.
- XLSX: custom spreadsheet mapper.
- Images: OCR/vision only if needed.
- CSV: direct structured import.

Do not use expensive vision parsing for every file by default. Use it only when normal extraction fails or the file is image-heavy.

## 7. RAG Retrieval Rules

When AI answers:

1. Determine scope.
2. Retrieve only allowed knowledge chunks.
3. Exclude archived/draft knowledge.
4. Include business rules for that scope.
5. Generate answer.
6. Run policy guard.
7. Return answer and sources.

## 8. AI Safety Rules

AI must not:

- Diagnose medical conditions.
- Promise healing.
- Promise refund.
- Create discount not approved by owner.
- Confirm reschedule without backend check.
- Read finance data if user lacks permission.
- Read clinical notes unless specifically allowed and masked.

## 9. Behavior Intelligence

### 9.1 What to Extract from Chat

From WhatsApp conversations, extract structured data:

```text
intent
topic
objection
sentiment
urgency
preferred practitioner
preferred day/time
service interest
price sensitivity
reschedule reason
churn risk
unanswered question
conversion outcome
```

### 9.2 Example

Chat:

```text
Hi, I have a session with Firly on Thursday. Can I reschedule?
```

Extraction:

```json
{
  "intent": "reschedule_request",
  "preferredPractitioner": "Firly",
  "urgency": "medium",
  "actionNeeded": "check_available_slots",
  "risk": "appointment_change"
}
```

### 9.3 Behavior Dashboard

Owner should see:

- Top questions this week
- Top unanswered questions
- Most common reschedule reasons
- Lead objections
- Campaign response trends
- Practitioner demand
- Price sensitivity trends
- FAQ gaps
- Suggested knowledge updates

## 10. Human Approval Loop

```text
AI discovers pattern
  ↓
AI suggests rule/FAQ/campaign update
  ↓
Owner reviews
  ↓
Owner edits or rejects
  ↓
If approved, create Knowledge Studio draft
  ↓
Run test lab
  ↓
Publish
```

## 11. Multi-LLM Gateway

Use model aliases, not hardcoded providers.

Example:

```text
fast_classification_model
premium_reasoning_model
vision_document_model
embedding_model
critic_model
```

Routing:

| Task | Model Alias |
|---|---|
| Intent classification | fast_classification_model |
| WhatsApp reply draft | balanced_chat_model |
| Finance analysis | premium_reasoning_model |
| Document image parsing | vision_document_model |
| RAG evaluation | critic_model |
| Embeddings | embedding_model |

## 12. Observability

Log for every AI call:

- Feature
- Model alias
- Provider
- Prompt version
- Knowledge version
- Retrieved chunks
- Latency
- Token usage
- Cost
- Result status
- Human override

## 13. MVP Build Order

1. File upload.
2. Knowledge source table.
3. PDF/DOCX text extraction.
4. Owner review screen.
5. Manual chunking or simple chunking.
6. Embeddings.
7. Retrieval.
8. Test Lab.
9. Publish/rollback.
10. Behavior extraction.
11. Weekly insights.
12. Suggested knowledge updates.
