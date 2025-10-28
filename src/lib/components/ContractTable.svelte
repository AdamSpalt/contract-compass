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
	export let actionButtonText: string = 'More'; // New prop for the action button text
	export let useActionIcon: boolean = false; // New prop to use an icon instead of text
	export let showViewFileButton: boolean = true; // New prop to control the button's visibility

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
		Active: 'badge-success',
		'Expiring Soon': 'badge-warning',
		Expired: 'badge-danger',
		'Auto-Renew': 'badge-secondary',
		'Renewing Soon': 'badge-warning'
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
<table class="contract-table" class:no-subtype-column={!showSubtypeColumn}>
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
			<th on:click={() => handleSort('status')} class="sortable status-column" class:active-sort={sortColumn === 'status'}>
				Status
				{#if sortColumn === 'status'}<span>{sortDirection === 'asc' ? '▲' : '▼'}</span>{/if}
			</th>
			<th class="status-column">Details</th>
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
				<td class="status-cell status-column">
					<!-- The status badge now uses the pre-calculated status from the parent -->
					<span class="badge {statusClassMap[contract.status ?? 'Active'] ?? 'badge-success'}">{contract.status ?? 'Active'}</span>
				</td>
				<td>
					<div class="actions-wrapper">
						<!-- Action buttons to view the contract file or see more details. -->
						{#if showViewFileButton && contract.file_path}
							<a href="{PUBLIC_SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{contract.file_path}" target="_blank" rel="noopener noreferrer" class="button button-small button-secondary file-link"
								>View File</a
							>
						{/if}
						<a href="/contracts/{contract.id}" class="button button-small button-primary details-link" class:button-icon={useActionIcon} title={actionButtonText}>
							{#if useActionIcon}
								<!-- Gear Icon SVG -->
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="vertical-align: middle;">
									<path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311a1.464 1.464 0 0 1-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.169.311c-.698 1.283.705 2.686 1.987 1.987l.31-.17a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413-1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.169-.311c.698-1.283-.705-2.686-1.987-1.987l-.31.17a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.858 2.929 2.929 0 0 1 0 5.858z"/>
								</svg>
							{:else}
								{actionButtonText}
							{/if}
						</a>
					</div>
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	/* Center align the status column header and cells */
	.status-column {
		text-align: center;
	}

	.actions-wrapper {
		display: flex;
		gap: 0.5rem; /* Adds space between buttons */
		justify-content: flex-start;
	}

	/* General button styling for action links */
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.4em 0.8em;
		border-radius: var(--border-radius);
		font-weight: 500;
		cursor: pointer;
		text-decoration: none;
		transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
		white-space: nowrap; /* Prevent text wrapping */
	}

	.button-small {
		padding: 0.3em 0.6em;
		font-size: 0.8rem; /* A slightly smaller, more controlled size for table context */
	}

	/* Style for buttons that only contain an icon - overrides the padding from .button-small */
	.button-icon {
		padding: 0.3em 0.5em;
	}

	.button-primary {
		background-color: #0d6efd; /* A new, brighter blue */
		color: white;
		border: 1px solid #0d6efd;
	}

	.button-primary:hover {
		background-color: #0b5ed7; /* A darker shade for hover */
		border-color: #0b5ed7;
	}

	.button-secondary {
		background-color: var(--color-background-light);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.button-secondary:hover {
		background-color: var(--color-background-lighter);
		border-color: var(--color-border-dark);
	}

	/* Align badges with buttons */
	:global(.badge) {
		vertical-align: middle; /* Better vertical alignment with buttons */
	}
</style>