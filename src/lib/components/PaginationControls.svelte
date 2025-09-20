<!--
  This component provides simple "Previous" and "Next" navigation controls for a list of items
  that has been split into multiple pages. It is a presentational component that receives the
  current page state as props and emits events when the user clicks a button.
-->

<script lang="ts">
	// SECTION 1: COMPONENT LOGIC
	// This script defines the component's properties (currentPage, totalPages) and
	// sets up an event dispatcher to communicate with the parent component.
	import { createEventDispatcher } from 'svelte';

	// Props: These values are passed in from the parent component.
	export let currentPage: number;
	export let totalPages: number;

	const dispatch = createEventDispatcher();

	// This function is called when a button is clicked. It validates the new page number
	// and dispatches a 'goToPage' event to notify the parent component of the change.
	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			dispatch('goToPage', page);
		}
	}
</script>

<!-- SECTION 2: HTML STRUCTURE & DISPLAY -->
<!-- This section defines the visual layout of the pagination controls.
     It only renders if there is more than one page and disables buttons
     when the user is on the first or last page. -->
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
	/* SECTION 3: STYLING */
	/* This section contains all the CSS rules to style the pagination buttons and text. */
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