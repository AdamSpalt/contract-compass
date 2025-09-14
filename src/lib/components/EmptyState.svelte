<script lang="ts">
	export let message: string;
	export let subMessage: string | undefined = undefined;
	export let buttonText: string | undefined = undefined;
	export let buttonHref: string | undefined = undefined;
</script>

<div class="empty-state-container">
	<h3>{message}</h3>
	{#if subMessage}
		<p>{subMessage}</p>
	{/if}
	{#if buttonText && buttonHref}
		<a href={buttonHref} class="empty-state-button">{buttonText}</a>
	{/if}
</div>

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