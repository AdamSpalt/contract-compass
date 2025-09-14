<script context="module" lang="ts">
	export type Contract = {
		id: number;
		contract_name: string | null;
		vendor_name: string | null;
		start_date: string | null;
		end_date: string | null;
		file_path: string | null;
		renewal_type: 'monthly' | 'yearly' | null;
		contract_value: number | null;
		payment_terms: 'one_time' | 'monthly' | 'yearly' | null;
		contract_type?: string;
		notice_period_days: number | null;
	};
</script>

<script lang="ts">
	import { format, differenceInDays, isPast } from 'date-fns';

	export let contracts: Contract[];

	type SortableColumn =
		| 'contract_name'
		| 'vendor_name'
		| 'start_date'
		| 'end_date'
		| 'contract_value'
		| 'status';

	let sortColumn: SortableColumn | null = 'start_date'; // Default sort by Start Date
	let sortDirection: 'asc' | 'desc' = 'desc'; // Default to descending (newest first)

	function handleSort(column: SortableColumn) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	// This is a computed property. It will re-run whenever its dependencies (contracts, sortColumn, sortDirection) change.
	$: sortedContracts = (() => {
		if (!sortColumn) {
			return contracts;
		}

		// Create a new sorted array without modifying the original 'contracts' prop
		return [...contracts].sort((a, b) => {
			const getSortableValue = (contract: Contract, key: SortableColumn) => {
				switch (key) {
					case 'status':
						return getContractStatus(contract).text;
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

	function getContractStatus(contract: Contract) {
		let status: { text: string; className: string } = { text: 'Active', className: 'status-active' };

		if (contract.renewal_type) {
			status = { text: 'Auto-Renew', className: 'status-renews' };
		} else if (contract.end_date) {
			// Add T00:00:00 to ensure date is parsed in local timezone, not UTC
			const endDate = new Date(contract.end_date + 'T00:00:00');
			if (isPast(endDate)) {
				status = { text: 'Expired', className: 'status-expired' };
			} else {
				const daysUntilExpiry = differenceInDays(endDate, new Date());
				if (daysUntilExpiry <= (contract.notice_period_days ?? 30)) {
					status = { text: 'Expiring Soon', className: 'status-expiring' };
				}
			}
		}
		return status;
	}
</script>

<table>
	<thead>
		<tr>
			<th on:click={() => handleSort('contract_name')} class="sortable" class:active-sort={sortColumn === 'contract_name'}>
				Contract Name
				{#if sortColumn === 'contract_name'}<span>{sortDirection === 'asc' ? '▲' : '▼'}</span>{/if}
			</th>
			<th on:click={() => handleSort('vendor_name')} class="sortable" class:active-sort={sortColumn === 'vendor_name'}>
				Vendor
				{#if sortColumn === 'vendor_name'}<span>{sortDirection === 'asc' ? '▲' : '▼'}</span>{/if}
			</th>
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
		{#each sortedContracts as contract (contract.id)}
			{@const status = getContractStatus(contract)}
			<tr>
				<td>{contract.contract_name ?? 'N/A'}</td>
				<td>{contract.vendor_name ?? 'N/A'}</td>
				<td>
					{#if contract.start_date}
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
						{new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(
							contract.contract_value
						)}
					{:else}
						N/A
					{/if}
				</td>
				<td>
					<span class="status-badge {status.className}">{status.text}</span>
				</td>
				<td>
					<div class="actions-wrapper">
						{#if contract.file_path}
							<a href={contract.file_path} target="_blank" rel="noopener noreferrer" class="file-link">View File</a>
						{/if}
						<a href="/contracts/{contract.id}" class="details-link">More</a>
					</div>
				</td>
			</tr>
		{/each}
	</tbody>
</table>

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
	th:nth-child(1) { width: 22%; } /* Contract Name */
	th:nth-child(2) { width: 14%; } /* Vendor */
	th:nth-child(3) { width: 11%; } /* Start Date */
	th:nth-child(4) { width: 11%; } /* End Date */
	th:nth-child(5) { width: 11%; } /* Renewal */
	th:nth-child(6) { width: 9%; }  /* Value */
	th:nth-child(7) { width: 10%; } /* Status */
	th:nth-child(8) { width: 12%; } /* Actions */

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
</style>