<script>
	import { onMount } from 'svelte';
	import Head from './Head.svelte';

	let { algorithm, transitions } = $props();

	let tape_block_width = 80;

	let tape = $state({ 0: 0 });
	let head_loc = $state(0);
	let windowWidth = $state(560);
	let wing_length = $derived(Math.floor(windowWidth / tape_block_width / 2) + 3);
	let display_length = $derived(2 * wing_length + 1);
	let bounds = { start: 0, end: 0 };

	let initial_state = '0';
	let final_state_set = ['3'];

	let current_state = $state('0');
	let next_move = $state('');
	let is_initial = $derived(current_state == initial_state);
	let is_final = $derived(final_state_set.indexOf(current_state) != -1);

	let run = $state(false);
	let finished = $state(false);
	let speeds = $state([0, 0, 0, 0]);
	let speed_hz = $derived(
		speeds.reduce((prev, cur, i) => prev + Math.pow(2, speeds.length - 1 - i) * cur, 0)
	); // paradoxically, 0Hz = fastest

	function lazy_loading_tape(start, end) {
		if (start < bounds.start) {
			for (let i = start; i < bounds.start; i++) {
				if (!(i in tape)) tape[i] = 0;
			}
			bounds.start = start;
		}
		if (end > bounds.end) {
			for (let i = bounds.end + 1; i <= end; i++) {
				if (!(i in tape)) tape[i] = 0;
			}
			bounds.end = end;
		}
	}

	function runAlgorithm(state) {
		if (!run) {
			return;
		}
		current_state = state;

		if (final_state_set.indexOf(state) != -1) {
			finished = true;
			return;
		}

		const read_value = tape[head_loc];
		if (!transitions[state] || !transitions[state][read_value]) {
			console.log("State is not existed or This is edge case you don't expect.");
			return;
		}
		const { transitionTo, write, move } = transitions[state][read_value];
		// next_move = move;

		setTimeout(() => {
			tape[head_loc] = write;
			if (move == 'R') {
				moveHead(1);
			} else if (move == 'L') {
				moveHead(-1);
			}
			runAlgorithm(transitionTo);
		}, 1000 / speed_hz);
		// rAF for more precise..
	}

	function startAlgorithm() {
		run = true;
		runAlgorithm(initial_state);
	}

	function restartAlgorithm() {
		run = true;
		finished = false;
		runAlgorithm(initial_state);
	}

	function resetAlgorithm() {
		run = false;
		current_state = initial_state;
		initNextMove();
	}

	function moveHead(dir) {
		head_loc += dir;
	}

	function toggle(idx) {
		speeds[idx] = 1 - speeds[idx];
	}

	function toggleCell(idx) {
		tape[idx] = 1 - tape[idx];
	}

	function handleKeydown(event) {
		switch (event.code) {
			case 'ArrowLeft':
			case 'KeyA':
				event.preventDefault();
				if (run) return;
				moveHead(-1);
				break;
			case 'ArrowRight':
			case 'KeyD':
				event.preventDefault();
				if (run) return;
				moveHead(1);
				break;
			case 'Space':
				event.preventDefault();
				if (run) {
					resetAlgorithm();
					return;
				}
				startAlgorithm();
				break;
		}
	}

	function initNextMove() {
		if (transitions[current_state] && transitions[current_state][tape[head_loc]]) {
			next_move = transitions[current_state][tape[head_loc]]['move'];
		}
	}

	$effect(() => {
		lazy_loading_tape(head_loc - wing_length, head_loc + wing_length);
	});

	onMount(() => {
		lazy_loading_tape(-5, 5);
		windowWidth = window.innerWidth;
		window.addEventListener('resize', (e) => (windowWidth = window.innerWidth));
		window.addEventListener('keydown', handleKeydown);
		initNextMove();
	});
</script>

<div class="container">
	<div class="tape_container">
		{#each Array.from({ length: display_length }) as _, i (i + head_loc - wing_length)}
			<div class="tape_block">
				<div class="tape_index">{head_loc + i - wing_length}</div>
				<button
					class="tape_button {tape[head_loc + i - wing_length] == 1 && 'inverse_tape'}"
					onclick={() => toggleCell(head_loc + i - wing_length)}
					>{tape[head_loc + i - wing_length]}</button
				>
			</div>
		{/each}
	</div>
	<Head {current_state} {next_move} {is_final} {is_initial} />
</div>
<div>
	<div class="controls">
		<button class="circle-btn" onclick={() => moveHead(-1)}>&lt;</button>
		<button class="circle-btn" onclick={() => moveHead(1)}>&gt;</button>
	</div>
	<div class="instructions">
		Use arrow keys or buttons to scroll the tape • Tab to switch views • Space to start/reset
	</div>
</div>

<div class="speed-control">
	<label for="speed">Speed: {speed_hz} Hz</label>
	<div class="flex flex-row gap-1">
		{#each speeds as val, i (i)}
			<button class="tape_button {val == 1 && 'inverse_tape'}" onclick={() => toggle(i)}>
				{speeds[i]}
			</button>
		{/each}
	</div>
</div>

{#if !run}
	<button class="action-btn" onclick={startAlgorithm}> Start </button>
{:else}
	<button class="action-btn" onclick={resetAlgorithm}>reset</button>
{/if}

<style>
	.container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
	.tape_container {
		max-width: 100vw;
		overflow: hidden;
		display: flex;
		justify-content: center;
		flex-direction: row;
		margin-bottom: 1em;
	}
	.tape_block {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0 2px;
		cursor: pointer;
		transition: box-shadow 0.2s;
	}
	.tape_index {
		font-size: 0.8em;
		color: #888;
	}
	.tape_button {
		font-family: 'IBM Plex Mono', monospace;
		width: 60px;
		height: 60px;
		background: white;
		border: 2.5px solid black;
		text-align: center;
		font-size: 1.5em;
		line-height: 60px;
		margin: 2px 0;
	}
	.inverse_tape {
		background: black;
		color: white;
	}

	.controls {
		display: flex;
		gap: 0.5em;
		justify-content: center;
	}
	.instructions {
		font-size: 0.8em;
		color: #888;
		text-align: center;
		margin-top: 1em;
		font-family: 'IBM Plex Mono', monospace;
	}
	.circle-btn {
		background: #111;
		border: none;
		border-radius: 50%;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5em;
		font-family: 'IBM Plex Mono', monospace;
		color: #fff;
		cursor: pointer;
		transition:
			transform 0.12s cubic-bezier(0.4, 0, 0.2, 1),
			background 0.18s;
		outline: none;
		box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.04);
	}
	.circle-btn:active {
		transform: scale(0.92);
		background: #222;
	}
	.circle-btn:focus-visible {
		box-shadow:
			0 0 0 2px #333,
			0 2px 8px 0 rgba(0, 0, 0, 0.04);
	}

	.action-btn {
		border: 2px solid #555;
		border-radius: 999px;
		padding: 0 1.5em;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5em;
		font-family: 'IBM Plex Mono', monospace;
		color: #222;
		cursor: pointer;
		transition:
			transform 0.12s cubic-bezier(0.4, 0, 0.2, 1),
			background 0.18s,
			box-shadow 0.18s,
			border-color 0.18s;
		outline: none;
		box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.04);
		margin-top: 1em;
	}
	.action-btn:hover {
		transform: scale(1.04);
		background: #f3f3f3;
		border-color: #000;
		box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
	}
	.action-btn:active {
		transform: scale(0.97);
		background: #222;
	}
	.action-btn:focus-visible {
		box-shadow:
			0 0 0 2px #333,
			0 2px 8px 0 rgba(0, 0, 0, 0.04);
	}

	.speed-control {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5em;
		margin-top: 1em;
		font-family: 'IBM Plex Mono', monospace;
		color: #222;
	}
</style>
