# DATABASE SCHEMA

Prisma schema lives at `prisma/schema.prisma`.

## Main Models

- `User`: auth identity and role (`ADMIN`, `OPERATOR`, `VIEWER`)
- `Machine`: machine registry + electrical metadata
- `MachineParameterDef`: dynamic machine-kind parameter definitions
- `DataEntry`: machine-wise acquisition payloads (JSON) with status
- `EnergyAuditRecord`: Scope 1/2/3 audit rows + SEC/PAT/PF/emission fields
- `OcrExtraction`: OCR raw text, extracted fields, and confirmed corrections
- `EmissionFactor`: scope-based factor reference table

## Enums

- `UserRole`, `MachineKind`, `MachineStatus`, `DataEntryStatus`, `EnergyScope`

## Seed

- `prisma/seed.ts` creates baseline users, parameter definitions, one demo machine, and sample records.
