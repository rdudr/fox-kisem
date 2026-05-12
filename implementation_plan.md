# Implementation Plan

1. **Schema Update**: Update `prisma/schema.prisma` to add `areaName` and `subSubMachineTag` to the `Entry` model.
2. **Database Push**: Run `npx prisma db push` to sync the changes.
3. **Login Redirect**: Update `app/login/page.tsx` to redirect to `/company` upon successful login.
4. **Company UI**: Ensure `app/(console)/company/page.tsx` enforces Company Name and Zone (previously Area) as mandatory details. Rename Area to Zone in UI.
5. **Areas/Zones UI**: Update `app/(console)/areas/page.tsx` to rename "Area" terminology to "Zone". Add fields for "Area" (`areaName`) and "Sub sub machine tag" (`subSubMachineTag`). Update the table to include these columns.
6. **API Updates**:
    - Update `app/api/areas/route.ts` validation schemas to include `areaName` and `subSubMachineTag`.
    - Update `app/api/csv/export/route.ts` to include `areaName` and `subSubMachineTag` in exports.
    - Set CSV filename to use the entered company name instead of a static name.
    - Added CSV filename to DDMM suffix.
    - Added clearing of the database upon login inside `app/api/auth/login/route.ts`.
7. **Documentation**: Create `task.md` and `design.md`.
8. **UI Separation**: Split Areas into Zones and Machines pages to separate the logic.
9. **Machine Page Feed**: Updated the line-by-line machine feed to show short format by default and a dropdown/expanded view for full details.
