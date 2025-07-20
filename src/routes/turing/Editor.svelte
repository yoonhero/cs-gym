<script>
	import { onMount } from 'svelte';
	import { Graph, GraphicHelper } from './Graph';

	let { algorithm, updateTransitions } = $props();

	let helper;
	let canvas;
	let graph;

	let isMoving;

	let width = $state(500),
		height = $state(500);

	// Update canvas size on window resize
	function updateSize() {
		width = window.innerWidth;
		height = window.innerHeight;
		if (helper) {
			helper = new GraphicHelper(canvas, graph, width, height);
		}
	}

	onMount(() => {
		width = window.innerWidth;
		height = window.innerHeight;
		graph = new Graph();
		helper = new GraphicHelper(canvas, graph, width, height);
		window.addEventListener('resize', updateSize);
		return () => window.removeEventListener('resize', updateSize);
	});

	function handleMove(e) {
		helper.handleMove(e);
	}
	function handleStart(e) {
		helper.handleStart(e);
	}
	function handleEnd(e) {
		helper.handleEnd(e);
	}
	function handleLeave(e) {
		helper.handleLeave(e);
	}

	function addState() {
		const viewpointRect = helper.getViewpointRect();
		const pos = graph.determinePos(viewpointRect);
		graph.addState(pos);
		helper.render();
	}

	function handleDblClick(e) {
		helper.startCreateTransition(e);
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

<!-- control panel -->
<div>
	<h1></h1>
</div>

<style>
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
		background: #111; /* or keep #2563eb for emphasis */
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
		background: #222; /* or #1d4ed8 if keeping blue */
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	}
</style>
