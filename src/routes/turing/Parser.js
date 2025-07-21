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
	if (algorithm.length > 0) algorithm = algorithm.slice(0, -1);
	const _transitions = algorithm.split(';').map(parseTransition);
	return _transitions;
}

function updateTransitionMap(transitions) {
	let transition_map = {};
	transitions.forEach((transition) => {
		const { transitionFrom, read, ...etc } = transition;
		if (!transition_map[transitionFrom]) {
			transition_map[transitionFrom] = {};
		}
		transition_map[transitionFrom][read] = etc;
	});
	return transition_map;
}

function updateTransitionMapFromAlgorithm(algorithm) {
	const transitions = parseAlgorithm(algorithm);
	return updateTransitionMap(transitions);
}

function exportTransitions(transitions) {
	let char = '';

	transitions.forEach((transition) => {
		const { transitionFrom, transitionTo, read, write, move } = transition;
		char += `${transitionFrom}->${transitionTo}:${read},${write}/${move};`;
	});

	return char;
}

function exportTransitionMap(transition_map) {
	let transitions = [];
	for (let transitionFrom in transition_map) {
		for (let transitionTo in transition_map[transitionFrom]) {
			const { read, write, move } = transition_map[transitionFrom][transitionTo];
			transitions.push({ transitionFrom, transitionTo, read, write, move });
		}
	}
	return exportTransitions(transition_map);
}

export {
	parseTransition,
	parseAlgorithm,
	updateTransitionMap,
	updateTransitionMapFromAlgorithm,
	exportTransitionMap,
	exportTransitions
};
