<script lang="ts">
	export let searchTerm = '';
</script>

<div class="controls-container">
	<input
		type="text"
		bind:value={searchTerm}
		placeholder="Search by contract name or vendor..."
	/>
	<div class="button-group">
		<a href="/contracts/import" class="action-button import-button">Import from PDF</a>
		<a href="/contracts/new" class="action-button add-new-link">Add New Contract</a>
	</div>
</div>

<style>
	.controls-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 1.5rem 0;
	}
	.controls-container input {
		width: 50%;
		padding: 0.75rem 1rem;
		font-size: 1rem;
		border-radius: 5px;
		border: 1px solid var(--color-border);
		box-sizing: border-box;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.action-button {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		color: white;
		text-decoration: none;
		border-radius: 5px;
		font-weight: bold;
		text-align: center;
		white-space: nowrap;
	}

	.add-new-link {
		background-color: var(--color-accent);
	}

	.import-button {
		background-color: var(--color-primary);
	}

	/* --- Responsive Styles --- */
	@media (max-width: 768px) {
		.controls-container {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}
		.controls-container input {
			width: 100%;
		}
		.button-group {
			width: 100%;
			flex-direction: column;
		}
	}
</style>
