# API REFERENCE

## Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/register`
- `GET /api/auth/session`

## Machines and Parameters

- `GET /api/machines`
- `POST /api/machines`
- `GET /api/machines/[id]`
- `PATCH /api/machines/[id]`
- `DELETE /api/machines/[id]`
- `GET /api/machine-parameters?kind=...`

## Acquisition and Audit

- `GET /api/data-entries`
- `POST /api/data-entries`
- `GET /api/energy-audits`
- `POST /api/energy-audits`

## CSV

- `GET /api/csv/export`
- `POST /api/csv/import`

## OCR

- `POST /api/ocr` (multipart form-data with `file`)
- `PATCH /api/ocr/[id]` (save manual corrections)
