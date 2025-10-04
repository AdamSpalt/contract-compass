/**
 * This server-side script handles data loading for the main dashboard page.
 * It connects to the Supabase database to fetch all contracts, sorts them
 * by their end date, and provides the data to the `+page.svelte` component.
 */

import { supabase } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { data, error } = await supabase
		.from('contracts')
		.select('*')
		.order('end_date', { ascending: true });

	if (error) console.error('Error fetching contracts:', error);

	return {
		contracts: data ?? []
	};
};