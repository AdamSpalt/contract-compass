<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let currentPage: number;
	export let totalPages: number;

	const dispatch = createEventDispatcher();

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			dispatch('goToPage', page);
		}
	}
</script>

{#if totalPages > 1}
	<div class="pagination-controls">
		<button on:click={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
			&laquo; Previous
		</button>
		<span>Page {currentPage} of {totalPages}</span>
		<button on:click={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
			Next &raquo;
		</button>
	</div>
{/if}

<style>
	.pagination-controls {
		margin-top: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.9rem;
		color: #555;
		padding: 0.5rem 0;
		border-top: 1px solid #f0f0f0;
	}
	.pagination-controls button {
		padding: 0.4rem 0.8rem;
		border: 1px solid #ccc;
		background-color: #f9f9f9;
		border-radius: 5px;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	.pagination-controls button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
	.pagination-controls button:not(:disabled):hover {
		background-color: #e9e9e9;
	}
</style>