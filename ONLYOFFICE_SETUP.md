# OnlyOffice MVP Setup

This project now has a standalone OnlyOffice editor at:

```text
/onlyoffice-editor
```

It supports:

- Creating a blank DOCX document
- Uploading DOC/DOCX/XLS/XLSX/PPT/PPTX/PDF files
- Opening files in ONLYOFFICE Docs
- Printing from the editor
- Saving back to Supabase Storage through an Edge Function callback

## 1. Run the migration

```powershell
node scripts/direct-run.mjs file "supabase/migrations/20260704190000_onlyoffice_documents.sql"
```

This creates:

- `onlyoffice_documents`
- `onlyoffice_document_versions`
- `onlyoffice-documents` storage bucket
- RLS policies for each user's own files

## 2. Deploy the Edge Functions through Lovable/Supabase

Do not run these functions as a separate local server. In this project they are
part of the Lovable/Supabase backend and must be deployed through the connected
Lovable/Supabase flow.

Functions added:

- `onlyoffice-upload`: receives uploaded Office files from the app and writes them to Supabase Storage
- `onlyoffice-config`: returns the editor config for the React component
- `onlyoffice-callback`: receives save callbacks from ONLYOFFICE and writes back to Storage
- `onlyoffice-file`: creates download links and deletes files

If using the local helper, it requires `SUPABASE_MANAGEMENT_TOKEN` to already be
configured in Supabase Edge Function secrets:

```powershell
node scripts/deploy-via-edge.mjs onlyoffice-upload
node scripts/deploy-via-edge.mjs onlyoffice-config
node scripts/deploy-via-edge.mjs onlyoffice-callback
node scripts/deploy-via-edge.mjs onlyoffice-file
```

If that token is not configured, publish/deploy the project from Lovable so the
new `supabase/functions/*` folders are deployed with the backend.

## 3. Run ONLYOFFICE Document Server

For local testing:

```powershell
docker run -i -t -d -p 8088:80 --restart=always --name onlyoffice-document-server onlyoffice/documentserver
```

Then configure the public URL that the browser and Supabase Edge Functions can reach. Localhost works only when every part can access the same machine; for real callback saving, use a reachable HTTPS URL.

## 4. Set Supabase function secrets

```powershell
supabase secrets set ONLYOFFICE_DOCUMENT_SERVER_URL="https://your-onlyoffice-server"
supabase secrets set ONLYOFFICE_JWT_SECRET="your-secret"
```

If JWT is disabled in your Document Server, `ONLYOFFICE_JWT_SECRET` can be omitted.

## 5. Test

1. Open `/onlyoffice-editor`.
2. Click `חדש`.
3. Open the document.
4. Edit text in ONLYOFFICE.
5. Close/save and reopen.
6. Verify the version increments and the content remains.

## Notes

- The MVP is intentionally standalone. Client/file/quote/contract linking should be added after this flow is confirmed working.
- ONLYOFFICE must be able to download the signed Supabase file URL and call the callback function URL.
