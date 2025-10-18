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
	import { page, navigating } from '$app/stores';
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

	// --- Interactive Chart Filters State ---
	// This section adds client-side filtering for the Spend by Vendor chart.

	// Get a list of all unique vendors from the server data.
	const allVendors = $derived(data?.spendByVendor.map((v) => v.name) ?? []);
	// State for the currently selected vendors. Initially, all are selected.
	let selectedVendors = $state([...allVendors]);

	// State to control the visibility of the custom vendor dropdown.
	let isVendorDropdownOpen = $state(false);

	// --- Contract Type Filter State ---
	const allContractTypes = $derived(data?.spendByType.map((t) => t.name) ?? []);
	let selectedContractTypes = $state([...allContractTypes]);
	let isTypeDropdownOpen = $state(false);

	// --- Click Outside Logic ---
	// This section handles closing the dropdown when the user clicks outside of it.
	let vendorFilterElement: HTMLDivElement; // A reference to the dropdown's container element.
	let typeFilterElement: HTMLDivElement; // A reference to the type dropdown's container element.

	/**
	 * Closes the vendor dropdown if a click occurs outside of its container element.
	 * @param {MouseEvent} event - The click event.
	 */
	function handleClickOutside(event: MouseEvent) {
		if (vendorFilterElement && !vendorFilterElement.contains(event.target as Node)) isVendorDropdownOpen = false;
		if (typeFilterElement && !typeFilterElement.contains(event.target as Node)) isTypeDropdownOpen = false;
	}
	// When the data from the server changes (e.g., due to date filter), reset selected vendors.
	$effect(() => {
		selectedVendors = [...allVendors];
	});

	// When the data from the server changes, reset selected contract types.
	$effect(() => {
		selectedContractTypes = [...allContractTypes];
	});

	/**
	 * Formats a number as Polish Złoty (PLN) currency.
	 * @param {number} value - The number to format.
	 * @returns {string} The formatted currency string.
	 */
	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value);
	}

	// A derived list of vendor spend data that is filtered by the user's checkbox selections.
	const filteredVendorSpend = $derived(data?.spendByVendor.filter((v) => selectedVendors.includes(v.name)) ?? []);

	// A derived list of contract type spend data that is filtered by the user's checkbox selections.
	const filteredContractTypeSpend = $derived(data?.spendByType.filter((t) => selectedContractTypes.includes(t.name)) ?? []);

	// --- Chart Data & Options ---

	// Data for the "Spend by Vendor" bar chart
	const spendByVendorChartData = $derived({
		labels: filteredVendorSpend.slice(0, 10).map((v) => v.name) ?? [], // Top 10 vendors
		datasets: [
			{
				label: `Total Spend (${data?.displayInterval})`,
				data: filteredVendorSpend.slice(0, 10).map((v) => v.total) ?? [],
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
		labels: filteredContractTypeSpend.map((t) => t.name) ?? [],
		datasets: [
			{
				data: filteredContractTypeSpend.map((t) => t.total) ?? [],
				backgroundColor: [
					'rgba(255, 99, 132, 0.7)',
					'rgba(54, 162, 235, 0.7)',
					'rgba(255, 206, 86, 0.7)',
					'rgba(75, 192, 192, 0.7)',
					'rgba(153, 102, 255, 0.7)',
					'rgba(255, 159, 64, 0.7)',
					'rgba(30, 144, 255, 0.7)',
					'rgba(0, 206, 209, 0.7)',
					'rgba(60, 179, 113, 0.7)',
					'rgba(218, 112, 214, 0.7)'
				],
				borderWidth: 2,
				borderColor: '#fff'
			}
		]
	});

	const spendByTypeChartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false
			},
			tooltip: {
				callbacks: {
					label: (context) => `${context.label}: ${formatCurrency(context.parsed)}`
				}
			}
		},
		cutout: '60%'
	};

	const totalTypeSpend = $derived(filteredContractTypeSpend.reduce((sum, item) => sum + item.total, 0));

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
					callback: (value) => formatCurrency(value as number)
				}
			}
		}
	};
</script>

<svelte:window on:click={handleClickOutside} />

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
		<button onclick={applyDateFilter} class="apply-button">Apply</button>
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
			label="Total Active Contract Value"
			subLabel="(Live Snapshot)"
			value={formatCurrency(data?.totalActiveContractValue ?? 0)}
			tooltipText="The total face value of all contracts that are currently active, regardless of payment terms. This value is NOT affected by the date filter."
		/>
		<StatCard
			label="Total Spend"
			subLabel="(In Selected Range)"
			value={formatCurrency(data?.totalSpendInRange ?? 0)}
			tooltipText="The total actual spend that occurred within the selected date range. This includes prorated monthly costs and any yearly/one-time costs that occurred in the period."
		/>
	</div>

	<!-- Chart Grid -->
	<div class="charts-container">
		{#if $navigating}
			<div class="loading-overlay">
				<div class="spinner"></div>
				<span>Loading new data...</span>
			</div>
		{/if}
		<div class="chart-wrapper large">
			<div class="chart-header">
				<h2>Spend by Vendor (Top 10)</h2>
				<div class="vendor-filter" bind:this={vendorFilterElement}>
					<button class="dropdown-toggle" onclick={() => (isVendorDropdownOpen = !isVendorDropdownOpen)}>
						<span>{selectedVendors.length} of {allVendors.length} vendors selected</span>
						<span class="dropdown-arrow">{isVendorDropdownOpen ? '▲' : '▼'}</span>
					</button>
					{#if isVendorDropdownOpen}
						<div class="dropdown-content">
							<div class="vendor-filter-actions">
								<button class="link-button" onclick={() => (selectedVendors = [...allVendors])}>Select All</button>
								<button class="link-button" onclick={() => (selectedVendors = [])}>Deselect All</button>
							</div>
							<div class="vendor-checkboxes">
								{#each allVendors as vendor}
									<label>
										<input type="checkbox" bind:group={selectedVendors} value={vendor} />
										{vendor}
									</label>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
			<div class="chart-inner-container">
				{#if filteredVendorSpend.length > 0}
					<Chart type="bar" data={spendByVendorChartData} options={spendByVendorChartOptions} />
				{:else}
					<p class="no-data-placeholder">No vendors to display for the current selection.</p>
				{/if}
			</div>
		</div>

		<div class="chart-wrapper">
			<div class="chart-header">
				<h2>Spend by Contract Type</h2>
				<div class="vendor-filter" bind:this={typeFilterElement}>
					<button class="dropdown-toggle" onclick={() => (isTypeDropdownOpen = !isTypeDropdownOpen)}>
						<span>{selectedContractTypes.length} of {allContractTypes.length} types selected</span>
						<span class="dropdown-arrow">{isTypeDropdownOpen ? '▲' : '▼'}</span>
					</button>
					{#if isTypeDropdownOpen}
						<div class="dropdown-content">
							<div class="vendor-filter-actions">
								<button class="link-button" onclick={() => (selectedContractTypes = [...allContractTypes])}>Select All</button>
								<button class="link-button" onclick={() => (selectedContractTypes = [])}>Deselect All</button>
							</div>
							<div class="vendor-checkboxes">
								{#each allContractTypes as type}
									<label><input type="checkbox" bind:group={selectedContractTypes} value={type} />{type}</label>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
			<div class="doughnut-container">
				<div class="doughnut-chart-area">
					{#if filteredContractTypeSpend.length > 0}
						<Chart type="doughnut" data={spendByTypeChartData} options={spendByTypeChartOptions} />
					{:else}
						<p class="no-data-placeholder">No contract types to display for the current selection.</p>
					{/if}
				</div>
				{#if filteredContractTypeSpend.length > 0}
					<div class="custom-legend">
						<ul>
							{#each filteredContractTypeSpend as item, i}
								<li>
									<span
										class="legend-color-box"
										style="background-color: {spendByTypeChartData.datasets[0].backgroundColor[i % spendByTypeChartData.datasets[0].backgroundColor.length]}"
									></span>
									<span class="legend-label">{item.name}</span>
									<span class="legend-value">{formatCurrency(item.total)}</span>
									<span class="legend-percentage">({((item.total / totalTypeSpend) * 100).toFixed(1)}%)</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</div>

		<div class="chart-wrapper large">
			<div class="chart-header">
				<h2>Total Spend Trend</h2>
			</div>
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

	.loading-overlay {
		position: absolute;
		inset: 0;
		background-color: rgba(255, 255, 255, 0.8);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		z-index: 200;
		border-radius: 8px;
		gap: 1rem;
		font-weight: 500;
		color: #333;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #007bff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.chart-wrapper {
		background-color: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.inline-filter-controls {
		display: flex;
		align-items: flex-end;
		gap: 1rem;
	}

	.chart-header {
		margin-bottom: 1.5rem;
	}

	.chart-header h2 {
		margin: 0;
	}

	.vendor-filter {
		margin-top: 1rem;
		position: relative; /* Needed for positioning the dropdown content */
		width: fit-content; /* Make the container only as wide as its content */
		border-top: 1px solid #eee;
		padding-top: 1rem;
	}

	.vendor-filter-actions {
		display: flex;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.link-button {
		background: none;
		border: none;
		color: #007bff;
		cursor: pointer;
		padding: 0;
		font-size: 0.875rem;
		text-decoration: underline;
	}

	.dropdown-toggle {
		width: auto; /* Let the button size to its content */
		background-color: #fff;
		border: 1px solid #ccc;
		border-radius: 5px;
		padding: 0.5rem 0.75rem;
		text-align: left;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.9rem;
	}

	.dropdown-toggle:hover {
		background-color: #f9f9f9;
	}

	.dropdown-content {
		position: absolute;
		width: 100%;
		background-color: #fff;
		border: 1px solid #ccc;
		border-top: none;
		border-radius: 0 0 5px 5px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		z-index: 100;
		padding: 0.75rem;
		box-sizing: border-box;
	}

	.vendor-checkboxes {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 120px; /* Give it a max height */
		overflow-y: auto; /* Add a scrollbar if content overflows */
		border: 1px solid #ccc;
		padding: 0.75rem;
		border-radius: 5px;
		background-color: #fff;
	}

	.vendor-checkboxes label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	.filter-group select {
		padding: 0.5rem;
		font-size: 0.9rem;
		border-radius: 5px;
		border: 1px solid #ccc;
		background-color: white;
	}

	.chart-wrapper.full-width {
		grid-column: 1 / -1;
	}

	.chart-wrapper h2 {
		margin-top: 0;
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

	.doughnut-container {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.doughnut-chart-area {
		height: 220px; /* Adjust chart height */
		position: relative;
	}

	.custom-legend {
		overflow-y: auto;
		flex-grow: 1; /* Take remaining space */
		padding-top: 1rem;
		border-top: 1px solid #eee;
		margin-top: 1rem;
	}

	.custom-legend ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.custom-legend li {
		display: grid;
		grid-template-columns: auto 1fr auto auto;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.legend-color-box {
		width: 12px;
		height: 12px;
		border-radius: 3px;
	}

	.legend-label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: #333;
	}

	.legend-value {
		font-weight: 500;
		justify-self: end;
	}
	.legend-percentage {
		color: #666;
		font-size: 0.8rem;
		width: 45px; /* Align percentages */
		text-align: right;
	}

	@media (max-width: 900px) {
		.charts-container {
			grid-template-columns: 1fr;
		}
	}
</style>