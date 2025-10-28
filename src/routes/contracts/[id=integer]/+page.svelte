<script lang="ts">
	import { format, differenceInDays, isPast, subDays } from 'date-fns';
	export let data;
	const { contract, supabaseUrl } = data;
	let status: { text: string; className: string } = { text: 'Active', className: 'status-active' };
	let terminationDeadline: Date | null = null;

	if (contract.end_date) {
		const endDate = new Date(contract.end_date + 'T00:00:00');
		const daysUntilExpiry = differenceInDays(endDate, new Date());

		// Calculate "Must Cancel By" date only for yearly renewing contracts
		if (contract.renewal_type === 'yearly' && contract.notice_period_days) {
			terminationDeadline = subDays(endDate, contract.notice_period_days); // Must Cancel By date
		}

		if (isPast(endDate)) {
			status = { text: 'Expired', className: 'badge-danger' };
		} else if (daysUntilExpiry <= (contract.notice_period_days ?? 30)) {
			if (contract.renewal_type === 'yearly') {
				status = { text: 'Renewing Soon', className: 'badge-warning' };
			} else {
				status = { text: 'Expiring Soon', className: 'badge-warning' };
			}
		} else if (contract.renewal_type) {
			status = { text: 'Auto-Renews', className: 'badge-secondary' };
		}
	}

	function formatUrlForDisplay(fullUrl: string | null): string {
		if (!fullUrl) return '';
		// Remove the protocol (http://, https://) and any trailing slash for a cleaner look
		return fullUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
	}
</script>

<main>
	<div class="new-contract-page">
		<div class="back-links-container">
			<a href="/" class="back-link">&larr; Back to Dashboard</a>
			<a href="/analysis" class="back-link">&larr; Back to Insights</a>
		</div>
		<h1>Contract Details</h1>

		<div class="card-header">
			<h2>{contract.contract_name}</h2>
			<span class="badge {status.className}">{status.text}</span>
		</div>
		<p><strong>Vendor:</strong> {contract.vendor_name ?? 'N/A'}</p>
		<p><strong>Contract Type:</strong> {contract.contract_type ?? 'N/A'}</p>
		{#if contract.contract_subtype}
			<p><strong>Sub-Type:</strong> {contract.contract_subtype}</p>
		{/if}
		<p><strong>Contract Number:</strong> {contract.contract_number ?? 'N/A'}</p>
		{#if contract.vendor_link}
			<p>
				<strong>Vendor link:</strong>
				<a href={contract.vendor_link} target="_blank" rel="noopener noreferrer"
					>{formatUrlForDisplay(contract.vendor_link)}</a
				>
			</p>
		{/if}

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
					class="button button-primary">View Contract File</a
				>
			{/if}
			<a href="/contracts/{contract.id}/edit" class="button button-warning">Edit Contract</a>
			<form
				method="POST"
				action="?/delete"
				on:submit={(event) => {
					if (!confirm('Are you sure you want to delete this contract?')) {
						event.preventDefault();
					}
				}}
			>
				<button type="submit" class="button button-danger">Delete</button>
			</form>
		</div>
	</div>
</main>

<style>
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1.5rem;
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
		align-items: stretch; /* Make all buttons the same height */
	}
	.card-actions form {
		margin: 0; /* Remove default form margin */
	}
</style>