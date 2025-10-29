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

<main class="new-contract-page">
	<div class="back-links-container">
		<a href="/" class="back-link">&larr; Back to Dashboard</a>
	</div>
	<h1>Import Contract from PDF</h1>

	<form on:submit={handleSubmit} enctype="multipart/form-data">
		<h4 class="form-section-heading">Upload Document</h4>
		<div class="form-group">
			<label for="contract_pdf"
				>Select a contract PDF file. The system will use AI to parse the document and pre-fill the
				contract creation form for you.
				<p></p>
				<b>NOTE: This functionality is in the beta or 'preview' stage. Not all details may be collected.</b>
				</label
			>
			<input
				type="file"
				id="contract_pdf"
				name="contract_pdf"
				accept="application/pdf"
				required
				disabled={isLoading}
				bind:this={fileInput}
			/>
		</div>

		<button type="submit" class="button button-primary" disabled={isLoading}>
			{#if isLoading}
				Processing...
			{:else}
				Upload and Process
			{/if}
		</button>
	</form>
	{#if errorMessage}
		<p class="error">Error: {errorMessage}</p>
	{/if}
</main>

<style>
	.error {
		color: var(--color-danger);
		margin-top: 1rem;
	}
</style>