<!-- serves as the main dashboard for your "Contract Compass" application. 
 Its primary purpose is to display contracts to the user and provide a powerful 
 set of tools for searching, filtering, and organizing them.-->

<script lang="ts">
	// This 'data' prop is automatically passed from your +page.ts load function
	import ContractTable from '$lib/components/ContractTable.svelte';
	import type { Contract } from '$lib/components/ContractTable.svelte';
	import { isPast, differenceInDays } from 'date-fns';

	// Define the expected shape of the data prop
	export let data: { contracts: Contract[] };

	let searchTerm = '';
	let showFilters = false;
	let statusFilter = 'all'; // 'all', 'Active', 'Expiring Soon', 'Expired', 'Auto-Renews'
	let typeFilter = 'all'; // 'all', 'Insurance', 'Subscription', 'Other'
	let hasFile = false;
	let startDateFilter = '';
	let endDateFilter = '';
	let minValueFilter = '';
	let maxValueFilter = '';

	// A reactive list of contracts filtered by the search term
	$: contractsWithStatus = (data.contracts || []).map((c: Contract) => {
		// Calculate the contract's current status for display and filtering
		let currentStatus = 'Active';
		if (c.end_date) {
			const endDate = new Date(c.end_date + 'T00:00:00');
			if (isPast(endDate)) {
				currentStatus = 'Expired';
			} else {
				const daysUntilExpiry = differenceInDays(endDate, new Date());
				if (daysUntilExpiry <= (c.notice_period_days ?? 30)) {
					// It's within the notice period, check if it's a renewing contract
					if (c.renewal_type === 'yearly') {
						currentStatus = 'Renewing Soon';
					} else {
						currentStatus = 'Expiring Soon';
					}
				} else if (c.renewal_type) {
					currentStatus = 'Auto-Renew';
				}
			}
		}
		return { ...c, status: currentStatus };
	});

	$: filteredContracts = contractsWithStatus.filter((c) => {
		// 1. Search Term Filter
		const lowerSearchTerm = searchTerm.toLowerCase().trim();
		if (lowerSearchTerm) {
			const nameMatch = c.contract_name?.toLowerCase().includes(lowerSearchTerm);
			const vendorMatch = c.vendor_name?.toLowerCase().includes(lowerSearchTerm);
			if (!nameMatch && !vendorMatch) return false;
		}

		// 2. Status Filter
		if (statusFilter !== 'all' && c.status !== statusFilter) return false;

		// 3. Type Filter
		if (typeFilter !== 'all') {
			if (c.contract_type !== typeFilter) return false;
		}

		// 4. Has File Filter
		if (hasFile && !c.file_path) {
			return false;
		}

		// 5. Date Range Filters
		if (startDateFilter) {
			// If contract has no start date, or its start date is before the filter, exclude it
			if (!c.start_date || c.start_date < startDateFilter) {
				return false;
			}
		}
		if (endDateFilter) {
			// If contract has no end date, or its end date is after the filter, exclude it
			if (!c.end_date || c.end_date > endDateFilter) {
				return false;
			}
		}

		// 6. Value Filter
		const minVal = parseFloat(minValueFilter);
		const maxVal = parseFloat(maxValueFilter);

		if (!isNaN(minVal)) {
			// If contract has no value or is less than min, exclude it
			if (c.contract_value === null || c.contract_value < minVal) {
				return false;
			}
		}
		if (!isNaN(maxVal)) {
			// If contract has no value or is greater than max, exclude it
			if (c.contract_value === null || c.contract_value > maxVal) {
				return false;
			}
		}

		return true; // Passes all filters
	});

	// Create reactive arrays for each contract type section from the filtered list
	$: insuranceContracts = filteredContracts.filter((c: Contract) => c.contract_type === 'Insurance');
	$: subscriptionContracts = filteredContracts.filter((c: Contract) => c.contract_type === 'Subscription');
	$: otherContracts = filteredContracts.filter(
		(c: Contract) => c.contract_type !== 'Insurance' && c.contract_type !== 'Subscription'
	);

	// Check if any contracts of each type exist in the original unfiltered data
	$: hasAnyInsuranceContracts = data.contracts.some((c) => c.contract_type === 'Insurance');
	$: hasAnySubscriptionContracts = data.contracts.some((c) => c.contract_type === 'Subscription');
	$: hasAnyOtherContracts = data.contracts.some((c) => c.contract_type !== 'Insurance' && c.contract_type !== 'Subscription');

	function clearFilters() {
		searchTerm = '';
		statusFilter = 'all';
		typeFilter = 'all';
		hasFile = false;
		startDateFilter = '';
		endDateFilter = '';
		minValueFilter = '';
		maxValueFilter = '';
	}
</script>

<main>
	<h1>Contract Compass</h1>

	<p>A central place to manage all your important contracts.</p>

	<div class="controls-container">
		<input
			type="text"
			bind:value={searchTerm}
			placeholder="Search by contract name or vendor..."
		/>
		<a href="/contracts/new" class="add-new-link">Add New Contract</a>
	</div>

	<div class="filter-toggle-container">
		<button class="filter-toggle-button" on:click={() => (showFilters = !showFilters)}>
			Filters {showFilters ? '▲' : '▼'}
		</button>
	</div>

	{#if showFilters}
		<div class="filter-panel-wrapper">
			<div class="filter-panel">
				<div class="filter-group">
					<label for="type-filter">Contract Type</label>
					<select id="type-filter" bind:value={typeFilter}>
						<option value="all">All Types</option>
						<option value="Insurance">Insurance</option>
						<option value="Subscription">Subscription</option>
						<option value="Other">Other</option>
					</select>
				</div>
				<div class="filter-group">
					<label for="start-date-filter">Start Date</label>
					<input type="date" id="start-date-filter" bind:value={startDateFilter} />
				</div>
				<div class="filter-group">
					<label for="end-date-filter">End Date</label>
					<input type="date" id="end-date-filter" bind:value={endDateFilter} />
				</div>
				<div class="filter-group">
					<label for="min-value-filter">Min Value</label>
					<input type="number" id="min-value-filter" placeholder="e.g., 1000" bind:value={minValueFilter} />
				</div>
				<div class="filter-group">
					<label for="max-value-filter">Max Value</label>
					<input type="number" id="max-value-filter" placeholder="e.g., 5000" bind:value={maxValueFilter} />
				</div>
				<div class="filter-group">
					<label for="status-filter">Status</label>
					<select id="status-filter" bind:value={statusFilter}>
						<option value="all">All Statuses</option>
						<option value="Active">Active</option>
						<option value="Expiring Soon">Expiring Soon</option>
						<option value="Expired">Expired</option>
						<option value="Renewing Soon">Renewing Soon</option>
						<option value="Auto-Renew">Auto-Renew</option>
					</select>
				</div>
				<div class="filter-group">
					<label for="has-file">
						<input type="checkbox" id="has-file" bind:checked={hasFile} />
						Has attached file
					</label>
				</div>
			</div>
			<div class="filter-actions">
				<button class="clear-filters-button" on:click={clearFilters}>
					Clear All Filters
				</button>
			</div>
		</div>
	{/if}

	{#if typeFilter === 'all' || typeFilter === 'Insurance'}
		<section>
			<h2>Insurance</h2>
			{#if hasAnyInsuranceContracts}
				{#if insuranceContracts.length > 0}
					<ContractTable contracts={insuranceContracts} />
				{:else}
					<p class="empty-section-placeholder">No Insurance contracts match the current filters.</p>
				{/if}
			{:else}
				<p class="empty-section-placeholder">No 'Insurance' contracts have been added yet.</p>
			{/if}
		</section>
	{/if}

	{#if typeFilter === 'all' || typeFilter === 'Subscription'}
		<section>
			<h2>Subscriptions</h2>
			{#if hasAnySubscriptionContracts}
				{#if subscriptionContracts.length > 0}
					<ContractTable contracts={subscriptionContracts} />
				{:else}
					<p class="empty-section-placeholder">No Subscription contracts match the current filters.</p>
				{/if}
			{:else}
				<p class="empty-section-placeholder">No 'Subscription' contracts have been added yet.</p>
			{/if}
		</section>
	{/if}

	{#if typeFilter === 'all' || typeFilter === 'Other'}
		<section>
			<h2>Other</h2>
			{#if hasAnyOtherContracts}
				{#if otherContracts.length > 0}
					<ContractTable contracts={otherContracts} />
				{:else}
					<p class="empty-section-placeholder">No "Other" contracts match the current filters.</p>
				{/if}
			{:else}
				<p class="empty-section-placeholder">No 'Other' contracts have been added yet.</p>
			{/if}
		</section>
	{/if}
</main>

<style>
	section {
		margin-top: 2rem;
	}
	h2 {
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #f0f0f0;
		font-size: 1.5rem;
		font-weight: 600;
	}
	main {
		max-width: 1100px;
		margin: 0 auto;
		max-width: 1200px;
		margin: 2rem auto;
		padding: 1.5rem;
		font-family: sans-serif;
	}
	.controls-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 1.5rem 0;
	}
	.controls-container input {
		width: 50%;
		padding: 0.75rem 1rem;
		font-size: 1rem;
		border-radius: 5px;
		border: 1px solid #ccc;
		box-sizing: border-box;
	}

	.add-new-link {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		margin-bottom: 2rem;
		padding: 0.5rem 1rem;
		background-color: #28a745;
		color: white;
		text-decoration: none;
		border-radius: 5px;
		font-weight: bold;
	}
	p {
		color: #555;
		margin-top: 1rem;
	}
	.filter-toggle-container {
		margin-bottom: 1rem;
	}
	.filter-toggle-button {
		background-color: transparent;
		border: 1px solid #ccc;
		padding: 0.5rem 1rem;
		border-radius: 5px;
		cursor: pointer;
		font-weight: 500;
		font-size: 0.9rem;
		color: #333;
		transition: background-color 0.2s;
	}
	.filter-toggle-button:hover {
		background-color: #f0f0f0;
	}
	.filter-panel-wrapper {
		background-color: #f9f9f9;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}
	.filter-panel {
		padding: 1.5rem;
		display: flex;
		flex-wrap: wrap;
		gap: 2rem;
		align-items: flex-end;
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
	.filter-group select {
		padding: 0.5rem;
		font-size: 0.9rem;
		border-radius: 5px;
		border: 1px solid #ccc;
		background-color: white;
	}
	.filter-group input[type='date'] {
		padding: 0.4rem;
		font-size: 0.9rem;
		border-radius: 5px;
		border: 1px solid #ccc;
	}
	.filter-group input[type='number'] {
		padding: 0.5rem;
		font-size: 0.9rem;
		border-radius: 5px;
		border: 1px solid #ccc;
		background-color: white;
		width: 120px; /* Adjust width to be smaller */
	}
	.checkbox-group {
		justify-content: center;
	}
	.checkbox-group label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0;
		cursor: pointer;
	}
	.filter-actions {
		padding: 0 1.5rem 1rem;
		text-align: right;
	}
	.clear-filters-button {
		background-color: #6c757d;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 5px;
		cursor: pointer;
		font-weight: 500;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}
	.clear-filters-button:hover {
		background-color: #5a6268;
	}

	.empty-section-placeholder {
		text-align: center;
		color: #777;
		font-style: italic;
		padding: 2rem;
		border: 1px dashed #ddd;
		border-radius: 8px;
		margin-top: 1rem;
	}
	/* --- Responsive Styles --- */
	@media (max-width: 768px) {
		.controls-container {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}
		.controls-container input {
			width: 100%;
		}
		.filter-panel {
			flex-direction: column;
			align-items: stretch;
			gap: 1.5rem;
		}
		.add-new-link {
			text-align: center;
		}
	}
</style>
