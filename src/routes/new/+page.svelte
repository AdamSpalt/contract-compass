<script lang="ts">
	import type { ActionData } from './$types';
	export let form: ActionData;

	let endDateType: 'specific' | 'monthly' | 'yearly' = 'specific';
</script>

<main>
	<h1>Add New Contract</h1>
	<a href="/" class="back-link">&larr; Back to Dashboard</a>

	<form method="POST" enctype="multipart/form-data">
		<h4>General Information</h4>
		<div class="form-group">
			<label for="contract_name">Contract Name</label>
			<input type="text" id="contract_name" name="contract_name" required />
		</div>
		<div class="form-group">
			<label for="contract_type">Contract Type</label>
			<select id="contract_type" name="contract_type">
				<option value="Insurance">Insurance</option>
				<option value="Subscription">Subscription</option>
				<option value="Other">Other</option>
			</select>
		</div>
		<div class="form-group">
			<label for="vendor_name">Vendor Name</label>
			<input type="text" id="vendor_name" name="vendor_name" />
		</div>
		<div class="form-group">
			<label for="contract_number">Contract Number</label>
			<input type="text" id="contract_number" name="contract_number" />
		</div>

		<hr />

		<h4>Financial Details</h4>
		<div class="form-group">
			<label for="contract_value">Contract Value ($)</label>
			<input type="number" step="0.01" id="contract_value" name="contract_value" placeholder="e.g. 1500" />
		</div>

		<div class="form-group">
			<label for="payment_terms">Payment Terms</label>
			<select id="payment_terms" name="payment_terms">
				<option value="one_time">One-Time</option>
				<option value="monthly">Monthly</option>
				<option value="yearly">Yearly</option>
			</select>
		</div>

		<div class="form-group">
			<label for="notice_period_days">Notice Period (days)</label>
			<input type="number" id="notice_period_days" name="notice_period_days" placeholder="e.g. 30" />
		</div>

		<hr />

		<h4>Dates & Renewal</h4>
		<div class="form-group">
			<label for="start_date">Start Date</label>
			<input type="date" id="start_date" name="start_date" />
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
				<input type="date" id="end_date" name="end_date" />
			</div>
		{/if}

		<input type="hidden" name="renewal_type" value={endDateType === 'specific' ? '' : endDateType} />

		<div class="form-group">
			<label for="contract_file">Contract File (Optional)</label>
			<input type="file" id="contract_file" name="contract_file" />
		</div>

		<button type="submit">Add Contract</button>

		{#if form?.message}
			<p class="error">Error: {form.message}</p>
			{#if form.details}<p class="error-details">{form.details}</p>{/if}
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
	h4 {
		margin-top: 2rem;
		margin-bottom: 1rem;
		color: #333;
		border-bottom: 1px solid #eee;
		padding-bottom: 0.5rem;
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
	.error-details {
		color: #555;
		font-size: 0.9rem;
	}
</style>