import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { env } from '$env/dynamic/private';

// Initialize the Google Document AI client
const docAIClient = new DocumentProcessorServiceClient({
    apiEndpoint: `${env.GOOGLE_LOCATION}-documentai.googleapis.com`,
    credentials: JSON.parse(env.GOOGLE_CREDENTIALS_JSON)
});

export const POST: RequestHandler = async ({ request }) => {
    try {
        const formData = await request.formData();
        const pdfFile = formData.get('contract_pdf');

        if (!pdfFile || !(pdfFile instanceof File)) {
            throw error(400, { message: 'No PDF file uploaded.' });
        }

        const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());

        // --- Google Document AI Processing ---
        console.log('[DEBUG] Preparing to call Google Document AI...');
        const processorName = `projects/${env.GOOGLE_PROJECT_ID}/locations/${env.GOOGLE_LOCATION}/processors/${env.GOOGLE_PROCESSOR_ID}`;
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
        if (!document) {
            throw error(500, { message: 'Document AI returned an invalid response.' });
        }

        // --- CORRECTED DATA EXTRACTION LOGIC ---

        // <-- MODYFIKACJA: Przeszukaj WSZYSTKIE strony dokumentu i zbierz wszystkie pola formularzy.
        // Używamy flatMap, aby połączyć tablice formFields z każdej strony w jedną dużą tablicę.
        const allFormFields = document.pages?.flatMap(page => page.formFields || []) || [];

        // <-- MODYFIKACJA: Dodaj ten log, aby zobaczyć, czy 'allFormFields' zawiera dane.
        console.log('[DEBUG] Found form fields:', JSON.stringify(allFormFields, null, 2));

        if (!allFormFields.length) {
            // Zmieniono warunek z !formFields na !allFormFields.length
            throw error(500, { message: 'Document AI response did not contain any formFields. Check your Processor ID.' });
        }

        /**
         * Searches the formFields array and returns the value for a given key.
         * @param {string | string[]} fieldNameKeys - A single key or an array of possible keys.
         * @returns {string|null} - The found value (mentionText) or null
         */
        const getEntity = (fieldNameKeys: string | string[]): string | null => {
            const keys = Array.isArray(fieldNameKeys) ? fieldNameKeys : [fieldNameKeys];

            for (const key of keys) {
                const foundField = allFormFields.find(
                    (field) => field.fieldName?.textAnchor?.content?.trim() === key
                );

                if (foundField?.fieldValue) {
                    const value =
                        foundField.fieldValue.mentionText?.trim() ||
                        foundField.fieldValue.textAnchor?.content?.trim() ||
                        null;
                    if (value) {
                        return value; // Return the first value found
                    }
                }
            }

            return null; // Not found for any of the keys
        };

        // Ta sekcja jest już poprawna i będzie działać z funkcją getEntity
      const extractedData = {
    // Pola z ubezpieczenia (zgodne z Twoim JSON-em):
    contractNumber: getEntity(['Polisa numer', 'Nr Polisy', 'Numer polisy', 'ID polisy', 'Nr ubezpieczenia', 'Numer kontraktu', 'Policy No.', 'Contract Number', 'Policy ID', 'Reference Number']),
    policyTerm: getEntity(['Okres', 'Okres ubezpieczenia', 'Początek ochrony', 'Start Date', 'Effective Date', 'Policy Start Date', 'Data rozpoczęcia']),
    usedAs: getEntity('użytkowany jako:'), // <-- POPRAWKA (dodano dwukropek)
    driverLicenseYear: getEntity('Rok uzyskania prawa jazdy'),
    totalPremium: getEntity(['Całkowita składka do zapłacenia (w złotych)', 'Całkowita składka', 'Składka do zapłaty', 'Suma należna', 'Total Premium', 'Amount Due', 'Gross Premium', 'Total Sum']),
    paymentMethod: getEntity('Metoda płatności'),
    paymentDueDate: getEntity('Termin płatności'),
    ocPremium: getEntity('Składka za OC'),
    autoAssistance: getEntity('Auto Assistance (8)'),

    // Stare pola (prawdopodobnie zwrócą null, co jest OK)
    documentTitle: getEntity('contract_name'),
    vendor: getEntity(['vendor_name', 'Ubezpieczający', 'Ubezpieczyciel','na rzecz']),
    startDate: getEntity('start_date'),
    endDate: getEntity('end_date'),
    value: getEntity('contract_value'),
    renewalTerm: getEntity('renewal_type'),
    noticePeriod: getEntity('notice_period_days'),
    contractType: getEntity('contract_type')
};

        // --- NEW: Parse policyTerm to extract start_date and end_date ---
        let startDate = null;
        let endDate = null;

        if (extractedData.policyTerm) {
            // Use a regular expression to find all dates in DD.MM.YYYY format
            const datesFound = extractedData.policyTerm.match(/\d{2}\.\d{2}\.\d{4}/g);

            if (datesFound && datesFound.length >= 2) {
                // The form expects dates in YYYY-MM-DD format. We need to convert them.
                const [startDay, startMonth, startYear] = datesFound[0].split('.');
                startDate = `${startYear}-${startMonth}-${startDay}`;

                const [endDay, endMonth, endYear] = datesFound[1].split('.');
                endDate = `${endYear}-${endMonth}-${endDay}`;
            }
        }

        // --- CORRECTED MAPPING TO MATCH THE SVELTE FORM ---
        // The keys in this object MUST match the variable names in `routes/contracts/new/+page.svelte`
        const mappedData = {
            // --- Primary Fields ---
            vendor_name: extractedData.vendor,
            start_date: startDate,
            end_date: endDate,
            contract_number: extractedData.contractNumber,
            contract_value: extractedData.totalPremium
                ? parseFloat(extractedData.totalPremium.replace(/\s/g, '').replace(',', '.'))
                : null,
            
            // --- Other Fields from Insurance Policy ---
            // These don't have direct inputs on the form, but could be used later or logged.
            // For now, we'll keep them but they won't pre-fill anything.
            policy_term: extractedData.policyTerm,
            oc_premium: extractedData.ocPremium
                ? parseFloat(extractedData.ocPremium.replace(/\s/g, '').replace(',', '.')) 
                : null,
            due_date: extractedData.paymentDueDate, 
            payment_method: extractedData.paymentMethod,
            vehicle_usage: extractedData.usedAs,
            driver_license_year: extractedData.driverLicenseYear,
            auto_assistance: extractedData.autoAssistance,
        };

        return json({
            message: 'Contract processed successfully.',
            data: mappedData
        });
    } catch (e: any) {
        console.error('Error processing contract:', e);
        throw error(e.status || 500, e.body || { message: 'An internal error occurred.' });
    }
};