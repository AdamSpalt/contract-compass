import { error, fail, redirect } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import type { PageServerLoad, Actions } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;
	const { data: contract, error: fetchError } = await supabase
		.from('contracts')
		.select('*')
		.eq('id', id)
		.single();

	if (fetchError) {
		throw error(404, `Contract with id ${id} not found`);
	}

	return { contract };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
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

		const { error: updateError } = await supabase
			.from('contracts')
			.update({
				contract_name: contractName,
				contract_type: formData.get('contract_type') as string,
				contract_subtype: (formData.get('contract_subtype') as string) || null,
				vendor_name: formData.get('vendor_name') as string,
				contract_number: formData.get('contract_number') as string,
				start_date: startDate || null,
				end_date: endDate || null,
				renewal_type: renewalType || null,
				contract_value: contractValue ? Number(contractValue) : null,
				payment_terms: formData.get('payment_terms') as string,
				notice_period_days: noticePeriod ? Number(noticePeriod) : null
			})
			.eq('id', id);

		if (updateError) {
			return fail(500, { message: 'Failed to update contract.', details: updateError.message });
		}

		throw redirect(303, `/contracts/${id}`);
	}
};