<script lang="ts">
	export let value: string | number;
	export let label: string;
	export let highlightColor: string | null = null;
	export let clickable = false;
	export let tooltipText: string | null = null;
</script>

<div class="stat-card" class:clickable on:click>
	<span class="stat-value" style={highlightColor ? `color: ${highlightColor}` : ''}>{value}</span>
	<div class="label-container">
		<span class="stat-label">{label}</span>
		{#if tooltipText}
			<div class="tooltip-container">
				<span class="info-icon">(i)</span>
				<span class="tooltip">{tooltipText}</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.stat-card {
		background-color: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		padding: 1.5rem;
		text-align: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		transition:
			transform 0.2s ease-in-out,
			box-shadow 0.2s ease-in-out;
	}
	.clickable:hover {
		transform: translateY(-3px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
		cursor: pointer;
	}
	.stat-value {
		font-size: 2.5rem;
		font-weight: 600;
		color: #333;
		display: block;
		line-height: 1.2;
	}
	.label-container {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.3rem;
		margin-top: 0.5rem;
	}
	.stat-label {
		font-size: 0.9rem;
		color: #666;
	}
	.tooltip-container {
		position: relative;
		display: inline-block;
	}
	.info-icon {
		font-size: 0.8rem;
		color: #aaa;
		cursor: help;
		border: 1px solid #ccc;
		border-radius: 50%;
		width: 16px;
		height: 16px;
		display: inline-flex;
		justify-content: center;
		align-items: center;
		line-height: 1;
	}
	.tooltip {
		visibility: hidden;
		width: 220px;
		background-color: #333;
		color: #fff;
		text-align: center;
		border-radius: 6px;
		padding: 8px;
		position: absolute;
		z-index: 1;
		bottom: 150%;
		left: 50%;
		margin-left: -110px;
		opacity: 0;
		transition: opacity 0.3s;
		font-size: 0.85rem;
		font-weight: normal;
	}
	.tooltip-container:hover .tooltip {
		visibility: visible;
		opacity: 1;
	}
</style>