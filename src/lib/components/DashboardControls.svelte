<script lang="ts">
	export let searchTerm = '';
</script>

<div class="controls-container">
	<input type="text" bind:value={searchTerm} placeholder="Search by contract name or vendor..." />
	<div class="button-group">
		<!-- 
			To re-enable, comment out the <button> below and uncomment this <a> tag:
			<a href="/contracts/import" class="button button-primary">Import from PDF</a> 
		-->
		<button class="button button-secondary" disabled title="Import from PDF is unavailable">
			Import from PDF
		</button>
		<a href="/contracts/new" class="button button-accent">Add New Contract</a>
	</div>
</div>
