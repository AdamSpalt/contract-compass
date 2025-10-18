<!-- Dashboard table structure - column sorting-->

<script context="module" lang="ts">
	// SECTION 1: DATA DEFINITION
	// This script block defines the "shape" of a single contract object using TypeScript.
	// It ensures that any data passed to this component has the correct properties and types.
	export type Contract = {
		id: number;
		contract_name: string | null;
		vendor_name: string | null;
		contract_subtype: string | null;
		start_date: string | null;
		end_date: string | null;
		file_path: string | null;
		renewal_type: 'monthly' | 'yearly' | null;
		contract_value: number | null;
		payment_terms: 'one_time' | 'monthly' | 'yearly' | null;
		contract_type?: string;
		notice_period_days: number | null;
		status?: string; // The status is now passed in from the parent
	};
</script>

<script lang="ts">
	// SECTION 2: COMPONENT LOGIC
	// This script block contains all the interactive logic for the component.

	import { format, differenceInDays, isPast } from 'date-fns';
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	export let contracts: Contract[];
	export let showSubtypeColumn: boolean = true;

	type SortableColumn =
		// Defines which columns in the table can be sorted.
		| 'contract_name'
		| 'vendor_name'
		| 'contract_subtype'
		| 'start_date'
		| 'end_date'
		| 'contract_value'
		| 'renewal_type'
		| 'status';

	// A map to get the right CSS class for each status text
	const statusClassMap: Record<string, string> = {
		Active: 'status-active',
		'Expiring Soon': 'status-expiring',
		Expired: 'status-expired',
		'Auto-Renew': 'status-renews',
		'Renewing Soon': 'status-renewing-soon'
	};

	// These variables keep track of the current sorting state.
	let sortColumn: SortableColumn | null = 'start_date'; // Default sort by Start Date
	let sortDirection: 'asc' | 'desc' = 'desc'; // Default to descending (newest first)

	const BUCKET_NAME = 'contract-files';

	function handleSort(column: SortableColumn) {
		// This function is called when a user clicks on a column header to sort the table.
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	// This is a "reactive statement" or "computed property".
	// It automatically re-calculates the `sortedContracts` array whenever the original
	// `contracts` list, `sortColumn`, or `sortDirection` changes.
	$: sortedContracts = (() => {
		if (!sortColumn) {
			return contracts;
		}

		// Create a new sorted array without modifying the original 'contracts' prop
		return [...contracts].sort((a, b) => {
			// Helper function to get the correct value for sorting, handling special cases.
			const getSortableValue = (contract: Contract, key: SortableColumn) => {
				switch (key) {
					case 'status':
						return contract.status ?? 'Active';
					case 'end_date': // Represents the "End Date" column
						if (contract.renewal_type === 'yearly') return new Date('9999-12-31');
						if (contract.renewal_type === 'monthly') return new Date('9999-12-30');
						if (contract.end_date) return new Date(contract.end_date + 'T00:00:00');
						return null; // N/A values
					default:
						return contract[key as keyof Contract];
				}
			};

			if (!sortColumn) return 0;
			const valA = getSortableValue(a, sortColumn);
			const valB = getSortableValue(b, sortColumn);

			// Always sort nulls to the bottom
			if (valA === null) return 1;
			if (valB === null) return -1;

			let comparison = 0;
			if (valA instanceof Date && valB instanceof Date) {
				comparison = valA.getTime() - valB.getTime();
			} else {
				comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true });
			}

			return sortDirection === 'asc' ? comparison : -comparison;
		});
	})();

</script>

<!-- SECTION 3: HTML STRUCTURE & DISPLAY -->
<!-- This section defines the visual layout of the table. -->
<table class:no-subtype-column={!showSubtypeColumn}>
	<thead>
		<!-- Table Headers -->
		<!-- Each `th` (table header) is clickable to trigger the sorting logic. -->
		<tr>
			<th on:click={() => handleSort('contract_name')} class="sortable" class:active-sort={sortColumn === 'contract_name'}>
				Contract Name
				{#if sortColumn === 'contract_name'}<span>{sortDirection === 'asc' ? '▲' : '▼'}</span>{/if}
			</th>
			<th on:click={() => handleSort('vendor_name')} class="sortable" class:active-sort={sortColumn === 'vendor_name'}>
				Vendor
				{#if sortColumn === 'vendor_name'}<span>{sortDirection === 'asc' ? '▲' : '▼'}</span>{/if}
			</th>
			{#if showSubtypeColumn}
				<th on:click={() => handleSort('contract_subtype')} class="sortable" class:active-sort={sortColumn === 'contract_subtype'}>
					Sub-Type
					{#if sortColumn === 'contract_subtype'}<span>{sortDirection === 'asc' ? '▲' : '▼'}</span>{/if}
				</th>
			{/if}
			<th on:click={() => handleSort('start_date')} class="sortable" class:active-sort={sortColumn === 'start_date'}>
				Start Date
				{#if sortColumn === 'start_date'}<span>{sortDirection === 'asc' ? '▲' : '▼'}</span>{/if}
			</th>
			<th on:click={() => handleSort('end_date')} class="sortable" class:active-sort={sortColumn === 'end_date'}>
				End Date
				{#if sortColumn === 'end_date'}<span>{sortDirection === 'asc' ? '▲' : '▼'}</span>{/if}
			</th>
			<th on:click={() => handleSort('renewal_type')} class="sortable" class:active-sort={sortColumn === 'renewal_type'}>
				Renewal
				{#if sortColumn === 'renewal_type'}<span>{sortDirection === 'asc' ? '▲' : '▼'}</span>{/if}
			</th>
			<th on:click={() => handleSort('contract_value')} class="sortable" class:active-sort={sortColumn === 'contract_value'}>
				Value
				{#if sortColumn === 'contract_value'}<span>{sortDirection === 'asc' ? '▲' : '▼'}</span>{/if}
			</th>
			<th on:click={() => handleSort('status')} class="sortable" class:active-sort={sortColumn === 'status'}>
				Status
				{#if sortColumn === 'status'}<span>{sortDirection === 'asc' ? '▲' : '▼'}</span>{/if}
			</th>
			<th>Actions</th>
		</tr>
	</thead>
	<tbody>
		<!-- Table Body -->
		<!-- This `{#each}` block loops through the `sortedContracts` array and creates a table row `<tr>` for each contract. -->
		{#each sortedContracts as contract (contract.id)}
			<tr>
				<td>{contract.contract_name ?? 'N/A'}</td>
				<td>{contract.vendor_name ?? 'N/A'}</td>
				{#if showSubtypeColumn}
					<td>{contract.contract_subtype ?? 'N/A'}</td>
				{/if}
				<td>
					{#if contract.start_date}
						<!-- Dates are formatted for readability using the 'date-fns' library. -->
						{format(new Date(contract.start_date + 'T00:00:00'), 'MMM d, yyyy')}
					{:else}
						N/A
					{/if}
				</td>
				<td>
					<div class="date-renewal-cell">
						{#if contract.end_date}
							{format(new Date(contract.end_date + 'T00:00:00'), 'MMM d, yyyy')}
						{:else}
							-
						{/if}
					</div>
				</td>
				<td>
					<div class="renewal-cell">
						{#if contract.renewal_type === 'monthly'}
							Renews Monthly
						{:else if contract.renewal_type === 'yearly'}
							Renews Yearly
						{:else}
							-
						{/if}
					</div>
				</td>
				<td>
					{#if contract.contract_value}
						<!-- Currency is formatted correctly for the Polish locale. -->
						{new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(
							contract.contract_value
						)}
					{:else}
						N/A
					{/if}
				</td>
				<td>
					<!-- The status badge now uses the pre-calculated status from the parent -->
					<span class="status-badge {statusClassMap[contract.status ?? 'Active'] ?? 'status-active'}">{contract.status ?? 'Active'}</span>
				</td>
				<td>
					<div class="actions-wrapper">
						<!-- Action buttons to view the contract file or see more details. -->
						{#if contract.file_path}
							<a href="{PUBLIC_SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{contract.file_path}" target="_blank" rel="noopener noreferrer" class="file-link"
								>View File</a
							>
						{/if}
						<a href="/contracts/{contract.id}" class="details-link">More</a>
					</div>
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<!-- SECTION 4: STYLING -->
<!-- This section contains all the CSS rules to make the table look good. -->
<style>
	table {
		width: 100%;
		border-collapse: collapse;
		table-layout: fixed; /* This is the key to consistent column widths across tables */
	}
	th,
	td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #e0e0e0;
		vertical-align: middle;
	}

	tbody tr:hover {
		background-color: #f5f5f5; /* Light grey for hover effect */
		transition: background-color 0.2s ease-in-out;
	}

	/* Define explicit widths for each column to ensure alignment */
	/* Default widths when Sub-Type column is visible */
	:global(table:not(.no-subtype-column)) th:nth-child(1) { width: 20%; } /* Contract Name */
	:global(table:not(.no-subtype-column)) th:nth-child(2) { width: 8%; } /* Vendor */
	:global(table:not(.no-subtype-column)) th:nth-child(3) { width: 15%; } /* Sub-Type */
	:global(table:not(.no-subtype-column)) th:nth-child(4) { width: 11%; } /* Start Date */
	:global(table:not(.no-subtype-column)) th:nth-child(5) { width: 11%; } /* End Date */
	:global(table:not(.no-subtype-column)) th:nth-child(6) { width: 10%; } /* Renewal */
	:global(table:not(.no-subtype-column)) th:nth-child(7) { width: 9%; }  /* Value */
	:global(table:not(.no-subtype-column)) th:nth-child(8) { width: 8%; }  /* Status */
	:global(table:not(.no-subtype-column)) th:nth-child(9) { width: 7%; }  /* Actions */

	/* Adjusted widths when Sub-Type column is hidden */
	:global(table.no-subtype-column) th:nth-child(1) { width: 20%; } /* Contract Name */
	:global(table.no-subtype-column) th:nth-child(2) { width: 25%; } /* Vendor */
	:global(table.no-subtype-column) th:nth-child(3) { width: 11%; } /* Start Date */
	:global(table.no-subtype-column) th:nth-child(4) { width: 11%; } /* End Date */
	:global(table.no-subtype-column) th:nth-child(5) { width: 11%; } /* Renewal */
	:global(table.no-subtype-column) th:nth-child(6) { width: 9%; } /* Value */
	:global(table.no-subtype-column) th:nth-child(7) { width: 8%; }  /* Status */
	:global(table.no-subtype-column) th:nth-child(8) { width: 7%; }  /* Actions */

	/* Ensure date columns don't wrap, keeping them on a single line */
	th:nth-child(3),
	td:nth-child(3),
	th:nth-child(4),
	td:nth-child(4),
	th:nth-child(5),
	td:nth-child(5) {
		white-space: nowrap;
	}

	.date-renewal-cell {
		display: flex;
		flex-direction: column;
	}
	.main-date {
		font-weight: 500;
	}

	.sortable {
		cursor: pointer;
		user-select: none; /* Prevent text selection on click */
		position: relative;
	}

	.sortable:hover {
		background-color: #f0f0f0;
	}

	.sortable span {
		font-size: 0.8em;
		margin-left: 0.5em;
	}

	.active-sort {
		background-color: #e9e9e9;
	}

	th {
		background-color: #f9f9f9;
		font-weight: 600;
	}
	.details-link,
	.file-link {
		display: inline-block;
		padding: 0.2rem 0.4rem; /* Reduced horizontal padding */
		border-radius: 5px;
		font-weight: 500;
		text-align: center;
		font-size: 0.875rem;
		min-width: 70px; /* Reduced min-width to match smaller padding */
		box-sizing: border-box;
		white-space: nowrap;
	}
	.details-link,
	.file-link {
		background-color: #007bff;
		color: white;
		text-decoration: none;
	}
	.details-link {
		background-color: #0056b3; /* A different, darker blue */
	}
	.actions-wrapper {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		align-items: center;
	}
	.status-badge {
		display: inline-block;
		padding: 0.3rem 0.75rem;
		font-size: 0.8rem;
		font-weight: 600;
		border-radius: 12px;
		color: #fff;
	}
	.status-active {
		background-color: #28a745; /* Green */
	}
	.status-expiring {
		background-color: #ffc107; /* Yellow */
		color: #212529;
	}
	.status-expired {
		background-color: #dc3545; /* Red */
	}
	.status-renews {
		background-color: #17a2b8; /* Teal */
	}
	.status-renewing-soon {
		background-color: #6f42c1; /* Purple */
	}
</style>