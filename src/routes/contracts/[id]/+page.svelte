<script lang="ts">
	import { format, differenceInDays, isPast, subDays } from 'date-fns';
	export let data;
	const { contract, supabaseUrl } = data;
	let status: { text: string; className: string } = { text: 'Active', className: 'status-active' };
	let terminationDeadline: Date | null = null; // Must Cancel By date

	if (contract.end_date) {
		const endDate = new Date(contract.end_date + 'T00:00:00');
		const daysUntilExpiry = differenceInDays(endDate, new Date());

		// Calculate "Must Cancel By" date only for yearly renewing contracts
		if (contract.renewal_type === 'yearly' && contract.notice_period_days) {
			terminationDeadline = subDays(endDate, contract.notice_period_days);
		}

		if (isPast(endDate)) {
			status = { text: 'Expired', className: 'status-expired' };
		} else if (daysUntilExpiry <= (contract.notice_period_days ?? 30)) {
			if (contract.renewal_type === 'yearly') {
				status = { text: 'Renewing Soon', className: 'status-renewing-soon' };
			} else {
				status = { text: 'Expiring Soon', className: 'status-expiring' };
			}
		} else if (contract.renewal_type) {
			status = { text: 'Auto-Renews', className: 'status-renews' };
		} else {
			// It's just a normal active contract
		}
	}
</script>

<main>
	<div class="back-links-container">
		<a href="/" class="back-link">&larr; Back to Dashboard</a>
		<a href="/analysis" class="back-link">&larr; Back to Insights</a>
	</div>
	<h1>Contract Details</h1>

	<div class="card">
		<div class="card-header">
			<h2>{contract.contract_name}</h2>
			<span class="status-badge {status.className}">{status.text}</span>
		</div>
		<p><strong>Vendor:</strong> {contract.vendor_name ?? 'N/A'}</p>
		<p><strong>Contract Type:</strong> {contract.contract_type ?? 'N/A'}</p>
		<p><strong>Contract Number:</strong> {contract.contract_number ?? 'N/A'}</p>

		<hr />
		<h4>Financials</h4>
		<p>
			<strong>Value:</strong>
			{#if contract.contract_value}
				{new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(
					contract.contract_value
				)}
				{#if contract.payment_terms === 'monthly'}
					per month
				{:else if contract.payment_terms === 'yearly'}
					per year
				{/if}
			{:else}
				N/A
			{/if}
		</p>

		<hr />
		<h4>Key Dates</h4>
		<div class="key-dates">
			<p>
				<strong>Start Date:</strong>
				{#if contract.start_date}
					{format(new Date(contract.start_date + 'T00:00:00'), 'MMM d, yyyy')}
				{:else}
					N/A
				{/if}
			</p>
			<p>
				<strong>End Date:</strong>
				{#if contract.end_date}
					{format(new Date(contract.end_date + 'T00:00:00'), 'MMM d, yyyy')}
				{:else}N/A{/if}
			</p>
			<p>
				<strong>Must Cancel By:</strong>
				{#if terminationDeadline}{format(terminationDeadline, 'MMM d, yyyy')}{:else}N/A{/if}
			</p>
		</div>

		<hr />
		<div class="card-actions">
			{#if contract.file_path}
				<a
					href={`${supabaseUrl}/storage/v1/object/public/contract-files/${contract.file_path}`}
					target="_blank"
					rel="noopener noreferrer"
					class="action-button view-button">View Contract File</a
				>
			{/if}
			<a href="/contracts/{contract.id}/edit" class="action-button edit-button">Edit Contract</a>
			<form
				method="POST"
				action="?/delete"
				on:submit={(event) => {
					if (!confirm('Are you sure you want to delete this contract?')) {
						event.preventDefault();
					}
				}}
			>
				<button type="submit" class="action-button delete-button">Delete</button>
			</form>
		</div>
	</div>
</main>

<style>
	main {
		max-width: 700px;
		margin: 2rem auto;
		padding: 1.5rem;
		font-family: sans-serif;
	}
	.back-links-container {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	.back-link {
		align-self: flex-start;
		color: #555;
		text-decoration: none;
	}
	.card {
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	h4 {
		margin-bottom: 0.5rem;
	}
	h1 {
		margin-bottom: 1rem;
	}
	h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		font-size: 1.8rem;
		margin-bottom: 0; /* Reset margin as it's now in a flex container */
	}
	p {
		margin: 0.75rem 0;
		line-height: 1.6;
	}
	hr {
		border: none;
		border-top: 1px solid #eee;
		margin: 1.5rem 0;
	}
	.key-dates {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}
	.card-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: 1.5rem;
		align-items: center;
	}
	.action-button {
		display: inline-block;
		padding: 0.6rem 1.2rem;
		color: white;
		text-decoration: none;
		border-radius: 5px;
		text-align: center;
		font-weight: 500;
		border: none;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.9rem;
	}
	.view-button {
		background-color: #007bff;
	}
	.edit-button {
		background-color: #ffc107;
		color: #212529;
	}
	.delete-button {
		background-color: #dc3545;
	}
	.status-badge {
		display: inline-block;
		padding: 0.3rem 0.75rem;
		font-size: 0.8rem;
		font-weight: 600;
		border-radius: 12px;
		color: #fff;
		white-space: nowrap;
		margin-top: 0.25rem; /* Align better with h2 */
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