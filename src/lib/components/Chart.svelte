<!--
  This component is a reusable wrapper around the Chart.js library,
  designed to work with Svelte 5. It takes chart configuration as props
  and handles the lifecycle of the chart instance, including creation,
  updates, and destruction to prevent memory leaks.
-->
<script lang="ts">
	import { Chart as ChartJS, registerables } from 'chart.js';
	import type { ChartData, ChartOptions, ChartType } from 'chart.js';

	ChartJS.register(...registerables);

	type Props = {
		type: ChartType;
		data: ChartData;
		options?: ChartOptions;
	};

	let { type, data, options }: Props = $props();
	let canvas: HTMLCanvasElement;

	$effect(() => {
		// Create the chart instance on the canvas element.
		const chart = new ChartJS(canvas, {
			type,
			data,
			options
		});

		// Return a cleanup function that Svelte will run
		// when the component is unmounted or the effect re-runs.
		return () => {
			chart.destroy();
		};
	});
</script>

<div class="chart-container">
	<canvas bind:this={canvas} />
</div>

<style>
	.chart-container {
		position: relative;
		width: 100%;
		height: 100%;
	}
</style>