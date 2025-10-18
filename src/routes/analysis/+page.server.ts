/**
 * This server-side script is responsible for loading and preparing the data
 * for the Financial Analysis dashboard. It fetches all contracts from the
 * database, processes them based on the selected date range from the URL,
 * and calculates several Key Performance Indicators (KPIs). These are then
 * passed to the `+page.svelte` component for display.
 */

import type { PageServerLoad } from './$types';
import { supabase } from '$lib/server/supabase';
import {
	isPast,
	getYear,
	subMonths,
	startOfMonth,
	format,
	isWithinInterval,
	startOfYear,
	endOfYear,
	endOfMonth,
	subYears,
	differenceInCalendarMonths,
	addMonths,
	parseISO,
	max,
	min,
	differenceInDays
} from 'date-fns';

export const load: PageServerLoad = async ({ url }) => {
	// --- Date Filter Setup ---
	// Read start and end dates from URL search parameters.
	const startDateParam = url.searchParams.get('start');
	const endDateParam = url.searchParams.get('end');
	const { data: contracts, error } = await supabase.from('contracts').select('*');

	if (error) {
		console.error('Error fetching contracts for analysis:', error);
		// In case of an error, return a default structure that matches the success case.
		// The page component expects these values to be nested under a `data` property.
		return {
			totalActiveContractValue: 0,
			monthlyRecurringCost: 0,
			totalSpendInRange: 0,
			spendByType: [],
			spendTrend: { labels: [], data: [] },
			top5Contracts: [],
			displayInterval: ''
		};
	}

	// --- KPI Calculations ---
	// Note: ACV and MRC are snapshots of *current* commitments.
	// They are intentionally NOT affected by the date range filter.

	// Filter for contracts that are currently active.
	const currentlyActiveContracts = (contracts ?? []).filter((c) => {
		if (!c.start_date) return false; // A contract can't be active without a start date.
		const today = new Date();
		const contractStart = parseISO(c.start_date);
		const contractEnd = c.end_date ? parseISO(c.end_date) : new Date('2999-12-31');
		return contractStart <= today && today <= contractEnd;
	});

	const monthlyRecurringCost = currentlyActiveContracts
		.filter((c) => c.payment_terms === 'monthly' && c.contract_value)
		.reduce((sum, c) => sum + c.contract_value, 0);

	const totalActiveContractValue = currentlyActiveContracts.reduce((sum, c) => {
		return sum + (c.contract_value || 0);
	}, 0);

	// --- Date Range Interval ---
	// Establish the date interval for filtering. Default to the last 12 months if not provided.
	const now = new Date();
	const interval = {
		start: startDateParam ? parseISO(startDateParam) : startOfYear(now),
		end: endDateParam ? parseISO(endDateParam) : now // Default end is today
	};

	// --- Filter Contracts by Date Range ---
	// A contract is considered relevant for the period if it was active at any point during the interval.
	const contractsInDateRange = (contracts ?? []).filter((contract) => {
		if (!contract.start_date) return false;
		const contractStart = parseISO(contract.start_date);
		const contractEnd = contract.end_date ? parseISO(contract.end_date) : new Date('2999-12-31');

		// Check for overlap: (StartA <= EndB) and (EndA >= StartB)
		return contractStart <= interval.end && contractEnd >= interval.start;
	});

	// --- Top 5 Contracts Calculation ---
	// This is now based on contracts active within the selected date range.
	const top5Contracts = [...contractsInDateRange]
		.sort((a, b) => (b.contract_value || 0) - (a.contract_value || 0))
		.slice(0, 5);

	// --- Chart & In-Range KPI Calculations ---
	// Calculate spend for charts and the "Total Spend (in range)" KPI simultaneously.
	let totalSpendInRange = 0;
	const vendorSpend = new Map<string, number>();
	const typeSpend = new Map<string, number>();
	for (const contract of contractsInDateRange) {
		if (!contract.contract_value) continue;

		const vendorName = contract.vendor_name || 'Unknown Vendor';
		const typeName = contract.contract_type || 'Uncategorized';
		let spend = 0;

		if (contract.payment_terms === 'one_time' || contract.payment_terms === 'yearly') {
			// For one-time and yearly contracts, the full value is recognized on the start date.
			// We only include it in spend charts if the start date is within the filtered interval.
			if (contract.start_date && isWithinInterval(parseISO(contract.start_date), interval)) {
				spend = contract.contract_value;
			}
		} else if (contract.payment_terms === 'monthly') {
			// For monthly contracts, calculate the prorated spend that occurred *within* the selected date interval.
			const contractStartDate = parseISO(contract.start_date);
			const contractEndDate = contract.end_date ? parseISO(contract.end_date) : new Date('2999-12-31');

			// Determine the actual start and end dates for the overlap period.
			const overlapStartDate = max([contractStartDate, interval.start]);
			const overlapEndDate = min([contractEndDate, interval.end]);

			// If there is a valid overlap...
			if (overlapStartDate < overlapEndDate) {
				const monthlyCost = contract.contract_value;
				// Calculate the number of full calendar months in the overlap.
				// We add 1 because differenceInCalendarMonths is zero-based (e.g., Jan to Feb is 1).
				const monthsInOverlap = differenceInCalendarMonths(overlapEndDate, overlapStartDate) + 1;
				const calculatedSpend = monthlyCost * monthsInOverlap;
				spend = Math.round(calculatedSpend * 100) / 100; // Round to two decimal places
			}
		}

		if (spend > 0) {
			vendorSpend.set(vendorName, (vendorSpend.get(vendorName) || 0) + spend);
			typeSpend.set(typeName, (typeSpend.get(typeName) || 0) + spend);
			totalSpendInRange += spend;
		}
	}

	const spendByVendor = Array.from(vendorSpend, ([name, total]) => ({ name, total })).sort(
		(a, b) => b.total - a.total
	);
	const spendByType = Array.from(typeSpend, ([name, total]) => ({ name, total })).sort(
		(a, b) => b.total - a.total
	);

	// 2. Spend Trend (dynamically calculated for the selected interval)
	const trendBuckets = new Map<string, number>();
	const trendLabels: string[] = [];
	const monthsInTrend = differenceInCalendarMonths(interval.end, interval.start);

	// Initialize monthly buckets for the selected date range
	for (let i = 0; i <= monthsInTrend; i++) {
		const date = addMonths(startOfMonth(interval.start), i);
		const label = format(date, 'MMM yy');
		trendLabels.push(label);
		trendBuckets.set(format(date, 'yyyy-MM'), 0);
	}

	for (const contract of contractsInDateRange) {
		if (!contract.contract_value || !contract.start_date) continue;

		const contractStart = parseISO(contract.start_date);
		const contractEnd = contract.end_date ? parseISO(contract.end_date) : new Date('2999-12-31');

		if (contract.payment_terms === 'one_time' || contract.payment_terms === 'yearly') {
			const monthKey = format(contractStart, 'yyyy-MM');
			if (trendBuckets.has(monthKey)) {
				trendBuckets.set(monthKey, trendBuckets.get(monthKey)! + contract.contract_value);
			}
		} else if (contract.payment_terms === 'monthly') {
			// For monthly contracts, find the months it was active within the trend's date range.
			const trendInterval = { start: startOfMonth(interval.start), end: endOfMonth(interval.end) };
			const effectiveStart = max([startOfMonth(contractStart), trendInterval.start]);
			const effectiveEnd = min([contractEnd, trendInterval.end]);

			let currentMonth = effectiveStart;
			while (currentMonth <= effectiveEnd) {
				const monthKey = format(currentMonth, 'yyyy-MM');
				if (trendBuckets.has(monthKey)) {
					trendBuckets.set(monthKey, trendBuckets.get(monthKey)! + contract.contract_value);
				}
				currentMonth = addMonths(currentMonth, 1);
			}
		}
	}

	const spendTrend = {
		labels: trendLabels,
		data: Array.from(trendBuckets.values())
	};

	// Format the date range for display in chart titles
	const displayInterval = `${format(interval.start, 'MMM yyyy')} - ${format(interval.end, 'MMM yyyy')}`;

	return {
		totalActiveContractValue,
		monthlyRecurringCost,
		totalSpendInRange,
		spendByVendor,
		spendByType,
		spendTrend,
		top5Contracts,
		displayInterval
	};
};