<script lang="ts">
	export let value: string | number;
	export let label: string;
	export let highlightColor: string | null = null;
	export let clickable = false;
	export let tooltipText: string | null = null;
	export let active = false;
	export let subLabel: string = '';
</script>

<div class="card" class:clickable class:active on:click>
	<span class="stat-value" style={highlightColor ? `color: ${highlightColor}` : ''}>{value}</span>
	<div class="label-container">
		<div class="main-label-line">
			<span class="stat-label">{label}</span>
			{#if tooltipText}
				<div class="tooltip-container">
					<span class="info-icon">?</span>
					<span class="tooltip">{tooltipText}</span>
				</div>
			{/if}
		</div>
		{#if subLabel}
			<span class="sub-label">{subLabel}</span>
		{/if}
	</div>
</div>