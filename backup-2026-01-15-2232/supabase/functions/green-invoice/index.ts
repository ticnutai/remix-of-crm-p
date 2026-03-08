import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceData {
  id: string;
  invoice_number: string;
  client_name: string;
  amount: number;
  description: string | null;
  issue_date: string;
  due_date: string | null;
}

interface RequestBody {
  action: 'create_invoice' | 'get_invoice' | 'list_invoices' | 'list_all_invoices' | 'get_document_link' | 'download_and_store_pdf' | 'sync_all_invoices_pdfs';
  invoice?: InvoiceData;
  invoiceId?: string;
  documentId?: string;
  fromDate?: string;
  toDate?: string;
  localInvoiceId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GREEN_INVOICE_API_KEY');
    const apiSecret = Deno.env.get('GREEN_INVOICE_API_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!apiKey || !apiSecret) {
      console.error('Missing Green Invoice API credentials');
      throw new Error('Missing Green Invoice API credentials');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, invoice, invoiceId, documentId, fromDate, toDate, localInvoiceId }: RequestBody = await req.json();

    console.log(`Processing action: ${action}`);

    // Green Invoice API base URL
    const baseUrl = 'https://api.greeninvoice.co.il/api/v1';

    // First, get an access token
    const tokenResponse = await fetch(`${baseUrl}/account/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: apiKey,
        secret: apiSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to get Green Invoice token:', errorText);
      throw new Error(`Failed to authenticate with Green Invoice: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.token;

    console.log('Successfully authenticated with Green Invoice');

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };

    let result;

    switch (action) {
      case 'create_invoice': {
        if (!invoice) {
          throw new Error('Invoice data is required');
        }

        console.log('Creating invoice in Green Invoice:', invoice.invoice_number);

        // Create invoice document in Green Invoice
        // Note: This is a simplified example - you may need to adjust based on Green Invoice API docs
        const invoicePayload = {
          description: invoice.description || `חשבונית ${invoice.invoice_number}`,
          type: 320, // Invoice type
          lang: 'he',
          currency: 'ILS',
          vatType: 0, // Standard VAT
          discount: {
            amount: 0,
            type: 'sum',
          },
          client: {
            name: invoice.client_name,
            add: false, // Don't add to contacts if not exists
          },
          income: [
            {
              catalogNum: invoice.invoice_number,
              description: invoice.description || 'שירותים',
              quantity: 1,
              price: invoice.amount,
              currency: 'ILS',
              vatType: 0,
            },
          ],
          payment: [],
          remarks: `מספר חשבונית פנימי: ${invoice.invoice_number}`,
        };

        const createResponse = await fetch(`${baseUrl}/documents`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(invoicePayload),
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error('Failed to create invoice:', errorText);
          throw new Error(`Failed to create invoice: ${errorText}`);
        }

        result = await createResponse.json();
        console.log('Invoice created successfully:', result.id);
        break;
      }

      case 'get_invoice': {
        if (!invoiceId) {
          throw new Error('Invoice ID is required');
        }

        console.log('Fetching invoice:', invoiceId);

        const getResponse = await fetch(`${baseUrl}/documents/${invoiceId}`, {
          method: 'GET',
          headers: authHeaders,
        });

        if (!getResponse.ok) {
          const errorText = await getResponse.text();
          console.error('Failed to get invoice:', errorText);
          throw new Error(`Failed to get invoice: ${errorText}`);
        }

        result = await getResponse.json();
        break;
      }

      case 'list_invoices': {
        console.log('Listing invoices from Green Invoice (single page)');

        // Get invoices from the last 3 years or use provided dates
        const searchFromDate = fromDate || new Date(new Date().setFullYear(new Date().getFullYear() - 3)).toISOString().split('T')[0];
        const searchToDate = toDate || new Date().toISOString().split('T')[0];
        
        const searchPayload = {
          page: 1,
          pageSize: 100,
          type: [305, 320, 330, 400, 405],
          fromDate: searchFromDate,
          toDate: searchToDate,
          sort: 'documentDate',
          sortType: 'desc',
        };

        console.log('Search payload:', JSON.stringify(searchPayload));

        const listResponse = await fetch(`${baseUrl}/documents/search`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(searchPayload),
        });

        if (!listResponse.ok) {
          const errorText = await listResponse.text();
          console.error('Failed to list invoices:', errorText);
          throw new Error(`Failed to list invoices: ${errorText}`);
        }

        result = await listResponse.json();
        console.log(`Found ${result.items?.length || 0} documents from Green Invoice`);
        break;
      }

      case 'list_all_invoices': {
        console.log('Listing ALL invoices from Green Invoice (all pages)');

        // Get invoices from the last 5 years or use provided dates
        const searchFromDate = fromDate || new Date(new Date().setFullYear(new Date().getFullYear() - 5)).toISOString().split('T')[0];
        const searchToDate = toDate || new Date().toISOString().split('T')[0];
        
        const allItems: any[] = [];
        let currentPage = 1;
        let totalPages = 1;

        do {
          const searchPayload = {
            page: currentPage,
            pageSize: 100,
            type: [305, 320, 330, 400, 405],
            fromDate: searchFromDate,
            toDate: searchToDate,
            sort: 'documentDate',
            sortType: 'desc',
          };

          console.log(`Fetching page ${currentPage}...`);

          const listResponse = await fetch(`${baseUrl}/documents/search`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(searchPayload),
          });

          if (!listResponse.ok) {
            const errorText = await listResponse.text();
            console.error('Failed to list invoices:', errorText);
            throw new Error(`Failed to list invoices: ${errorText}`);
          }

          const pageResult = await listResponse.json();
          allItems.push(...(pageResult.items || []));
          totalPages = pageResult.pages || 1;
          
          console.log(`Page ${currentPage}/${totalPages}: Got ${pageResult.items?.length || 0} items. Total so far: ${allItems.length}`);
          
          currentPage++;
        } while (currentPage <= totalPages);

        result = {
          items: allItems,
          total: allItems.length,
          pages: totalPages,
        };

        console.log(`Finished! Total documents fetched: ${allItems.length}`);
        break;
      }

      case 'get_document_link': {
        if (!documentId) {
          throw new Error('Document ID is required');
        }

        console.log('Getting document download links:', documentId);

        // Correct endpoint: /documents/{id}/download/links (not just /download)
        const downloadResponse = await fetch(`${baseUrl}/documents/${documentId}/download/links`, {
          method: 'GET',
          headers: authHeaders,
        });

        if (!downloadResponse.ok) {
          const errorText = await downloadResponse.text();
          console.error('Failed to get document download links:', errorText);
          throw new Error(`Failed to get document link: ${errorText}`);
        }

        result = await downloadResponse.json();
        console.log('Got document links successfully:', result);
        break;
      }

      case 'download_and_store_pdf': {
        if (!documentId) {
          throw new Error('Document ID is required');
        }
        if (!localInvoiceId) {
          throw new Error('Local invoice ID is required');
        }

        console.log('Downloading and storing PDF for document:', documentId);

        // Step 1: Get the download link from Green Invoice
        const downloadLinksResponse = await fetch(`${baseUrl}/documents/${documentId}/download/links`, {
          method: 'GET',
          headers: authHeaders,
        });

        if (!downloadLinksResponse.ok) {
          const errorText = await downloadLinksResponse.text();
          console.error('Failed to get document download links:', errorText);
          throw new Error(`Failed to get document link: ${errorText}`);
        }

        const links = await downloadLinksResponse.json();
        const pdfUrl = links.he || links.origin || links.en;
        
        if (!pdfUrl) {
          throw new Error('No PDF URL found in response');
        }

        console.log('Got PDF URL, downloading...');

        // Step 2: Download the actual PDF
        const pdfResponse = await fetch(pdfUrl);
        
        if (!pdfResponse.ok) {
          throw new Error(`Failed to download PDF: ${pdfResponse.status}`);
        }

        const pdfBuffer = await pdfResponse.arrayBuffer();
        const pdfBlob = new Uint8Array(pdfBuffer);
        
        console.log(`Downloaded PDF, size: ${pdfBlob.length} bytes`);

        // Step 3: Upload to Supabase Storage
        const fileName = `${documentId}.pdf`;
        const storagePath = `invoices/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('invoice-pdfs')
          .upload(storagePath, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadError) {
          console.error('Failed to upload PDF to storage:', uploadError);
          throw new Error(`Failed to upload PDF: ${uploadError.message}`);
        }

        console.log('PDF uploaded to storage:', storagePath);

        // Step 4: Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('invoice-pdfs')
          .getPublicUrl(storagePath);

        const publicUrl = publicUrlData.publicUrl;
        console.log('Public URL:', publicUrl);

        // Step 5: Update the invoice record with the storage URL
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ pdf_storage_url: publicUrl })
          .eq('id', localInvoiceId);

        if (updateError) {
          console.error('Failed to update invoice record:', updateError);
          throw new Error(`Failed to update invoice: ${updateError.message}`);
        }

        console.log('Invoice record updated with PDF URL');

        result = {
          success: true,
          storageUrl: publicUrl,
          fileName: fileName,
        };
        break;
      }

      case 'sync_all_invoices_pdfs': {
        console.log('Starting sync of all invoices PDFs...');

        // Get all invoices with green_invoice_id but no pdf_storage_url
        const { data: invoicesToSync, error: fetchError } = await supabase
          .from('invoices')
          .select('id, green_invoice_id, invoice_number')
          .not('green_invoice_id', 'is', null)
          .is('pdf_storage_url', null);

        if (fetchError) {
          throw new Error(`Failed to fetch invoices: ${fetchError.message}`);
        }

        console.log(`Found ${invoicesToSync?.length || 0} invoices to sync`);

        const results = {
          total: invoicesToSync?.length || 0,
          success: 0,
          failed: 0,
          errors: [] as string[],
        };

        for (const inv of invoicesToSync || []) {
          try {
            console.log(`Processing invoice ${inv.invoice_number} (${inv.green_invoice_id})...`);

            // Get download link
            const downloadLinksResponse = await fetch(`${baseUrl}/documents/${inv.green_invoice_id}/download/links`, {
              method: 'GET',
              headers: authHeaders,
            });

            if (!downloadLinksResponse.ok) {
              throw new Error(`Failed to get download link: ${downloadLinksResponse.status}`);
            }

            const links = await downloadLinksResponse.json();
            const pdfUrl = links.he || links.origin || links.en;

            if (!pdfUrl) {
              throw new Error('No PDF URL found');
            }

            // Download PDF
            const pdfResponse = await fetch(pdfUrl);
            if (!pdfResponse.ok) {
              throw new Error(`Failed to download PDF: ${pdfResponse.status}`);
            }

            const pdfBuffer = await pdfResponse.arrayBuffer();
            const pdfBlob = new Uint8Array(pdfBuffer);

            // Upload to storage
            const fileName = `${inv.green_invoice_id}.pdf`;
            const storagePath = `invoices/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('invoice-pdfs')
              .upload(storagePath, pdfBlob, {
                contentType: 'application/pdf',
                upsert: true,
              });

            if (uploadError) {
              throw new Error(`Upload failed: ${uploadError.message}`);
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
              .from('invoice-pdfs')
              .getPublicUrl(storagePath);

            // Update invoice record
            const { error: updateError } = await supabase
              .from('invoices')
              .update({ pdf_storage_url: publicUrlData.publicUrl })
              .eq('id', inv.id);

            if (updateError) {
              throw new Error(`Update failed: ${updateError.message}`);
            }

            results.success++;
            console.log(`✓ Synced invoice ${inv.invoice_number}`);

          } catch (err: any) {
            results.failed++;
            results.errors.push(`${inv.invoice_number}: ${err.message}`);
            console.error(`✗ Failed to sync invoice ${inv.invoice_number}:`, err.message);
          }
        }

        console.log(`Sync complete: ${results.success}/${results.total} succeeded, ${results.failed} failed`);
        result = results;
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in green-invoice function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
