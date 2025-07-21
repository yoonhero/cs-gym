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

	function onTransitionSelect(index) {
		console.log(index);
		editingTransition = { index, ...graph.getTransition(index) };
	}

	onMount(() => {
		width = window.innerWidth;
		height = window.innerHeight;
		if (algorithm) {
			graph = Graph.loadAlgorithm(algorithm, window.innerWidth, window.innerHeight);
		} else {
			graph = new Graph();
		}

		helper = new GraphicHelper(canvas, graph, width, height, onTransitionSelect);

		window.addEventListener('resize', updateSize);
		return () => window.removeEventListener('resize', updateSize);
	});

	$effect(() => {
		helper = new GraphicHelper(canvas, graph, width, height, onTransitionSelect);
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
		<div class="edit-segment">
			<div class="edit-block-group">
				<button
					class="edit-block {editingTransition.read == '1' ? 'selected' : ''}"
					onclick={() => (editingTransition.read = editingTransition.read == '1' ? '0' : '1')}
				>
					{editingTransition.read}
				</button>
				<div class="edit-block-label">Read</div>
			</div>
			<div class="edit-block-group">
				<button
					class="edit-block {editingTransition.write == '1' ? 'selected' : ''}"
					onclick={() => (editingTransition.write = editingTransition.write == '1' ? '0' : '1')}
				>
					{editingTransition.write}
				</button>
				<div class="edit-block-label">Write</div>
			</div>
			<div class="edit-block-group">
				<button
					class="edit-block {editingTransition.move == 'R' ? 'selected' : ''}"
					onclick={() => (editingTransition.move = editingTransition.move == 'R' ? 'L' : 'R')}
				>
					{editingTransition.move}
				</button>
				<div class="edit-block-label">Move</div>
			</div>
		</div>
		<div class="edit-btn-row">
			<button class="panel-btn delete" onclick={deleteTransition} title="Delete"></button>
			<button class="panel-btn cancel" onclick={() => (editingTransition = null)} title="Cancel"
			></button>
			<button class="panel-btn save" onclick={saveTransition} title="Save"></button>
		</div>
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
		left: 50%;
		bottom: 32px;
		transform: translateX(-50%);
		background: white;
		padding: 1em 1.5em;
		border-radius: 16px;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
		z-index: 100;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5em;
	}

	.edit-segment {
		display: flex;
		gap: 1.5em;
		margin-bottom: 0;
	}

	.edit-block-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3em;
	}

	.edit-block {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5em;
		font-family: 'IBM Plex Mono', monospace;
		border: 2.5px solid #222;
		border-radius: 6px;
		background: #fff;
		color: #222;
		cursor: pointer;
		margin-bottom: 2px;
		transition:
			background 0.18s,
			color 0.18s,
			border-color 0.18s;
		user-select: none;
	}
	.edit-block.selected {
		background: #111;
		color: #fff;
		border-color: #111;
	}
	.edit-block:hover {
		border-color: #636e72;
	}
	.edit-block-label {
		font-size: 0.95em;
		color: #888;
		margin-top: 0.2em;
		font-family: 'IBM Plex Mono', monospace;
		text-align: center;
	}

	.edit-btn-row {
		display: flex;
		gap: 8px;
		margin-left: 0.5em;
	}

	.panel-btn {
		width: 20px;
		height: 20px;
		padding: 0;
		border-radius: 50%;
		border: 1px solid rgba(0, 0, 0, 0.15);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.panel-btn.save {
		background-color: #28c940;
		border-color: #1aab2e;
	}

	.panel-btn.delete {
		background-color: #ff5f57;
		border-color: #e24339;
	}

	.panel-btn.cancel {
		background-color: #ffbd2e;
		border-color: #df9d18;
	}

	.panel-btn:hover {
		filter: brightness(1.1);
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
