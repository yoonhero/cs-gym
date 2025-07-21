<script>
	import { onMount } from 'svelte';
	import { Graph, GraphicHelper } from './Graph';

	let { algorithm = $bindable() } = $props();

	let helper;
	let canvas;
	let graph;

	let isMoving;

	let width = $state(500),
		height = $state(500);

	let editingTransition = $state(null);

	// Update canvas size on window resize
	function updateSize() {
		width = window.innerWidth;
		height = window.innerHeight;
	}

	onMount(() => {
		width = window.innerWidth;
		height = window.innerHeight;
		if (algorithm) {
			graph = Graph.loadAlgorithm(algorithm, window.innerWidth, window.innerHeight);
		} else {
			graph = new Graph();
		}

		helper = new GraphicHelper(canvas, graph, width, height);
		helper.onTransitionSelect = (index) => {
			editingTransition = { index, ...graph.getTransition(index) };
		};

		window.addEventListener('resize', updateSize);
		return () => window.removeEventListener('resize', updateSize);
	});

	$effect(() => {
		helper = new GraphicHelper(canvas, graph, width, height);
	});

	function handleMove(e) {
		helper.handleMove(e);
	}
	function handleStart(e) {
		helper.handleStart(e);
	}
	function handleEnd(e) {
		helper.handleEnd(e);
		updateAlgorithm();
	}
	function handleLeave(e) {
		helper.handleEnd(e);
		updateAlgorithm();
	}

	function updateAlgorithm() {
		algorithm = graph.exportGraph();
	}

	function addState() {
		const viewpointRect = helper.getViewpointRect();
		const pos = graph.determinePos(viewpointRect);
		graph.addState(pos);
		helper.render();
		updateAlgorithm();
	}

	function handleDblClick(e) {
		helper.startCreateTransition(e);
	}

	function resetGraph() {
		graph = new Graph();
		helper.setGraph(graph);
		helper.render();
		updateAlgorithm();
	}

	function saveTransition() {
		graph.updateTransition(
			editingTransition.index,
			editingTransition.read,
			editingTransition.write,
			editingTransition.move
		);
		editingTransition = null;
		helper.render();
		updateAlgorithm();
	}

	function deleteTransition() {
		graph.deleteTransition(editingTransition.index);
		editingTransition = null;
		helper.render();
		updateAlgorithm();
	}
</script>

<canvas
	{width}
	{height}
	style:background="white"
	bind:this={canvas}
	onmousedown={handleStart}
	onmousemove={handleMove}
	onmouseup={handleEnd}
	onmouseleave={handleLeave}
	ontouchstart={handleStart}
	ontouchmove={handleMove}
	ontouchend={handleEnd}
	ontouchcancel={handleLeave}
	ondblclick={handleDblClick}
/>

<button class="add-state-btn" onclick={addState}>+ State</button>

{#if editingTransition}
	<div class="edit-panel">
		<h2>Edit Transition</h2>
		<div>
			<label>Read:</label>
			<input bind:value={editingTransition.read} />
		</div>
		<div>
			<label>Write:</label>
			<input bind:value={editingTransition.write} />
		</div>
		<div>
			<label>Move:</label>
			<input bind:value={editingTransition.move} />
		</div>
		<button onclick={saveTransition}>Save</button>
		<button onclick={deleteTransition}>Delete</button>
		<button onclick={() => (editingTransition = null)}>Cancel</button>
	</div>
{/if}

<!-- Transition Type Legend -->
<div class="legend">
	<div class="legend-title">Transition Types</div>
	<div class="legend-row">
		<span class="legend-color" style="background: #2980b9"></span> (0, 0)
	</div>
	<div class="legend-row">
		<span class="legend-color" style="background: #27ae60"></span> (0, 1)
	</div>
	<div class="legend-row">
		<span class="legend-color" style="background: #fdcb6e"></span> (1, 0)
	</div>
	<div class="legend-row">
		<span class="legend-color" style="background: #d63031"></span> (1, 1)
	</div>
	<div class="legend-row"><span class="legend-color" style="background: #b2bec3"></span> Other</div>
</div>

<!-- Reset Button -->
<button class="reset-btn" onclick={resetGraph}>Reset</button>

<style>
	.edit-panel {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: white;
		padding: 2em;
		border-radius: 8px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
		z-index: 100;
	}
	canvas {
		position: fixed;
		left: 0;
		top: 0;
		display: block;
		background: white;
		z-index: 0;
	}
	.add-state-btn {
		position: fixed;
		top: 32px;
		right: 32px;
		padding: 0.6em 1em;
		background: #111;
		color: white;
		border: none;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		font-size: 1.1em;
		font-family: 'IBM Plex Mono', monospace;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 0.2s,
			box-shadow 0.2s;
		z-index: 10;
	}
	.add-state-btn:hover {
		background: #222;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	}
	.legend {
		position: fixed;
		top: 24px;
		left: 24px;
		background: rgba(255, 255, 255, 0.95);
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		padding: 1em 1.2em 1em 1em;
		z-index: 20;
		font-family: 'IBM Plex Mono', monospace;
		font-size: 1em;
		min-width: 140px;
	}
	.legend-title {
		font-weight: bold;
		margin-bottom: 0.5em;
		font-size: 1.05em;
	}
	.legend-row {
		display: flex;
		align-items: center;
		margin-bottom: 0.3em;
		gap: 0.6em;
	}
	.legend-color {
		display: inline-block;
		width: 1.2em;
		height: 1.2em;
		border-radius: 0.3em;
		border: 1.5px solid #e0e0e0;
		margin-right: 0.4em;
	}
	.reset-btn {
		position: fixed;
		bottom: 32px;
		left: 32px;
		padding: 0.6em 1.2em;
		background: #b2bec3;
		color: #222;
		border: none;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		font-size: 1.1em;
		font-family: 'IBM Plex Mono', monospace;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 0.2s,
			box-shadow 0.2s;
		z-index: 20;
	}
	.reset-btn:hover {
		background: #636e72;
		color: #fff;
	}
</style>
