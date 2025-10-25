<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let isLoading = false;
	let errorMessage = '';
	let fileInput: HTMLInputElement;

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		isLoading = true;
		errorMessage = '';

		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);

		try {
			const response = await fetch('/api/process-contract', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			// Store the extracted data in sessionStorage to be picked up by the /contracts/new page
			sessionStorage.setItem('prefillContractData', JSON.stringify(result.data));

			// Redirect to the new contract page
			await goto('/contracts/new');
		} catch (e: any) {
			errorMessage = e.message || 'An unexpected error occurred during processing.';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		// For better UX, focus the file input on page load
		fileInput?.focus();
	});
</script>

<main>
	<h1>Import Contract from PDF</h1>
	<a href="/" class="back-link">&larr; Back to Dashboard</a>

	<p class="description">
		Upload a contract PDF file. The system will use AI to parse the document and pre-fill the
		contract creation form for you.
	</p>

	<form on:submit={handleSubmit} enctype="multipart/form-data">
		<div class="form-group">
			<label for="contract_pdf">PDF File</label>
			<input
				type="file"
				id="contract_pdf"
				name="contract_pdf"
				accept=".pdf"
				required
				disabled={isLoading}
				bind:this={fileInput}
			/>
		</div>

		<button type="submit" disabled={isLoading}>
			{#if isLoading}
				Processing...
			{:else}
				Upload and Process
			{/if}
		</button>

		{#if errorMessage}
			<p class="error">Error: {errorMessage}</p>
		{/if}
	</form>
</main>

<style>
	main {
		max-width: 1100px; /* Match the dashboard's max-width */
		margin: 1rem auto;
		padding: 1.5rem;
	}
	.back-link {
		display: inline-block;
		margin-bottom: 1.5rem;
	}
	.description {
		margin-bottom: 2rem;
		line-height: 1.6;
		color: var(--color-text-secondary);
	}
	.form-group {
		margin-bottom: 1.5rem;
	}
	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}
	input[type='file'] {
		width: 100%;
		padding: 0.75rem;
		font-size: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
	}
	button {
		padding: 0.75rem 1.5rem;
		background-color: var(--color-primary);
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1.1rem;
		font-weight: bold;
		transition: background-color 0.2s;
	}
	button:disabled {
		background-color: var(--color-primary);
		cursor: not-allowed;
		opacity: 0.6;
	}
	.error {
		color: var(--color-danger);
		margin-top: 1rem;
		text-align: center;
	}
</style>