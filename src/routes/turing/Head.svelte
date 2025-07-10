<script>
	let { next_move = 'H', current_state = 0, is_initial = true, is_final = false } = $props();
</script>

<div class="head {is_initial && 'green'} {is_final && 'red'}">
	<div class="head_mark"></div>
	<div class="head_info">
		<div class="info_block">
			<span class="label">STATE</span>
			<span class="value">{current_state}</span>
		</div>
		<div class="info_block">
			<span class="label">NEXT</span>
			<span class="value">{next_move}</span>
		</div>
	</div>
</div>

<style>
	.head {
		margin-top: 14px;
		position: relative;
		padding: 10px 28px;
		border: 2px solid #1a1a1a;
		border-radius: 14px;
		background-color: #fafafa;
		display: flex;
		flex-direction: column;
		align-items: center;
		font-family: 'IBM Plex Mono', monospace;
	}

	.green {
		background-color: #cff5da;
		color: white;
	}

	.red {
		background-color: rgb(239, 177, 177);
		color: white;
	}

	.head_mark {
		position: absolute;
		top: -14px;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: 10px solid transparent;
		border-right: 10px solid transparent;
		border-bottom: 12px solid #1a1a1a;
	}

	.head_info {
		display: flex;
		flex-direction: row;
		gap: 2.5rem;
	}

	.info_block {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.label {
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		color: #666;
		margin-bottom: 0.25rem;
	}

	.value {
		font-size: 1.6rem;
		font-weight: 600;
		color: #111;
		line-height: 1;
	}
</style>
