import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import {
	GOOGLE_CREDENTIALS_JSON,
	GOOGLE_LOCATION,
	GOOGLE_PROCESSOR_ID,
	GOOGLE_PROJECT_ID
} from '$env/static/private';

// Initialize the Google Document AI client
const docAIClient = new DocumentProcessorServiceClient({
	apiEndpoint: `${GOOGLE_LOCATION}-documentai.googleapis.com`,
	credentials: JSON.parse(GOOGLE_CREDENTIALS_JSON)
});
export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const pdfFile = formData.get('contract_pdf');

		if (!pdfFile || !(pdfFile instanceof File)) {
			throw error(400, { message: 'No PDF file uploaded.' });
		}

		// Convert the uploaded file into a Buffer
		const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());

		// --- Google Document AI Processing ---
		console.log('[DEBUG] Preparing to call Google Document AI...');
		const processorName = `projects/${GOOGLE_PROJECT_ID}/locations/${GOOGLE_LOCATION}/processors/${GOOGLE_PROCESSOR_ID}`;
		console.log(`[DEBUG] Using processor: ${processorName}`);

		const [result] = await docAIClient.processDocument({
			name: processorName,
			rawDocument: {
				content: pdfBuffer.toString('base64'),
				mimeType: 'application/pdf'
			}
		});

		console.log('[DEBUG] Successfully received response from Google Document AI.');

		const { document } = result;
		if (!document || !document.entities) {
			throw error(500, { message: 'Document AI returned an invalid response.' });
		}

		// Log the full entities array to see what the AI is extracting.
		console.log('[DEBUG] Document AI entities:', JSON.stringify(document.entities, null, 2));

		// Helper function to extract a field from the Document AI entities
		const getEntity = (type: string): string | null => {
			const entity = document.entities?.find((e) => e.type === type);
			return entity?.mentionText?.trim() || null;
		};

		// Extract the fields using the helper. The 'type' string (e.g., 'contract_name')
		// must match the field name you defined in your Google Form Parser schema.
		const extractedData = {
			contractNumber: getEntity('Polisa_numer'), // This must match the label in your trained processor
			documentTitle: getEntity('contract_name'),
			vendor: getEntity('vendor_name'),
			startDate: getEntity('start_date'),
			endDate: getEntity('end_date'),
			value: getEntity('contract_value'),
			renewalTerm: getEntity('renewal_type'),
			noticePeriod: getEntity('notice_period_days'),
			contractType: getEntity('contract_type')
		};

		// --- DATA MAPPING CONFIGURATION ---
		// Map the extracted data to our database schema fields.
		const mappedData = {
			contract_number: extractedData.contractNumber,
            contract_name: extractedData.documentTitle,
			vendor_name: extractedData.vendor,
			start_date: extractedData.startDate,
			end_date: extractedData.endDate,
			contract_value: extractedData.value
				? parseFloat(extractedData.value.replace(/[^0-9.-]+/g, ''))
				: null,
			contract_type: extractedData.contractType,
			renewal_type: extractedData.renewalTerm,
			notice_period_days: extractedData.noticePeriod
				? parseInt(extractedData.noticePeriod, 10)
				: 30
		};

		return json({
			message: 'Contract processed successfully.',
			data: mappedData
		});
	} catch (e: any) {
		// Log the full error to the server console for debugging
		console.error('Error processing contract:', e);

		// Return a structured error to the client
		throw error(e.status || 500, e.body || { message: 'An internal error occurred.' });
	}
};
