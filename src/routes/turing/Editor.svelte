<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';

	let { algorithm, updateTransitions } = $props();

	let helper;
	let graph;

	let canvas;

	let isMoving;

	let nodeBrdColor = 'white';
	let nodeBaColor = 'gray';

	let width = 480,
		height = 480;

	class StateNode {
		constructor(value, x, y) {
			this.value = value;
			this.x = x;
			this.y = y;
		}

		updateCoord(x, y) {
			this.x = x;
			this.y = y;
		}
	}

	class Graph {
		constructor() {
			this.states = [];
			this.transitions = {};
		}

		addState() {
			getPos;
			const node = StateNode();
			this.states.push();
		}

		handleUpdate() {
			generateAlgorithm();
		}

		handleReset() {
			algorithm = '';
			updateTransitions(algorithm);
		}
	}

	class GraphicHelper {
		constructor(graph) {
			this.graph = graph;

			this.ctx = canvas.getContext('2d');
			const { top, left } = canvas.getBoundingClientRect();
			this.top = top;
			this.left = left;

			this.unit = 50;
			this.zoom = 1; // zoom level -> 50px = unit vec
			this.translation = { x: 0, y: 0 }; // 평행이동
			this.setZoom(this.zoom);
			this.renderBoundingBox = { x: 0, y: 0, xx: this.boundingWidth, yy: this.boundingHeight };

			this.prevX;
			this.prevY;
			this.isTranslation = false;

			this.render();
		}

		setZoom(zoom) {
			this.boundingWidth = width / zoom;
			this.boundingHeight = height / zoom;
		}

		clear() {
			this.ctx.setTransform(1, 0, 0, 1, 0, 0);
			const { x, y, xx, yy } = this.renderBoundingBox;
			this.ctx.clearRect(x, y, xx, yy);
		}

		renderStates() {
			// const _states = this.graph.states
		}

		renderBoard() {
			const scale = this.unit;
			const { x, y, xx, yy } = this.renderBoundingBox;
			const lineWidth = xx - x;
			const lineHeight = yy - y;
			const n_xAxis = Math.floor(lineHeight / scale) + 1;
			const n_yAxis = Math.floor(lineWidth / scale) + 1;

			// top-left -> int(translation)
			// let traY = ty - Math.floor(ty); // % 1 is unstable
			// let traX = tx - Math.floor(tx);
			// traY = traY != 0 ? 1 - traY : traY;
			// traX = traX != 0 ? 1 - traX : traX;

			// Draw grid lines along X-axis
			for (let i = 0; i <= n_xAxis; i++) {
				this.ctx.beginPath();
				this.ctx.lineWidth = 1;
				this.ctx.strokeStyle = '#e9e9e9';
				this.ctx.moveTo(x, y + i * scale);
				this.ctx.lineTo(xx, y + i * scale);
				this.ctx.stroke();
			}

			for (let i = 0; i <= n_xAxis; i++) {
				this.ctx.beginPath();
				this.ctx.lineWidth = 1;
				this.ctx.strokeStyle = '#e9e9e9';
				this.ctx.moveTo(x + i * scale, y);
				this.ctx.lineTo(x + i * scale, yy);
				this.ctx.stroke();
			}
		}

		render() {
			this.clear();
			this.ctx.setTransform(this.zoom, 0, 0, this.zoom, this.translation.x, this.translation.y);
			this.renderBoard();
			this.renderStates();
		}

		handleStart(e) {
			this.isTranslation = true;
			this.prevX = e.clientX;
			this.prevY = e.clientY;
		}
		handleMove(e) {
			if (!this.isTranslation || !this.translation) return;
			const { clientX, clientY } = e;
			this.translation.x += clientX - this.prevX;
			this.translation.y += clientY - this.prevY;

			const { x: tx, y: ty } = this.translation;
			const { x, y, xx, yy } = this.renderBoundingBox;
			if (tx > 0 && this.boundingWidth + tx > xx) {
				this.renderBoundingBox.xx = this.boundingWidth + tx;
			} else if (tx < x) {
				this.renderBoundingBox.x = tx;
			}
			if (ty > 0 && this.boundingHeight + ty > yy) {
				this.renderBoundingBox.yy = this.boundingHeight + ty;
			} else if (ty < y) {
				this.renderBoundingBox.y = ty;
			}
			this.render();

			this.prevX = clientX;
			this.prevY = clientY;
		}
		handleEnd(e) {
			this.isTranslation = false;
		}
		handleLeave(e) {
			this.isTranslation = false;
		}
	}

	onMount(() => {
		// width = window.innerWidth;
		// height = window.innerHeight;
		graph = new Graph();
		helper = new GraphicHelper(graph);
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
/>

<button onclick={helper.addState}>Add State</button>

<!-- control panel -->
<div>
	<h1></h1>
</div>

<!-- on:mousedown={handleStart}
	on:touchstart={(e) => {
		const { clientX, clientY } = e.touches[0];
		handleStart({
			offsetX: clientX - l,
			offsetY: clientY - t
		});
	}}
	on:mouseup={handleEnd}
	on:touchend={handleEnd}
	on:mouseleave={handleEnd}
	on:mousemove={handleMove}
	on:touchmove={(e) => {
		const { clientX, clientY } = e.touches[0];
		handleMove({
			offsetX: clientX - l,
			offsetY: clientY - t
		});
	}} -->

<style>
	canvas {
		position: fixed;
		left: 0;
		top: 0;
	}
</style>
