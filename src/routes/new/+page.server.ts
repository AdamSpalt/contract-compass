import { supabase } from '$lib/supabaseClient.ts';
import { redirect, fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

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

		const renewalType = formData.get('renewal_type') as string;
		const endDate = formData.get('end_date') as string;
		const contractValue = formData.get('contract_value');
		const noticePeriod = formData.get('notice_period_days');

		const contractData = {
			contract_name: formData.get('contract_name') as string,
			contract_type: formData.get('contract_type') as string,
			vendor_name: formData.get('vendor_name') as string,
			contract_number: formData.get('contract_number') as string,
			start_date: formData.get('start_date') || null,
			end_date: renewalType === 'specific' ? endDate || null : null,
			renewal_type: renewalType || null,
			file_path: filePath,
			contract_value: contractValue ? Number(contractValue) : null,
			payment_terms: formData.get('payment_terms') as string,
			notice_period_days: noticePeriod ? Number(noticePeriod) : null
		};

		const { error } = await supabase.from('contracts').insert([contractData]);

		if (error) {
			return fail(500, { message: 'Could not save the contract.', details: error.message });
		}

		throw redirect(303, '/');
	}
};