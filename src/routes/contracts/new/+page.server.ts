import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types.ts';
import { supabase } from '$lib/server/supabase';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const contractName = formData.get('contract_name') as string;
		const startDate = formData.get('start_date') as string;
		const endDate = formData.get('end_date') as string;
		const endDateType = formData.get('endDateType') as string; // 'specific', 'monthly', 'yearly'

		// --- Validation Logic ---
		if (!contractName || contractName.trim().length === 0) {
			return fail(400, {
				message: 'Validation Error',
				details: 'Contract Name is a required field.'
			});
		}

		if (!startDate) {
			return fail(400, {
				message: 'Validation Error',
				details: 'Start Date is a required field.'
			});
		}

		// End Date is required only if the contract does not renew
		if (endDateType === 'specific' && !endDate) {
			return fail(400, {
				message: 'Validation Error',
				details: 'End Date is required when the contract is set to "Does Not Renew".'
			});
		}

		// If both dates exist, ensure end_date is not before start_date
		if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
			return fail(400, {
				message: 'Validation Error',
				details: 'End Date cannot be before the Start Date.'
			});
		}

		// --- If validation passes, proceed with existing logic (e.g., saving to DB) ---
		const file = formData.get('contract_file') as File;
		let filePath: string | null = null;

		if (file && file.size > 0) {
			const newFileName = `${Date.now()}-${file.name}`;
			const { data: uploadData, error: uploadError } = await supabase.storage
				.from('contract-files')
				.upload(newFileName, file);

			if (uploadError) {
				return fail(500, { message: 'Could not upload file.', details: uploadError.message });
			}
			filePath = uploadData.path;
		}

		const contractValue = formData.get('contract_value');
		const noticePeriod = formData.get('notice_period_days');

		const { error: insertError } = await supabase.from('contracts').insert([
			{
				contract_name: contractName,
				contract_type: formData.get('contract_type') as string,
				vendor_name: formData.get('vendor_name') as string,
				contract_number: formData.get('contract_number') as string,
				start_date: startDate || null,
				end_date: endDateType === 'specific' ? endDate || null : null,
				renewal_type: endDateType === 'specific' ? null : endDateType,
				file_path: filePath,
				contract_value: contractValue ? Number(contractValue) : null,
				payment_terms: formData.get('payment_terms') as string,
				notice_period_days: noticePeriod ? Number(noticePeriod) : null
			}
		]);

		if (insertError) {
			return fail(500, { message: 'Could not save the contract.', details: insertError.message });
		}

		// On success, redirect back to the dashboard
		throw redirect(303, '/');
	}
};