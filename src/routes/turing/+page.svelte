<script>
	import { onMount } from 'svelte';
	import Machine from './Machine.svelte';
	import Editor from './Editor.svelte';

	let currentView = $state('editor'); // 'machine' or 'editor'

	let algorithm = $state('0->1:0,0/R; 0->2:1,1/R; 1->3:0,0/R; 1->3:1,0/R; 2->3:0,1/R; 2->3:1,1/R');

	let transitions = $state({});

	const allowedExpr = /\d->\d:\d,\d\/[RL]/;

	function parseTransition(line) {
		let pointer = 0;
		let i = 0;
		line = line.replace(/\s+/g, '');
		if (!allowedExpr.test(line)) {
			return;
		}
		let segment = line.match(/\d+|->|[:\/,]|[RHL]/g);

		return {
			transitionFrom: segment[0],
			transitionTo: segment[2],
			read: segment[4],
			write: segment[6],
			move: segment[8]
		};
	}

	function parseAlgorithm(algorithm) {
		let pointer = 0;
		const _transitions = algorithm.split(';').map(parseTransition);
		return _transitions;
	}

	function updateTransitions(algorithm) {
		transitions = {};
		const new_transitions = parseAlgorithm(algorithm);
		new_transitions.forEach((transition) => {
			const { transitionFrom, read, ...etc } = transition;
			if (!transitions[transitionFrom]) {
				transitions[transitionFrom] = {};
			}
			transitions[transitionFrom][read] = etc;
		});
	}

	function handleKeydown(event) {
		switch (event.code) {
			case 'Tab':
				event.preventDefault();
				currentView = currentView === 'machine' ? 'editor' : 'machine';
				break;
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		updateTransitions(algorithm);
	});
</script>

<div class="turing-machine">
	<div class="toggle-bar">
		<button
			class="toggle-btn {currentView === 'machine' ? 'active' : ''}"
			onclick={() => (currentView = 'machine')}
		>
			Machine
		</button>
		<button
			class="toggle-btn {currentView === 'editor' ? 'active' : ''}"
			onclick={() => (currentView = 'editor')}
		>
			Editor
		</button>
	</div>

	{#if currentView === 'machine'}
		<Machine {algorithm} {transitions} {updateTransitions} />
	{:else}
		<Editor bind:algorithm {updateTransitions} />
	{/if}
</div>

<style>
	.turing-machine {
		height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 2em;
	}
	.toggle-bar {
		position: fixed;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 0;
		background: #f5f5f5;
		border-radius: 12px;
		padding: 4px;
		z-index: 100;
	}
	.toggle-btn {
		padding: 8px 16px;
		border: none;
		background: transparent;
		border-radius: 8px;
		font-family: 'IBM Plex Mono', monospace;
		font-size: 0.9em;
		color: #666;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.toggle-btn.active {
		background: #111;
		color: white;
	}
	.toggle-btn:hover:not(.active) {
		background: #e0e0e0;
		color: #333;
	}
</style>
