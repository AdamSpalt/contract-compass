<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { addYears, format } from 'date-fns';
	import type { ActionData } from './$types';

	export let form: ActionData;

	// Form state variables
	let contract_name = '';
	let vendor_name = '';
	let start_date = '';
	let end_date = '';
	let contract_value: number | null = null;
	let notice_period_days: number | null = 30;
	let contract_number = '';
	let vendor_link = '';
	let payment_terms = 'one_time';
	let contract_file: FileList;

	let endDateType: 'specific' | 'monthly' | 'yearly' = 'specific';
	let contractType: 'Insurance' | 'Subscription' | 'Other' = 'Insurance';
	let contractSubtype: string = '';

	onMount(() => {
		const prefillDataJSON = sessionStorage.getItem('prefillContractData');

		if (prefillDataJSON) {
			try {
				const data = JSON.parse(prefillDataJSON);

				// Assign the pre-filled data to the form variables, handling potentially missing fields
				contract_name = data.contract_name || '';
				vendor_name = data.vendor_name || '';
				contract_number = data.contract_number || '';
				start_date = data.start_date || '';
				end_date = data.end_date || '';
				contract_value = data.contract_value || null;
				notice_period_days = data.notice_period_days || 30;
				contractType = data.contract_type || 'Other';

				// If the AI provides a renewal term, set the radio button accordingly
				if (data.renewal_type === 'yearly' || data.renewal_type === 'monthly') {
					endDateType = data.renewal_type;
				}
			} catch (e) {
				console.error('Failed to parse pre-fill data:', e);
			} finally {
				// Clean up sessionStorage so the form is not pre-filled on subsequent manual visits
				sessionStorage.removeItem('prefillContractData');
			}
		}
	});

	const subTypeMap = {
		Insurance: ['Car insurance', 'Home insurance', 'Health insurance', 'Personal Injury']
		// Future sub-types for other categories can be added here
	};

	// Reactively calculate the end date if 'yearly' is selected and a start date exists
	$: calculatedEndDate =
		endDateType === 'yearly' && start_date ? format(addYears(new Date(start_date), 1), 'yyyy-MM-dd') : '';

	// When the main contract type changes, reset the sub-type if it's no longer relevant.
	$: {
		if (contractType !== 'Insurance') {
			contractSubtype = '';
		}
	}
</script>

<main class="new-contract-page">
	<div class="back-links-container">
		<a href="/" class="back-link">&larr; Back to Dashboard</a>
	</div>
	<h1>Add New Contract</h1>

	<form method="POST" use:enhance enctype="multipart/form-data">
		<h4 class="form-section-heading">General Information</h4>
		<div class="form-group">
			<label for="contract_name">Contract Name</label>
			<input type="text" id="contract_name" name="contract_name" bind:value={contract_name} required />
		</div>
		<div class="form-group">
			<label for="contract_type">Contract Type</label>
			<select id="contract_type" name="contract_type" bind:value={contractType}>
				<option value="Insurance">Insurance</option>
				<option value="Subscription">Subscription</option>
				<option value="Other">Other</option>
			</select>
		</div>
		{#if contractType === 'Insurance'}
			<div class="form-group">
				<label for="contract_subtype">Insurance Sub-Type</label>
				<select id="contract_subtype" name="contract_subtype" bind:value={contractSubtype} required>
					<option value="" disabled>Select a sub-type</option>
					{#each subTypeMap.Insurance as subType}
						<option value={subType}>{subType}</option>
					{/each}
				</select>
			</div>
		{/if}
		<div class="form-group">
			<label for="vendor_name">Vendor Name</label>
			<input type="text" id="vendor_name" name="vendor_name" bind:value={vendor_name} />
		</div>
		<div class="form-group">
			<label for="contract_number">Contract Number</label>
			<input type="text" id="contract_number" name="contract_number" bind:value={contract_number} />
		</div>

		<h4 class="form-section-heading">Vendor Contact</h4>
		<div class="form-group">
			<label for="vendor_link">Vendor Website Link (Optional)</label>
			<input
				type="url"
				id="vendor_link"
				name="vendor_link"
				placeholder="e.g., https://www.example.com"
				bind:value={vendor_link}
			/>
		</div>

		<h4 class="form-section-heading">Financial Details</h4>
		<div class="form-group">
			<label for="contract_value">Contract Value ($)</label>
			<input type="number" step="0.01" id="contract_value" name="contract_value" placeholder="e.g. 1500" bind:value={contract_value} />
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
			<input type="number" id="notice_period_days" name="notice_period_days" placeholder="e.g. 30" bind:value={notice_period_days} />
		</div>

		<h4 class="form-section-heading">Dates & Renewal</h4>
		<div class="form-group">
			<label for="start_date">Start Date</label>
			<input type="date" id="start_date" name="start_date" bind:value={start_date} />
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
				<input type="date" id="end_date" name="end_date" bind:value={end_date} />
			</div>
		{/if}

		{#if endDateType === 'yearly'}
			<div class="form-group">
				<label for="end_date_yearly">Calculated End Date</label>
				<input
					type="date"
					id="end_date_yearly"
					name="end_date"
					value={calculatedEndDate}
					readonly
					class="readonly-input"
					required={!!start_date}
				/>
			</div>
		{/if}

		<input type="hidden" name="renewal_type" value={endDateType === 'specific' ? '' : endDateType} />

		<div class="form-group">
			<label for="contract_file">Contract File (Optional)</label>
			<input type="file" id="contract_file" name="contract_file" bind:files={contract_file} />
		</div>

		<button type="submit" class="button button-primary">Add Contract</button>

		{#if form?.message}
			<p class="error">Error: {form.message}</p>
			{#if form.details}<p class="error-details">{form.details}</p>{/if}
		{/if}
	</form>
</main>