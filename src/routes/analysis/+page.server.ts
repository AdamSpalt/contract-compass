/**
 * This server-side script is responsible for loading and preparing the data
 * for the Financial Analysis dashboard. It fetches all contracts from the
 * database and calculates several Key Performance Indicators (KPIs) based
 * on the contract data. These KPIs are then passed to the corresponding
 * `+page.svelte` component for display.
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
	subYears,
	differenceInCalendarMonths,
	addMonths
} from 'date-fns';

export const load: PageServerLoad = async () => {
	const { data: contracts, error } = await supabase.from('contracts').select('*');

	if (error) {
		console.error('Error fetching contracts for analysis:', error);
		// In case of an error, return a default structure that matches the success case.
		// The page component expects these values to be nested under a `data` property.
		return {
			monthlyRecurringCost: 0,
			totalAnnualizedSpend: 0,
			oneTimeContractsCountYTD: 0, // This will be removed, but need to keep shape for now
			oneTimeContractsValueYTD: 0,
			spendByType: [],
			spendTrend: { labels: [], data: [] },
			allTypes: [],
			top5Contracts: []
		};
	}

	// --- KPI Calculations ---
	// Note: Annualized and Monthly Recurring costs are snapshots of *current* commitments
	// and are not affected by date range filters. One-Time spend is affected.

	// Filter for contracts that are currently active.
	const activeContracts = (contracts ?? []).filter((c) => {
		if (!c.end_date) return true; // No end date means it's active
		return !isPast(new Date(c.end_date + 'T00:00:00'));
	});

	const monthlyRecurringCost = activeContracts
		.filter((c) => c.payment_terms === 'monthly' && c.contract_value)
		.reduce((sum, c) => sum + c.contract_value, 0);

	const totalAnnualizedSpend = activeContracts
		.filter((c) => c.payment_terms === 'monthly' || c.payment_terms === 'yearly')
		.reduce((sum, c) => {
			if (c.payment_terms === 'monthly' && c.contract_value) {
				return sum + c.contract_value * 12;
			}
			if (c.payment_terms === 'yearly' && c.contract_value) {
				return sum + c.contract_value;
			}
			return sum;
		}, 0);

	// --- Date Range Interval ---
	const now = new Date();
	const interval = { start: subMonths(now, 12), end: now };
	const trendInterval = { start: subMonths(now, 12), end: now }; // Keep trend line as a rolling 12 months for now

	const currentYearOneTimeContracts = (contracts ?? []).filter(
		(c) =>
			c.payment_terms === 'one_time' &&
			c.start_date &&
			getYear(new Date(c.start_date + 'T00:00:00')) === getYear(now)
	);

	const oneTimeContractsValueYTD = currentYearOneTimeContracts.reduce(
		(sum, c) => sum + (c.contract_value || 0),
		0
	);

	// --- Top 5 Contracts Calculation ---
	const top5Contracts = [...activeContracts]
		.sort((a, b) => (b.contract_value || 0) - (a.contract_value || 0))
		.slice(0, 5);

	// --- Chart Data Calculations ---
	const vendorSpend = new Map<string, number>();
	const typeSpend = new Map<string, number>();

	for (const contract of contracts ?? []) {
		if (!contract.contract_value) continue;

		const vendorName = contract.vendor_name || 'Unknown Vendor';
		const typeName = contract.contract_type || 'Uncategorized';
		let spend = 0;

		if (contract.payment_terms === 'one_time') {
			// Check if the one-time contract is in the interval for the charts
			if (contract.start_date && isWithinInterval(new Date(contract.start_date + 'T00:00:00'), interval)) {
				spend = contract.contract_value;
			}
		} else {
			// For recurring contracts, calculate the spend that occurred *within* the selected date interval.
			const contractStartDate = new Date(contract.start_date + 'T00:00:00');
			const contractEndDate = contract.end_date ? new Date(contract.end_date + 'T00:00:00') : new Date('2999-12-31');

			// Determine the actual start and end dates for the overlap period.
			const overlapStartDate = contractStartDate > interval.start ? contractStartDate : interval.start;
			const overlapEndDate = contractEndDate < interval.end ? contractEndDate : interval.end;

			// If there is a valid overlap...
			if (overlapStartDate < overlapEndDate) {
				const monthlyCost =
					contract.payment_terms === 'monthly' ? contract.contract_value : contract.contract_value / 12;
				// Calculate the number of months in the overlap period.
				// Using differenceInCalendarMonths is more robust for this kind of calculation.
				let monthsInInterval = differenceInCalendarMonths(overlapEndDate, overlapStartDate);
				// Add 1 to make it inclusive, as differenceInCalendarMonths is 0 for the same month.
				if (monthsInInterval >= 0) monthsInInterval += 1;
				spend = monthlyCost * Math.max(0, monthsInInterval);
			}
		}

		if (spend > 0) {
			vendorSpend.set(vendorName, (vendorSpend.get(vendorName) || 0) + spend);
			typeSpend.set(typeName, (typeSpend.get(typeName) || 0) + spend);
		}
	}

	const spendByVendor = Array.from(vendorSpend, ([name, total]) => ({ name, total })).sort(
		(a, b) => b.total - a.total
	);
	const spendByType = Array.from(typeSpend, ([name, total]) => ({ name, total }));

	// 2. Spend Trend (Last 12 Months)
	const trendBuckets = new Map<string, number>();
	const trendLabels: string[] = [];

	// Initialize 12 monthly buckets
	for (let i = 11; i >= 0; i--) {
		const date = subMonths(trendInterval.end, i);
		const label = format(date, 'MMM yy');
		trendLabels.push(label);
		trendBuckets.set(format(date, 'yyyy-MM'), 0);
	}

	for (const contract of contracts ?? []) {
		if (!contract.contract_value || !contract.start_date) continue;

		const startDate = new Date(contract.start_date);
		const endDate = contract.end_date ? new Date(contract.end_date) : new Date('2999-12-31');

		if (contract.payment_terms === 'one_time') {
			const monthKey = format(startDate, 'yyyy-MM');
			if (trendBuckets.has(monthKey)) {
				trendBuckets.set(monthKey, trendBuckets.get(monthKey)! + contract.contract_value);
			}
		} else {
			const monthlyCost = contract.payment_terms === 'monthly' ? contract.contract_value : contract.contract_value / 12;
			for (const [monthKey, total] of trendBuckets.entries()) {
				const monthDate = new Date(monthKey + '-01T00:00:00');
				// Add cost if the contract is active during this month
				if (isWithinInterval(monthDate, { start: startOfMonth(startDate), end: endDate })) {
					trendBuckets.set(monthKey, total + monthlyCost);
				}
			}
		}
	}

	const spendTrend = {
		labels: trendLabels,
		data: Array.from(trendBuckets.values())
	};

	// --- Data for Filter Dropdowns ---
	const allTypes = [...new Set((contracts ?? []).map((c) => c.contract_type).filter(Boolean))].sort() as string[];

	return {
		monthlyRecurringCost,
		totalAnnualizedSpend,
		oneTimeContractsValueYTD,
		spendByVendor,
		spendByType,
		spendTrend,
		allTypes,
		top5Contracts
	};
};