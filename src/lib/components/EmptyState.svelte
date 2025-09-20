<!--
  This component is a reusable UI element designed to be displayed when a part of the
  application has no content to show (e.g., no search results, no initial data).
  It provides a clear message to the user and an optional call-to-action button.
-->

<script lang="ts">
	// SECTION 1: COMPONENT LOGIC
	// This script defines the properties (props) that can be passed to this component
	// to customize its message and call-to-action button.
	export let message: string;
	export let subMessage: string | undefined = undefined;
	export let buttonText: string | undefined = undefined;
	export let buttonHref: string | undefined = undefined;
</script>

<!-- SECTION 2: HTML STRUCTURE & DISPLAY -->
<!-- This section defines the visual layout of the component. It uses conditional
     rendering to show or hide elements based on the props provided. -->
<div class="empty-state-container">
	<h3>{message}</h3>
	{#if subMessage}
		<p>{subMessage}</p>
	{/if}
	{#if buttonText && buttonHref}
		<a href={buttonHref} class="empty-state-button">{buttonText}</a>
	{/if}
</div>

<!-- SECTION 3: STYLING -->
<!-- This section contains all the CSS rules to style the empty state container,
     text, and button for a clean and clear presentation. -->
<style>
	.empty-state-container {
		text-align: center;
		padding: 2rem 1.5rem; /* Reduced vertical padding */
		background-color: #fdfdfd;
		border: 1px dashed #ccc;
		border-radius: 8px;
		margin-top: 2rem;
	}
	h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #333;
	}
	p {
		margin: 0 0 1rem 0; /* Reduced bottom margin */
		color: #666;
	}
	.empty-state-button {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background-color: #007bff;
		color: white;
		text-decoration: none;
		border-radius: 5px;
		font-weight: bold;
		transition: background-color 0.2s;
	}
	.empty-state-button:hover {
		background-color: #0056b3;
	}
</style>