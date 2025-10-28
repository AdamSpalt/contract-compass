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
		<a
			class="button button-primary disabled"
			title="Feature coming soon"
			aria-disabled="true"
			>Import from PDF</a
		>
		<a href="/contracts/new" class="button button-accent">Add New Contract</a>
	</div>
</div>
