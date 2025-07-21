import { exportTransitions, parseAlgorithm } from './Parser';

export let radius = 40;

let axisColor = '#e9e9e9';
let nodeBaColor = '#111';
let textColor = 'white';

class GraphicHelper {
	constructor(canvas, graph, width, height, onTransitionSelect = () => {}) {
		this.graph = graph;
		this.ctx = canvas.getContext('2d');
		const { top, left } = canvas.getBoundingClientRect();
		this.top = top;
		this.left = left;
		const tx = 0,
			ty = 0;
		this.width = width;
		this.height = height;
		this.unit = 50;
		this.zoom = 1; // zoom level -> 50px = unit vec
		this.translation = { x: 0, y: 0 }; // screen space translation
		this.setZoom(this.zoom);
		this.renderBoundingBox = {
			x: tx,
			y: ty,
			xx: this.boundingWidth + tx,
			yy: this.boundingHeight + ty
		};

		this.prevX;
		this.prevY;
		this.isTranslation = false;
		this.focusedState;
		this.isStateMove = false;
		this.isCreatingTransition = false;
		this.transitionStartState = null;
		this.transitionCurrentPos = null;

		this.onTransitionSelect = onTransitionSelect;

		this.render();
	}

	updateBox(width, height) {
		this.width = width;
		this.height = height;
		this.setZoom(this.zoom);
	}

	getViewpointRect() {
		const { x: tx, y: ty } = this.translation;
		const viewpointRect = {
			x: -tx,
			y: -ty,
			xx: -tx + this.boundingWidth,
			yy: -ty + this.boundingHeight
		};
		return viewpointRect;
	}

	getLocalPos(pos) {
		const { x, y } = pos;
		const { x: tx, y: ty } = this.translation;
		return { x: -tx + x / this.zoom, y: -ty + y / this.zoom };
	}

	setZoom(zoom) {
		this.zoom = zoom;
		this.boundingWidth = this.width / zoom;
		this.boundingHeight = this.height / zoom;
	}

	setGraph(graph) {
		this.graph = graph;
	}

	clear() {
		this.ctx.setTransform(this.zoom, 0, 0, this.zoom, 0, 0);
		const { x, y, xx, yy } = this.renderBoundingBox;
		this.ctx.clearRect(x - 50, y - 50, xx + 50, yy + 50);
	}

	renderTransition(arrow, curveOffset = 0, totalCurves = 1) {
		const { fromPos, toPos, read, write, move } = arrow;

		// Choose color based on (read, write)
		let color;
		if (read === '0' && write === '0')
			color = '#2980b9'; // Blue
		else if (read === '0' && write === '1')
			color = '#27ae60'; // Green
		else if (read === '1' && write === '0')
			color = '#fdcb6e'; // Orange
		else if (read === '1' && write === '1')
			color = '#d63031'; // Red
		else color = '#b2bec3'; // Gray for unexpected values

		const ctx = this.ctx;
		ctx.save();
		ctx.strokeStyle = color;
		ctx.fillStyle = color;
		ctx.lineWidth = 4;

		// Self-loop
		if (fromPos.x === toPos.x && fromPos.y === toPos.y) {
			// Improved: offset multiple self-loops horizontally
			const loopRadius = radius * 0.9;
			const baseAngle = -Math.PI / 2; // Always above
			const offsetStep = Math.PI / 8; // Spread loops horizontally
			const offsetAngle = baseAngle + (curveOffset - (totalCurves - 1) / 2) * offsetStep;
			const cx = fromPos.x + Math.cos(offsetAngle) * (radius + loopRadius);
			const cy = fromPos.y + Math.sin(offsetAngle) * (radius + loopRadius);

			ctx.beginPath();
			ctx.arc(cx, cy, loopRadius, Math.PI * 0.7, Math.PI * 2.3, false);
			ctx.stroke();

			// Arrowhead for loop
			const arrowAngle = Math.PI * 2.3;
			const arrowX = cx + loopRadius * Math.cos(arrowAngle);
			const arrowY = cy + loopRadius * Math.sin(arrowAngle);
			const arrowLength = 14;
			ctx.beginPath();
			ctx.moveTo(arrowX, arrowY);
			ctx.lineTo(
				arrowX - arrowLength * Math.cos(arrowAngle - Math.PI / 6),
				arrowY - arrowLength * Math.sin(arrowAngle - Math.PI / 6)
			);
			ctx.lineTo(
				arrowX - arrowLength * Math.cos(arrowAngle + Math.PI / 6),
				arrowY - arrowLength * Math.sin(arrowAngle + Math.PI / 6)
			);
			ctx.closePath();
			ctx.fill();

			// Label: further above the loop for clarity
			const labelOffset = loopRadius + 18;
			const labelX = cx;
			const labelY = cy - labelOffset;
			ctx.save();
			ctx.font = 'bold 20px Arial';
			ctx.fillStyle = color;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'bottom';
			ctx.fillText(move, labelX, labelY);
			ctx.restore();

			ctx.restore();
			return;
		}

		// Calculate direction
		const dx = toPos.x - fromPos.x;
		const dy = toPos.y - fromPos.y;
		const len = Math.sqrt(dx * dx + dy * dy);

		// Shorten the line so it doesn't overlap the node circles
		const startX = fromPos.x + (dx / len) * radius;
		const startY = fromPos.y + (dy / len) * radius;
		const endX = toPos.x - (dx / len) * radius;
		const endY = toPos.y - (dy / len) * radius;

		// Curved edge for multiple transitions
		let mx = (startX + endX) / 2;
		let my = (startY + endY) / 2;
		if (totalCurves > 1) {
			// Perpendicular direction
			const norm = { x: -dy / len, y: dx / len };
			const curveStrength = 40 + 12 * (totalCurves - 2); // More curves, more spread
			const offset = (curveOffset - (totalCurves - 1) / 2) * curveStrength;
			mx += norm.x * offset;
			my += norm.y * offset;
		}

		ctx.beginPath();
		if (totalCurves > 1) {
			ctx.moveTo(startX, startY);
			ctx.quadraticCurveTo(mx, my, endX, endY);
		} else {
			ctx.moveTo(startX, startY);
			ctx.lineTo(endX, endY);
		}
		ctx.stroke();

		// Draw arrowhead
		const arrowLength = 18;
		let angle;
		if (totalCurves > 1) {
			// Angle of tangent at end of quadratic curve
			const t = 0.95;
			const dxCurve = 2 * (1 - t) * (mx - startX) + 2 * t * (endX - mx);
			const dyCurve = 2 * (1 - t) * (my - startY) + 2 * t * (endY - my);
			angle = Math.atan2(dyCurve, dxCurve);
		} else {
			angle = Math.atan2(dy, dx);
		}

		ctx.beginPath();
		ctx.moveTo(endX, endY);
		ctx.lineTo(
			endX - arrowLength * Math.cos(angle - Math.PI / 6),
			endY - arrowLength * Math.sin(angle - Math.PI / 6)
		);
		ctx.lineTo(
			endX - arrowLength * Math.cos(angle + Math.PI / 6),
			endY - arrowLength * Math.sin(angle + Math.PI / 6)
		);
		ctx.closePath();
		ctx.fill();

		// Draw move label at the middle of the curve
		ctx.save();
		ctx.font = 'bold 20px Arial';
		ctx.fillStyle = color;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		ctx.fillText(move, mx, my - 8);
		ctx.restore();

		ctx.restore();
	}

	renderTransitions() {
		if (!this.graph) return;
		// Group transitions by unordered pair (from, to)
		const groups = {};
		const transitions = this.graph.transitions();
		for (let i = 0; i < transitions.length; i++) {
			const t = transitions[i];
			if (t.transitionFrom === t.transitionTo) {
				// Self-loops: use unique key
				const key = `self:${t.transitionFrom}`;
				if (!groups[key]) groups[key] = [];
				groups[key].push(t);
			} else {
				const sorted = [t.transitionFrom, t.transitionTo].sort((a, b) => a - b);
				const key = `${sorted[0]},${sorted[1]}`;
				if (!groups[key]) groups[key] = [];
				groups[key].push(t);
			}
		}
		// Draw each group with mirrored curve offsets for each direction
		for (const key in groups) {
			const group = groups[key];
			if (key.startsWith('self:')) {
				// Self-loops: all transitions are self-loops on the same node
				for (let i = 0; i < group.length; i++) {
					const arrow = this.graph.getTransitionArrow(group[i]);
					this.renderTransition(arrow, i, group.length);
				}
			} else {
				// Split by direction
				const [a, b] = key.split(',');
				const forward = group.filter((t) => t.transitionFrom == a && t.transitionTo == b);
				const backward = group.filter((t) => t.transitionFrom == b && t.transitionTo == a);
				// Forward: curveOffset 0,1,2...; Backward: curveOffset 0,-1,-2...
				for (let i = 0; i < forward.length; i++) {
					const arrow = this.graph.getTransitionArrow(forward[i]);
					this.renderTransition(arrow, i + 1, Math.max(forward.length, backward.length));
				}
				for (let i = 0; i < backward.length; i++) {
					const arrow = this.graph.getTransitionArrow(backward[i]);
					this.renderTransition(arrow, -(i + 1), Math.max(forward.length, backward.length));
				}
			}
		}
	}

	renderState(key, pos) {
		const { x, y } = pos;
		this.ctx.save();

		// Draw shadow for depth
		this.ctx.shadowColor = 'rgba(0,0,0,0.15)';
		this.ctx.shadowBlur = 8;
		this.ctx.shadowOffsetX = 2;
		this.ctx.shadowOffsetY = 2;

		// Draw main circle
		this.ctx.beginPath();
		this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
		this.ctx.fillStyle = nodeBaColor;
		this.ctx.fill();

		// Remove shadow for text
		this.ctx.shadowColor = 'transparent';

		// Draw state label
		this.ctx.fillStyle = textColor;
		this.ctx.textAlign = 'center';
		this.ctx.textBaseline = 'middle';
		this.ctx.font = 'bold 40px Arial';
		this.ctx.fillText(`${key}`, x, y);

		this.ctx.restore();
	}

	renderStates() {
		if (!this.graph) return;
		for (let key in this.graph.states()) {
			const pos = this.graph.statePos(key);
			this.renderState(key, pos);
		}
	}

	renderBoard() {
		const scale = this.unit; // in logical units
		const { x, y, xx, yy } = this.renderBoundingBox;

		const xStart = Math.floor(x / scale) * scale;
		const xEnd = Math.ceil(xx / scale) * scale;
		const yStart = Math.floor(y / scale) * scale;
		const yEnd = Math.ceil(yy / scale) * scale;

		// Draw horizontal lines
		for (let yLine = yStart; yLine <= yEnd; yLine += scale) {
			this.ctx.beginPath();
			this.ctx.lineWidth = 0.8;
			this.ctx.strokeStyle = axisColor;
			this.ctx.moveTo(xStart, yLine);
			this.ctx.lineTo(xEnd, yLine);
			this.ctx.stroke();
		}

		// Draw vertical lines
		for (let xLine = xStart; xLine <= xEnd; xLine += scale) {
			this.ctx.beginPath();
			this.ctx.lineWidth = 0.8;
			this.ctx.strokeStyle = axisColor;
			this.ctx.moveTo(xLine, yStart);
			this.ctx.lineTo(xLine, yEnd);
			this.ctx.stroke();
		}
	}

	render() {
		this.clear();
		this.ctx.setTransform(this.zoom, 0, 0, this.zoom, this.translation.x, this.translation.y);

		const { x: tx, y: ty } = this.translation;
		let traX = -tx,
			traY = -ty;

		const { x, y, xx, yy } = this.renderBoundingBox;
		const newXX = this.boundingWidth + traX;
		const newYY = this.boundingHeight + traY;

		this.renderBoundingBox = {
			x: traX < x ? traX : x,
			xx: newXX > xx ? newXX : xx,
			y: traY < y ? traY : y,
			yy: newYY > yy ? newYY : yy
		};

		this.renderBoard();
		this.renderTransitions();
		this.renderStates();

		if (this.isCreatingTransition && this.transitionStartState && this.transitionCurrentPos) {
			const fromPos = this.graph.statePos(this.transitionStartState);
			const toPos = this.transitionCurrentPos;
			this.renderTemporaryTransition(fromPos, toPos);
		}
	}

	handleStart(e) {
		const pos = this.getLocalPos({ x: e.clientX, y: e.clientY });
		this.prevX = e.clientX;
		this.prevY = e.clientY;

		const stateID = this.graph.check(pos);
		if (stateID) {
			this.isStateMove = true;
			this.focusedState = stateID;
		} else {
			const vertexIndex = this.graph.checkVertexesClick(pos);
			if (vertexIndex !== undefined) {
				console.log(this.onTransitionSelect);
				this.onTransitionSelect(vertexIndex);
			} else {
				this.isTranslation = true;
			}
		}
	}

	handleMove(e) {
		const { clientX, clientY } = e;
		const dx = (clientX - this.prevX) / this.zoom,
			dy = (clientY - this.prevY) / this.zoom;

		if (this.isTranslation && this.translation) this.handleBoard(dx, dy);
		else if (this.isStateMove) this.handleState(dx, dy);
		else if (this.isCreatingTransition) {
			this.transitionCurrentPos = this.getLocalPos({ x: clientX, y: clientY });
		}

		this.prevX = clientX;
		this.prevY = clientY;
		this.render();
	}

	handleBoard(dx, dy) {
		if (this.translation.x + dx > 0 || this.translation.y + dy > 0) return;

		this.translation.x += dx;
		this.translation.y += dy;
	}

	handleState(dx, dy) {
		this.graph.updateState(this.focusedState, dx, dy);
	}

	handleEnd(e) {
		if (this.isCreatingTransition) {
			const pos = this.getLocalPos({ x: e.clientX, y: e.clientY });
			const endStateID = this.graph.check(pos);
			if (endStateID) {
				this.graph.addTransition(this.transitionStartState, endStateID);
				this.onTransitionSelect(this.graph.transitions().length - 1);
			}
			this.isCreatingTransition = false;
			this.transitionStartState = null;
			this.transitionCurrentPos = null;

			if (endStateID) {
				this.render();
				return true;
			}
		}
		this.isStateMove = false;
		this.isTranslation = false;
	}

	handleLeave(e) {
		this.isStateMove = false;
		this.isTranslation = false;
		this.isDblClick = false;
	}

	startCreateTransition(e) {
		const pos = this.getLocalPos({ x: e.clientX, y: e.clientY });
		const startStateID = this.graph.check(pos);

		if (!startStateID) return;

		this.isCreatingTransition = true;
		this.transitionStartState = startStateID;
		this.transitionCurrentPos = pos;
		this.render();
	}

	createTransition() {
		const pos = this.getLocalPos(this.dblCurPos);
		const endStateID = this.graph.check(pos);
		if (endStateID) {
			this.graph.addTransition(this.dblStartID, endStateID);
		}

		this.dblStartID;
		this.dblStartPos;
		this.dblCurPos;

		this.render();
	}
}

class StateNode {
	constructor(value, pos) {
		this.value = value;
		this.x = pos.x;
		this.y = pos.y;
		this.radius = radius;
	}

	pos() {
		return { x: this.x, y: this.y };
	}

	updateCoord(dx, dy) {
		this.x += dx;
		this.y += dy;
	}

	checkClick(pos) {
		return (this.x - pos.x) ** 2 + (this.y - pos.y) ** 2 < this.radius ** 2;
	}
}

class TransitionVertex {
	constructor(transitionFrom, transitionTo, read, write, move) {
		this.transitionFrom = transitionFrom;
		this.transitionTo = transitionTo;
		this.read = read;
		this.write = write;
		this.move = move;
	}

	transition() {
		return {
			transitionFrom: this.transitionFrom,
			transitionTo: this.transitionTo,
			read: this.read,
			write: this.write,
			move: this.move
		};
	}

	checkClick(pos, startPos, endPos, curveOffset = 0, totalCurves = 1) {
		const clickThreshold = 8; // pixels, generous for touch

		// Self-loop
		if (startPos.x === endPos.x && startPos.y === endPos.y) {
			const loopRadius = radius * 0.9;
			const baseAngle = -Math.PI / 2;
			const offsetStep = Math.PI / 8;
			const offsetAngle = baseAngle + (curveOffset - (totalCurves - 1) / 2) * offsetStep;
			const cx = startPos.x + Math.cos(offsetAngle) * (radius + loopRadius);
			const cy = startPos.y + Math.sin(offsetAngle) * (radius + loopRadius);

			const dist = Math.sqrt((pos.x - cx) ** 2 + (pos.y - cy) ** 2);
			return Math.abs(dist - loopRadius) < clickThreshold;
		}

		// Line between two different states
		const dx = endPos.x - startPos.x;
		const dy = endPos.y - startPos.y;
		const len = Math.sqrt(dx * dx + dy * dy);

		if (len === 0) return false;

		const startX = startPos.x + (dx / len) * radius;
		const startY = startPos.y + (dy / len) * radius;
		const endX = endPos.x - (dx / len) * radius;
		const endY = endPos.y - (dy / len) * radius;

		// Straight line
		if (totalCurves <= 1) {
			const lineLenSq = (endX - startX) ** 2 + (endY - startY) ** 2;
			if (lineLenSq === 0) return false;

			const t =
				((pos.x - startX) * (endX - startX) + (pos.y - startY) * (endY - startY)) / lineLenSq;

			if (t < 0 || t > 1) {
				return false; // Click is outside the line segment
			}

			// Projection is on the segment, check distance to line
			const dist =
				Math.abs((endX - startX) * (startY - pos.y) - (startX - pos.x) * (endY - startY)) /
				Math.sqrt(lineLenSq);

			return dist < clickThreshold;
		}

		// Curved line
		let mx = (startX + endX) / 2;
		let my = (startY + endY) / 2;

		const norm = { x: -dy / len, y: dx / len };
		const curveStrength = 40 + 12 * (totalCurves - 2);
		const offset = (curveOffset - (totalCurves - 1) / 2) * curveStrength;
		mx += norm.x * offset;
		my += norm.y * offset;

		// Check distance to quadratic Bezier curve by sampling
		let min_dist_sq = Infinity;
		const p0 = { x: startX, y: startY };
		const p1 = { x: mx, y: my };
		const p2 = { x: endX, y: endY };

		for (let t = 0; t <= 1; t += 0.05) {
			const mt = 1 - t;
			const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
			const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
			const dist_sq = (pos.x - x) ** 2 + (pos.y - y) ** 2;
			if (dist_sq < min_dist_sq) {
				min_dist_sq = dist_sq;
			}
		}

		return min_dist_sq < clickThreshold ** 2;
	}
}

// 0~1 X + X + X ... ~ N(n*mu, std/root(n))
function CLT(times) {
	let num = 0;
	for (let i = 0; i < times; i++) {
		num += Math.random();
	}
	return num / times;
}

class Graph {
	constructor() {
		this._states = {};
		this._transitions = [];
	}

	states() {
		return this._states;
	}

	transitions() {
		return this._transitions;
	}

	statePos(value) {
		return this._states[value].pos();
	}

	determinePos(viewpointRect) {
		const { x: sx, y: sy, xx, yy } = viewpointRect;
		while (true) {
			const newX = CLT(3) * (xx - sx) + sx;
			const newY = CLT(3) * (yy - sy) + sy;
			const pos = { x: newX, y: newY };
			const check = this.check(pos);
			if (check) {
				continue;
			}
			return pos;
		}
	}

	getTransitionArrow(transition) {
		const { transitionFrom, transitionTo, read, write, move } = transition;
		return {
			fromPos: this.statePos(transitionFrom),
			toPos: this.statePos(transitionTo),
			read,
			write,
			move
		};
	}

	addState(pos, key = undefined) {
		if (!key) key = Object.keys(this._states).length;
		const node = new StateNode(key, pos);
		this._states[node.value] = node;
	}

	updateState(value, dx, dy) {
		this._states[value].updateCoord(dx, dy);
	}

	addTransition(transitionFrom, transitionTo, read = '0', write = '0', move = 'H') {
		const transition = new TransitionVertex(transitionFrom, transitionTo, read, write, move);
		this._transitions.push(transition);
	}

	check(pos) {
		for (let i in this._states) {
			if (this._states[i].checkClick(pos)) return i;
		}
	}

	checkVertexesClick(pos) {
		const groups = {};
		const transitions = this.transitions();
		for (let i = 0; i < transitions.length; i++) {
			const t = transitions[i];
			if (t.transitionFrom === t.transitionTo) {
				const key = `self:${t.transitionFrom}`;
				if (!groups[key]) groups[key] = [];
				groups[key].push({ ...t, originalIndex: i });
			} else {
				const sorted = [t.transitionFrom, t.transitionTo].sort((a, b) => a - b);
				const key = `${sorted[0]},${sorted[1]}`;
				if (!groups[key]) groups[key] = [];
				groups[key].push({ ...t, originalIndex: i });
			}
		}

		for (const key in groups) {
			const group = groups[key];
			if (key.startsWith('self:')) {
				for (let i = 0; i < group.length; i++) {
					const t = group[i];
					const startPos = this.statePos(t.transitionFrom);
					if (t.checkClick(pos, startPos, startPos, i, group.length)) {
						return t.originalIndex;
					}
				}
			} else {
				const [a, b] = key.split(',');
				const forward = group.filter((t) => t.transitionFrom == a && t.transitionTo == b);
				const backward = group.filter((t) => t.transitionFrom == b && t.transitionTo == a);

				for (let i = 0; i < forward.length; i++) {
					const t = forward[i];
					const startPos = this.statePos(t.transitionFrom);
					const endPos = this.statePos(t.transitionTo);
					console.log(t.checkClick);
					if (
						t.checkClick(pos, startPos, endPos, i + 1, Math.max(forward.length, backward.length))
					) {
						return t.originalIndex;
					}
				}

				for (let i = 0; i < backward.length; i++) {
					const t = backward[i];
					const startPos = this.statePos(t.transitionFrom);
					const endPos = this.statePos(t.transitionTo);
					if (
						t.checkClick(pos, startPos, endPos, -(i + 1), Math.max(forward.length, backward.length))
					) {
						return t.originalIndex;
					}
				}
			}
		}
	}

	exportGraph() {
		return exportTransitions(this._transitions);
	}

	handleReset() {
		this.algorithm = '';
		updateTransitions(algorithm);
	}

	static loadAlgorithm(algorithm, width, height) {
		let graph = new Graph();
		let transitions = parseAlgorithm(algorithm);
		let states = [];
		const viewpointRect = { x: 0, y: 0, xx: width, yy: height };
		transitions.forEach((transition) => {
			const { transitionFrom, transitionTo, read, write, move } = transition;
			if (states.indexOf(transitionFrom) == -1) {
				const pos = graph.determinePos(viewpointRect);
				graph.addState(pos, transitionFrom);
				states.push(transitionFrom);
			}
			if (states.indexOf(transitionTo) == -1) {
				const pos = graph.determinePos(viewpointRect);
				graph.addState(pos, transitionTo);
				states.push(transitionTo);
			}
			graph.addTransition(...Object.values(transition));
		});
		return graph;
	}
}

export { GraphicHelper, Graph };
