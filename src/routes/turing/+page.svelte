<script>
	import { onMount } from 'svelte';
	import Machine from './Machine.svelte';
	import Editor from './Editor.svelte';
	import { Graph } from './Graph';
	import { updateTransitionMapFromAlgorithm } from './Parser';

	let currentView = $state('editor'); // 'machine' or 'editor'

	let algorithm = $state('0->1:0,0/R; 0->2:1,1/R; 1->3:0,0/R; 1->3:1,0/R; 2->3:0,1/R; 2->3:1,1/R;');
	let transitions = $state({});
	// let exportGraph = $state()

	function changeCurrentView(mode) {
		// if (exportGraph) algorithm = exportGraph()
		currentView = mode;
	}

	function handleKeydown(event) {
		switch (event.code) {
			case 'Tab':
				event.preventDefault();
				if (currentView === 'machine') {
					changeCurrentView('editor');
				} else {
					changeCurrentView('machine');
				}
				break;
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		transitions = updateTransitionMapFromAlgorithm(algorithm);
	});
</script>

<div class="turing-machine">
	<div class="toggle-bar">
		<button
			class="toggle-btn {currentView === 'machine' ? 'active' : ''}"
			onclick={() => changeCurrentView('machine')}
		>
			Machine
		</button>
		<button
			class="toggle-btn {currentView === 'editor' ? 'active' : ''}"
			onclick={() => changeCurrentView('editor')}
		>
			Editor
		</button>
	</div>

	{#if currentView === 'machine'}
		<Machine {algorithm} {transitions} />
	{:else}
		<Editor bind:algorithm />
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
