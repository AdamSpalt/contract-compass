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