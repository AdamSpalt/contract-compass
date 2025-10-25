import { error, fail, redirect } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import type { PageServerLoad, Actions } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;
	const { data: contract, error: fetchError } = await supabase
		.from('contracts')
		.select('*, vendor_link') // Select the new vendor_link column
		.eq('id', id)
		.single();

	if (fetchError) {
		throw error(404, `Contract with id ${id} not found`);
	}

	return { contract };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const { id } = params;
		const formData = await request.formData();

		const contractName = formData.get('contract_name') as string;
		const startDate = formData.get('start_date') as string;

		// --- Basic Validation ---
		if (!contractName || contractName.trim().length === 0) {
			return fail(400, { message: 'Contract Name is required.' });
		}
		if (!startDate) {
			return fail(400, { message: 'Start Date is required.' });
		}

		// --- Update Logic ---
		const contractValue = formData.get('contract_value');
		const noticePeriod = formData.get('notice_period_days');
		const renewalType = formData.get('renewal_type') as string;
		const endDate = formData.get('end_date') as string;

		const vendorLink = formData.get('vendor_link') as string;
		const file = formData.get('contract_file') as File; // Get single uploaded file
		let file_path_to_update: string | undefined = undefined; // Use undefined to signify "no change"

		// --- File Upload Logic ---
		if (file && file.size > 0) { // Check if a file was actually provided
			// 1. Fetch the existing contract to get the old file_path for deletion
			const { data: existingContract, error: fetchError } = await supabase
				.from('contracts')
				.select('file_path')
				.eq('id', id)
				.single();

			if (fetchError) {
				return fail(404, { message: 'Original contract not found for file upload operation.' });
			}
			
			// 2. Upload the new file
			const uploadedPath = `${id}/${Date.now()}-${file.name}`;
			const { error: uploadError } = await supabase.storage
				.from('contract-files')
				.upload(uploadedPath, file);

			if (uploadError) {
				return fail(500, { message: 'Failed to upload new file.', details: uploadError.message });
			}

			// 3. If an old file existed, delete it from storage
			if (existingContract?.file_path) {
				await supabase.storage.from('contract-files').remove([existingContract.file_path]);
			}

			file_path_to_update = uploadedPath;
		}

		const updatePayload: Record<string, any> = {
			contract_name: contractName,
			contract_type: formData.get('contract_type') as string,
			contract_subtype: (formData.get('contract_subtype') as string) || null,
			vendor_name: formData.get('vendor_name') as string,
			contract_number: formData.get('contract_number') as string,
			start_date: startDate || null,
			end_date: endDate || null,
			renewal_type: renewalType || null,
			vendor_link: vendorLink || null, // Add the new vendor_link to the payload
			contract_value: contractValue && !isNaN(Number(contractValue)) ? Number(contractValue) : null,
			payment_terms: formData.get('payment_terms') as string,
			notice_period_days: noticePeriod && !isNaN(Number(noticePeriod)) ? Number(noticePeriod) : null
		};

		// Only add file_path to the update payload if new files were uploaded
		if (file_path_to_update !== undefined) {
			updatePayload.file_path = file_path_to_update;
		}

		const { error: updateError } = await supabase
			.from('contracts')
			.update(updatePayload)
			.eq('id', id);

		// Handle potential type conversion errors for contract_value and notice_period_days
		if (contractValue && isNaN(Number(contractValue))) {
			return fail(400, { message: 'Contract Value must be a valid number.' });
		}
		if (noticePeriod && isNaN(Number(noticePeriod))) {
			return fail(400, { message: 'Notice Period must be a valid number.' });
		}

		if (updateError) {
			return fail(500, { message: 'Failed to update contract.', details: updateError.message });
		}

		throw redirect(303, `/contracts/${id}`);
	}
	,
	// --- New Action for File Removal ---
	removeFile: async ({ request, params }) => {
		const { id } = params;
		const formData = await request.formData();

		// 1. Fetch the contract to get the current file_path
		const { data: contract, error: fetchError } = await supabase
			.from('contracts')
			.select('file_path') // Assuming file_path is now TEXT[]
			.eq('id', id)
			.single();

		if (fetchError || !contract) {
			return fail(404, { message: 'Contract not found for file removal.' });
		}
		
		// 2. If a file_path exists, delete the file from storage
		if (contract.file_path) {
			const { error: deleteError } = await supabase.storage
				.from('contract-files')
				.remove([contract.file_path]);

			if (deleteError) {
				return fail(500, { message: 'Failed to delete file from storage.', details: deleteError.message });
			}
		}

		// 3. Update the contract in the database to set file_path to null
		const { error: updateError } = await supabase
			.from('contracts')
			.update({ file_path: null })
			.eq('id', id);

		if (updateError) {
			return fail(500, { message: 'Failed to update contract (remove file_path from array).', details: updateError.message });
		}

		// Redirect back to the edit page to show the updated state
		throw redirect(303, `/contracts/${id}/edit`);
	}
};