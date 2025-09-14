<script lang="ts">
	import type { ActionData } from './$types';
	export let data;
	export let form: ActionData;

	const { contract } = data;

	// Initialize the radio button state based on the loaded data
	let endDateType: 'specific' | 'monthly' | 'yearly' = contract.renewal_type
		? contract.renewal_type
		: 'specific';
</script>

<main>
	<h1>Edit Contract</h1>
	<a href="/contracts/{contract.id}" class="back-link">&larr; Back to Details</a>

	<form method="POST" enctype="multipart/form-data">
		<div class="form-group">
			<label for="contract_name">Contract Name</label>
			<input type="text" id="contract_name" name="contract_name" value={contract.contract_name ?? ''} required />
		</div>
		<div class="form-group">
			<label for="contract_type">Contract Type</label>
			<select id="contract_type" name="contract_type" value={contract.contract_type ?? 'Other'}>
				<option value="Insurance">Insurance</option>
				<option value="Subscription">Subscription</option>
				<option value="Other">Other</option>
			</select>
		</div>
		<div class="form-group">
			<label for="vendor_name">Vendor Name</label>
			<input type="text" id="vendor_name" name="vendor_name" value={contract.vendor_name ?? ''} />
		</div>
		<div class="form-group">
			<label for="contract_number">Contract Number</label>
			<input type="text" id="contract_number" name="contract_number" value={contract.contract_number ?? ''} />
		</div>
		<div class="form-group">
			<label for="start_date">Start Date</label>
			<input type="date" id="start_date" name="start_date" value={contract.start_date ?? ''} />
		</div>

		<hr />

		<div class="form-group">
			<label for="contract_value">Contract Value (PLN)</label>
			<input type="number" step="0.01" id="contract_value" name="contract_value" value={contract.contract_value ?? ''} placeholder="e.g. 1500" />
		</div>

		<div class="form-group">
			<label for="payment_terms">Payment Terms</label>
			<select id="payment_terms" name="payment_terms" value={contract.payment_terms ?? 'one_time'}>
				<option value="one_time">One-Time</option>
				<option value="monthly">Monthly</option>
				<option value="yearly">Yearly</option>
			</select>
		</div>

		<div class="form-group">
			<label for="notice_period_days">Notice Period (days)</label>
			<input type="number" id="notice_period_days" name="notice_period_days" value={contract.notice_period_days ?? ''} placeholder="e.g. 30" />
		</div>

		<div class="form-group">
			<label>Renewal / End Date</label>
			<div class="radio-group">
				<label><input type="radio" bind:group={endDateType} value="specific" /> Specific Date</label>
				<label><input type="radio" bind:group={endDateType} value="monthly" /> Renews Monthly</label>
				<label><input type="radio" bind:group={endDateType} value="yearly" /> Renews Yearly</label>
			</div>
		</div>

		{#if endDateType === 'specific'}
			<div class="form-group">
				<label for="end_date">End Date</label>
				<input type="date" id="end_date" name="end_date" value={contract.end_date ?? ''} />
			</div>
		{/if}

		<input type="hidden" name="renewal_type" value={endDateType === 'specific' ? '' : endDateType} />

		<div class="form-group">
			<label for="contract_file">Replace Contract File (Optional)</label>
			{#if contract.file_path}
				<p class="current-file">A file is already attached. Uploading a new one will replace it.</p>
			{/if}
			<input type="file" id="contract_file" name="contract_file" />
		</div>

		<button type="submit">Save Changes</button>

		{#if form?.message}
			<p class="error">Error: {form.message}</p>
			<p class="error-details">{form.details}</p>
		{/if}
	</form>
</main>

<style>
	main {
		max-width: 600px;
		margin: 2rem auto;
		padding: 1.5rem;
		font-family: sans-serif;
	}
	.back-link {
		display: inline-block;
		margin-bottom: 1.5rem;
	}
	hr {
		border: none;
		border-top: 1px solid #eee;
		margin: 1.5rem 0;
	}
	.form-group {
		margin-bottom: 1rem;
	}
	label {
		display: block;
		margin-bottom: 0.25rem;
	}
	input,
	select {
		width: 100%;
		padding: 0.5rem;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
	.radio-group {
		display: flex;
		gap: 1.5rem;
		align-items: center;
		padding-top: 0.5rem;
	}
	.radio-group label {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		margin-bottom: 0;
		font-weight: normal;
	}
	.current-file {
		font-size: 0.9rem;
		color: #555;
		margin-top: -0.5rem;
		margin-bottom: 0.5rem;
	}
	button {
		padding: 0.75rem 1.5rem;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}
	.error {
		color: red;
		margin-top: 1rem;
	}
</style>