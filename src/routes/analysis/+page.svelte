<!--
  This file defines the user interface for the Financial Analysis Dashboard.
  It receives pre-calculated Key Performance Indicators (KPIs) and other data
  from its corresponding `+page.server.ts` file. The primary role of this
  component is to display this financial data in a clear and understandable
  way, using components like StatCard and charts.
-->
<script lang="ts" generics="Data extends Record<string, any>">
	import StatCard from '$lib/components/StatCard.svelte';
	import Chart from '$lib/components/Chart.svelte';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { subMonths, format as formatDate, startOfYear } from 'date-fns';

	// --- Date Filter State & Logic ---
	// This section adds the UI controls and state management for the date range filter.

	/**
	 * Helper function to format a date as 'yyyy-MM-dd' for input fields.
	 * @param {Date} date - The date to format.
	 * @returns {string} The formatted date string.
	 */
	function toInputFormat(date: Date): string {
		return formatDate(date, 'yyyy-MM-dd');
	}

	// Initialize start and end dates from URL search params, or set sensible defaults.
	const now = new Date();
	let startDate = $page.url.searchParams.get('start') || toInputFormat(startOfYear(now));
	let endDate = $page.url.searchParams.get('end') || toInputFormat(now);

	/**
	 * Applies the selected date filter by navigating to a new URL with the
	 * start and end dates as search parameters. This triggers a server-side data reload.
	 */
	function applyDateFilter() {
		const newUrl = new URL($page.url);
		newUrl.searchParams.set('start', startDate);
		newUrl.searchParams.set('end', endDate);
		goto(newUrl, { keepFocus: true, noScroll: true });
	}

	const { data }: { data: PageData } = $props();

	/**
	 * Formats a number as Polish Złoty (PLN) currency.
	 * @param {number} value - The number to format.
	 * @returns {string} The formatted currency string.
	 */
	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value);
	}

	// --- Chart Data & Options ---

	// Data for the "Spend by Vendor" bar chart
	const spendByVendorChartData = $derived({
		labels: data?.spendByVendor.slice(0, 10).map((v) => v.name) ?? [], // Top 10 vendors
		datasets: [
			{
				label: `Total Spend (${data?.displayInterval})`,
				data: data?.spendByVendor.slice(0, 10).map((v) => v.total) ?? [],
				backgroundColor: [
					'rgba(30, 144, 255, 0.6)', // Dodger Blue
					'rgba(0, 206, 209, 0.6)', // Dark Turquoise
					'rgba(60, 179, 113, 0.6)', // Medium Sea Green
					'rgba(106, 90, 205, 0.6)', // Slate Blue
					'rgba(218, 112, 214, 0.6)', // Orchid
					'rgba(255, 127, 80, 0.6)', // Coral
					'rgba(70, 130, 180, 0.6)', // Steel Blue
					'rgba(32, 178, 170, 0.6)', // Light Sea Green
					'rgba(219, 112, 147, 0.6)', // Pale Violet Red
					'rgba(123, 104, 238, 0.6)' // Medium Slate Blue
				],
				borderColor: 'rgba(54, 162, 235, 0)', // Hide border or set to a single color if preferred
				borderWidth: 1
			}
		]
	});

	const spendByVendorChartOptions = {
		indexAxis: 'y' as const, // This makes the bar chart horizontal
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false
			},
			tooltip: {
				callbacks: {
					label: (context) => formatCurrency(context.parsed.x)
				}
			}
		},
		scales: {
			x: {
				beginAtZero: true,
				ticks: {
					// Format the X-axis labels as currency
					callback: (value) => new Intl.NumberFormat('pl-PL').format(typeof value === 'number' ? value : 0)
				}
			}
		}
	};

	// Data for the "Spend by Type" donut chart
	const spendByTypeChartData = $derived({
		labels: data?.spendByType.map((t) => t.name) ?? [],
		datasets: [
			{
				data: data?.spendByType.map((t) => t.total) ?? [],
				backgroundColor: [
					'rgba(255, 99, 132, 0.6)',
					'rgba(54, 162, 235, 0.6)',
					'rgba(255, 206, 86, 0.6)',
					'rgba(75, 192, 192, 0.6)',
					'rgba(153, 102, 255, 0.6)',
					'rgba(255, 159, 64, 0.6)'
				]
			}
		]
	});

	const spendByTypeChartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			tooltip: {
				callbacks: {
					label: (context) => `${context.label}: ${formatCurrency(context.parsed)}`
				}
			}
		}
	};

	// Data for the "Spend Trend" line chart
	const spendTrendChartData = $derived({
		labels: data?.spendTrend.labels ?? [],
		datasets: [
			{
				label: 'Total Spend per Month',
				data: data?.spendTrend.data ?? [],
				fill: true,
				backgroundColor: 'rgba(75, 192, 192, 0.2)',
				borderColor: 'rgb(75, 192, 192)',
				tension: 0.1,
				pointBackgroundColor: 'rgb(75, 192, 192)',
				pointBorderColor: '#fff',
				pointHoverBackgroundColor: '#fff',
				pointHoverBorderColor: 'rgb(75, 192, 192)'
			}
		]
	});

	const spendTrendChartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false
			},
			tooltip: {
				callbacks: {
					label: (context) => formatCurrency(context.parsed.y)
				}
			}
		},
		scales: {
			y: {
				beginAtZero: true,
				ticks: {
					stepSize: 100,
					// Format the Y-axis labels as currency
					callback: (value) => formatCurrency(typeof value === 'number' ? value : 0)
				}
			}
		}
	};
</script>

<main>
	<h1>Insights</h1>
	<p>Unlock financial insights from your contracts. Visualize spending trends, vendor costs, and your most valuable agreements.</p>

	<!-- Date Filter Controls -->
	<div class="filter-container">
		<div class="filter-group">
			<label for="start-date">Start Date</label>
			<input type="date" id="start-date" bind:value={startDate} />
		</div>
		<div class="filter-group">
			<label for="end-date">End Date</label>
			<input type="date" id="end-date" bind:value={endDate} />
		</div>
		<button on:click={applyDateFilter} class="apply-button">Apply</button>
	</div>
	<!-- End Date Filter Controls -->

	<div class="stats-container">
		<StatCard
			label="Monthly Recurring Cost"
			subLabel="(Live Snapshot)"
			value={formatCurrency(data?.monthlyRecurringCost ?? 0)}
			tooltipText="A live snapshot of your current monthly recurring costs. This value is NOT affected by the date filter."
		/>
		<StatCard
			label="Total Annualized Spend"
			subLabel="(Live Snapshot)"
			value={formatCurrency(data?.totalAnnualizedSpend ?? 0)}
			tooltipText="A live snapshot of your projected spend over the next 12 months. This value is NOT affected by the date filter."
		/>
		<StatCard
			label="One-Time Spend (in range)"
			subLabel="(In Selected Range)"
			value={formatCurrency(data?.oneTimeSpendInRange ?? 0)}
			tooltipText="The total value of contracts with a 'one-time' payment term that started in the selected date range."
		/>
	</div>

	<!-- Chart Grid -->
	<div class="charts-container">
		<div class="chart-wrapper large">
			<h2>Spend by Vendor (Top 10)</h2>
			<div class="chart-inner-container">
				<Chart type="bar" data={spendByVendorChartData} options={spendByVendorChartOptions} />
			</div>
		</div>

		<div class="chart-wrapper">
			<h2>Spend by Contract Type</h2>
			<div class="chart-inner-container">
				<Chart type="doughnut" data={spendByTypeChartData} options={spendByTypeChartOptions} />
			</div>
		</div>

		<div class="chart-wrapper large">
			<h2>Total Spend Trend</h2>
			<div class="chart-inner-container">
				<Chart type="line" data={spendTrendChartData} options={spendTrendChartOptions} />
			</div>
		</div>

		<div class="chart-wrapper">
			<h2>Top 5 Highest Value Contracts</h2>
			<ul class="top-contracts-list">
				{#if data?.top5Contracts.length}
					{#each data.top5Contracts as contract}
						<li>
							<a href="/contracts/{contract.id}?from=analysis">
								<div class="contract-info">
									<span class="contract-name">{contract.contract_name}</span>
									<span class="vendor-name">Vendor: {contract.vendor_name}</span>
								</div>
								<div class="contract-value">
									{formatCurrency(contract.contract_value ?? 0)}
								</div>
							</a>
						</li>
					{/each}
				{:else}
					<p class="no-data-placeholder">No active contracts to display.</p>
				{/if}
			</ul>
		</div>
	</div>
</main>

<style>
	main {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 1.5rem;
		font-family: sans-serif;
	}

	.stats-container {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin: 2rem 0;
	}

	.filter-container {
		display: flex;
		gap: 1rem;
		align-items: flex-end;
		margin: 2rem 0;
		padding: 1rem 1.5rem;
		background-color: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 6px;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
	}

	.filter-group label {
		font-size: 0.875rem;
		color: #555;
		margin-bottom: 0.25rem;
		font-weight: 500;
	}

	.filter-group input[type='date'] {
		padding: 0.5rem;
		font-size: 0.9rem;
		border-radius: 5px;
		border: 1px solid #ccc;
	}

	.apply-button {
		padding: 0.6rem 1.2rem;
		font-weight: 500;
		color: white;
		background-color: #007bff;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	.apply-button:hover {
		background-color: #0056b3;
	}

	p {
		color: #555;
		margin-top: 1rem;
	}

	.charts-container {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1.5rem;
	}

	.chart-wrapper {
		background-color: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.chart-wrapper.full-width {
		grid-column: 1 / -1;
	}

	.chart-wrapper h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		font-size: 1.2rem;
		font-weight: 600;
		color: #333;
	}

	.chart-inner-container {
		height: 350px; /* Give charts a consistent height */
	}

	.top-contracts-list {
		list-style: none;
		padding: 0;
		margin: 0;
		height: 350px;
		overflow-y: auto;
	}

	.top-contracts-list li a {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		text-decoration: none;
		color: inherit;
		border-radius: 4px; /* Add a slight radius for the hover effect */
	}

	.top-contracts-list li {
		border-bottom: 1px solid #f0f0f0;
		transition: background-color 0.2s ease-in-out;
	}

	.top-contracts-list li a:hover {
		background-color: #f9f9f9;
	}

	.top-contracts-list li:last-child {
		border-bottom: none;
	}

	.contract-info {
		display: flex;
		flex-direction: column;
	}

	.contract-name {
		font-weight: 600;
		color: #333;
	}

	.vendor-name {
		font-size: 0.875rem;
		color: #777;
	}

	.contract-value {
		font-weight: 600;
		font-size: 0.9rem;
		background-color: rgba(54, 162, 235, 0.1);
		color: #005a9e;
		padding: 0.25rem 0.6rem;
		border-radius: 12px;
	}

	@media (max-width: 900px) {
		.charts-container {
			grid-template-columns: 1fr;
		}
	}
</style>