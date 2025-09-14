import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabase } from '$lib/server/supabase';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ params }) => {
	const { data: contract, error: fetchError } = await supabase
		.from('contracts')
		.select('*')
		.eq('id', params.id)
		.single();

	if (fetchError) {
		console.error('Error fetching contract:', fetchError);
		throw error(500, 'Failed to load contract data.');
	}

	if (!contract) {
		throw error(404, 'Contract not found');
	}

	return { contract, supabaseUrl: PUBLIC_SUPABASE_URL };
};
export const actions: Actions = {
	delete: async ({ params }) => {
		const contractId = params.id;

		if (!contractId) {
			return fail(400, { message: 'Contract ID is missing.' });
		}

		// First, delete the record from the database
		const { error: deleteError } = await supabase
			.from('contracts')
			.delete()
			.match({ id: contractId });

		if (deleteError) {
			return fail(500, {
				message: 'Failed to delete contract.',
				details: deleteError.message
			});
		}

		// On success, redirect back to the dashboard
		throw redirect(303, '/');
	}
};