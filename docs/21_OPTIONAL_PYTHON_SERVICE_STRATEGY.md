# 21 - Optional Python Service Strategy

## Purpose

This document explains when and how Python should be introduced without making the project harder to maintain.

## Bottom Line

Do not use Python as the main backend during Phase 1.

Use Python later as an isolated service for tasks where Python is clearly better than JavaScript/TypeScript.

## Recommended Python Service Type

Use FastAPI, not Flask, for production-style Python services.

Reason:

```text
FastAPI has stronger type-hint-first API design.
FastAPI creates OpenAPI docs automatically.
FastAPI is a better fit for async API calls and AI/document services.
Flask can still be used for tiny utilities, but not the core backend.
```

## When to Add Python

Add Python only if these tasks become painful in TypeScript:

```text
PDF parsing with Docling
OCR-heavy document processing
image understanding pre-processing
complex XLSX interpretation
embedding batch processing
RAG evaluation with Python-first libraries
custom ML/data science experiments
large offline analysis of chat behavior
```

## Python Service Responsibilities

Allowed responsibilities:

```text
parse_document(file_id)
extract_tables(file_id)
extract_images(file_id)
run_ocr(file_id)
generate_embeddings(source_id)
run_rag_eval(test_run_id)
summarize_large_batch(batch_id)
```

Forbidden responsibilities:

```text
create appointment
reschedule appointment
edit clinical note
approve reimbursement
approve payroll
send WhatsApp blast without approval
modify financial ledger
change client package status
change permission roles
```

## Communication Pattern

Use async job style:

```text
Next.js/Backend creates job
  ↓
job stored in event_outbox or job_runs
  ↓
Python worker picks job or receives restricted API call
  ↓
Python writes result to safe result table or storage path
  ↓
Backend validates result
  ↓
Backend publishes result to product UI
```

Do not allow Python service to perform direct sensitive mutations.

## Data Access Rule

Preferred:

```text
Python receives signed file URL or scoped input payload.
Python returns structured result.
Main backend writes final state.
```

Avoid:

```text
Python service has full database service-role access.
Python service can query all clients/finance/clinical notes freely.
```

If service-role is unavoidable, restrict by environment, network, and function-level allowlist.

## API Contract Example

```json
{
  "job_id": "job_123",
  "file_id": "file_456",
  "task": "parse_pdf",
  "source_scope": "internal_knowledge",
  "callback_url": "https://api.example.com/internal/jobs/job_123/result"
}
```

Result:

```json
{
  "job_id": "job_123",
  "status": "completed",
  "parser": "docling",
  "text_blocks": 120,
  "tables": 4,
  "images": 8,
  "output_storage_path": "processed/job_123/result.json",
  "warnings": []
}
```

## Folder Structure if Added

```text
apps/
  web/
  worker/
  python-ai-worker/
    app/
      main.py
      routers/
      services/
      parsers/
      schemas/
      jobs/
    tests/
    Dockerfile
```

## Phase Decision

```text
Phase 1: No Python service.
Phase 2: Add only if Knowledge Studio ingestion becomes slow.
Phase 3: Add dedicated Python worker for OCR/RAG evaluation if needed.
```
