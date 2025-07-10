<script>
	import { onMount } from 'svelte';
	import Head from './Head.svelte';

	let tape_block_width = 80;

	let tape = $state({ 0: 0 });
	let head_loc = $state(0);
	let windowWidth = $state(560);
	let wing_length = $derived(Math.floor(windowWidth / tape_block_width / 2) + 3);
	let display_length = $derived(2 * wing_length + 1);
	let bounds = { start: 0, end: 0 };

	let initial_state = '0';
	let final_state_set = ['3'];
	let algorithm = '0->1:0,0/R; 0->2:1,1/R; 1->3:0,0/R; 1->3:1,0/R; 2->3:0,1/R; 2->3:1,1/R';

	let transitions = {};
	let current_state = $state('0');
	let next_move = $state('');
	let is_initial = $derived(current_state == initial_state);
	let is_final = $derived(final_state_set.indexOf(current_state) != -1);

	let run = $state(false);
	let finished = $state(false);

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

	function initNextMove() {
		next_move = transitions[current_state][tape[head_loc]]['move'];
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
		next_move = move;
		console.log(write);

		setTimeout(() => {
			tape[head_loc] = write;
			if (move == 'R') {
				moveHead(1);
			} else if (move == 'L') {
				moveHead(-1);
			}
			runAlgorithm(transitionTo);
		}, 500);
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

	onMount(() => {
		lazy_loading_tape(-5, 5);
		windowWidth = window.innerWidth;
		window.addEventListener('resize', (e) => (windowWidth = window.innerWidth));
		updateTransitions(algorithm);
		initNextMove();
	});

	$effect(() => {
		lazy_loading_tape(head_loc - wing_length, head_loc + wing_length);
	});

	function moveHead(dir) {
		head_loc += dir;
	}

	function toggleCell(idx) {
		tape[idx] = 1 - tape[idx];
	}
</script>

<div class="turing-machine">
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
	<div class="controls">
		<button class="circle-btn" onclick={() => moveHead(-1)}>&lt;</button>
		<button class="circle-btn" onclick={() => moveHead(1)}>&gt;</button>
	</div>

	{#if !run}
		<button
			class="action-btn"
			onclick={() => {
				run = true;
				runAlgorithm(initial_state);
			}}
		>
			Start
		</button>
	{:else}
		<button class="action-btn" onclick={resetAlgorithm}>reset</button>
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
</style>
