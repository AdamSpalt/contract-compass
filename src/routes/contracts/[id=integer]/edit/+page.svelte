<script lang="ts">
	import type { ActionData } from './$types';
	import { addYears, format } from 'date-fns';
	export let data;
	export let form: ActionData;

	const { contract } = data;

	// Initialize startDate from contract data
	let startDate: string = contract.start_date ?? '';

	// Initialize contractType and contractSubtype from the loaded contract data
	let contractType: 'Insurance' | 'Subscription' | 'Other' = contract.contract_type ?? 'Other';
	let contractSubtype: string = contract.contract_subtype ?? '';

	const subTypeMap = {
		Insurance: ['Car insurance', 'Home insurance', 'Health insurance', 'Personal Injury']
		// Future sub-types for other categories can be added here
	};

	// Initialize the radio button state based on the loaded data
	let endDateType: 'specific' | 'monthly' | 'yearly' = contract.renewal_type
		? contract.renewal_type
		: 'specific';

	// Reactively calculate the end date if 'yearly' is selected and a start date exists
	$: calculatedEndDate =
		endDateType === 'yearly' && startDate ? format(addYears(new Date(startDate), 1), 'yyyy-MM-dd') : contract.end_date ?? '';

	// When the main contract type changes, reset the sub-type if it's no longer relevant.
	$: {
		if (contractType !== 'Insurance') {
			contractSubtype = '';
		}
	}

	// Helper function to extract the readable file name from the stored path
	function getFileName(filePath: string | null): string {
		if (!filePath) return '';
		const parts = filePath.split('-');
		// Assuming the format is timestamp-filename.ext, we take everything after the first hyphen
		// If there's no hyphen, return the full path as a fallback
		return parts.length > 1 ? parts.slice(1).join('-') : filePath;
	}
</script>

<main>
	<div class="new-contract-page">
		<div class="back-links-container">
			<a href="/contracts/{contract.id}" class="back-link">&larr; Back to Details</a>
		</div>
		<h1>Edit Contract</h1>

		<form method="POST" action="?/update" enctype="multipart/form-data">
			<div class="form-group">
				<label for="contract_name">Contract Name</label>
				<input type="text" id="contract_name" name="contract_name" value={contract.contract_name ?? ''} required />
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
				<input type="text" id="vendor_name" name="vendor_name" value={contract.vendor_name ?? ''} />
			</div>
			<div class="form-group">
				<label for="contract_number">Contract Number</label>
				<input type="text" id="contract_number" name="contract_number" value={contract.contract_number ?? ''} />
			</div>
			<div class="form-group">
				<label for="vendor_link">Vendor Website Link (Optional)</label>
				<input type="url" id="vendor_link" name="vendor_link" value={contract.vendor_link ?? ''} placeholder="e.g., https://www.example.com" />
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
			<hr />
			<div class="form-group">
				<label for="start_date">Start Date</label>
				<input type="date" id="start_date" name="start_date" bind:value={startDate} />
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
						required={!!startDate}
					/>
				</div>
			{/if}

			<input type="hidden" name="renewal_type" value={endDateType === 'specific' ? '' : endDateType} />

			<div class="form-group">
				{#if contract.file_path}
					<!-- This block shows when a file is already attached -->
					<div class="attached-file-row">
						<span class="attached-file-name">Attached: {getFileName(contract.file_path)}</span>
						<form method="POST" action="?/removeFile" class="remove-file-form">
							<button type="submit" class="button button-danger">Remove</button>
						</form>
					</div>
					<label for="contract_file">Replace File (Optional)</label>
				{:else}
					<!-- This block shows when no file is attached -->
					<label for="contract_file">Upload File (Optional)</label>
				{/if}
				<div class="file-input-wrapper">
					<input type="file" id="contract_file" name="contract_file" class="file-input" />
				</div>
			</div>

			<button type="submit" class="button button-accent">Save Changes</button>
		</form>
	</div>
</main>