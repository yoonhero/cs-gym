export let radius = 40;

let axisColor = '#e9e9e9';
let nodeBaColor = '#111';
let textColor = 'white';

class GraphicHelper {
	constructor(canvas, graph, width, height, tx = 0, ty = 0) {
		this.graph = graph;
		this.ctx = canvas.getContext('2d');
		const { top, left } = canvas.getBoundingClientRect();
		this.top = top;
		this.left = left;

		this.width = width;
		this.height = height;
		this.unit = 50;
		this.zoom = 1; // zoom level -> 50px = unit vec
		this.translation = { x: -tx, y: ty }; // 평행이동
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
		this.isDblClick = false;
		this.dblStartPos = {};
		this.dblStartID;
		this.dblCurPos = {};

		this.render();
	}

	updateBox(width, height) {
		this.width = width;
		this.height = height;
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
		this.boundingWidth = this.width / zoom;
		this.boundingHeight = this.height / zoom;
	}

	clear() {
		this.ctx.setTransform(this.zoom, 0, 0, this.zoom, 0, 0);
		const { x, y, xx, yy } = this.renderBoundingBox;
		this.ctx.clearRect(x - 50, y - 50, xx + 50, yy + 50);
	}

	renderTransitions() {}

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
			console.log(pos);
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
		this.renderStates();
		this.renderTransitions();
	}

	handleStart(e) {
		const pos = {
			x: e.clientX / this.zoom - this.translation.x,
			y: e.clientY / this.zoom - this.translation.y
		};

		const stateID = this.graph.check(pos);
		if (stateID) {
			this.isStateMove = true;
			this.focusedState = stateID;
		} else {
			this.isTranslation = true;
		}

		this.prevX = e.clientX;
		this.prevY = e.clientY;
	}

	handleMove(e) {
		const { clientX, clientY } = e;
		const dx = (clientX - this.prevX) / this.zoom,
			dy = (clientY - this.prevY) / this.zoom;

		if (this.isTranslation && this.translation) this.handleBoard(dx, dy);
		if (this.isStateMove) this.handleState(dx, dy);
		if (this.isDblClick) this.dblCurPos = this.getLocalPos({ x: clientX, y: clientY });

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
		this.isStateMove = false;
		this.isTranslation = false;
		if (this.isDblClick) this.createTransition();
		this.isDblClick = false;
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

		this.isDblClick = true;
		this.dblStartPos = pos;
		this.dblStartID = startStateID;
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

class Graph {
	constructor() {
		this._states = {};
		this.transitions = {};
	}

	states() {
		return this._states;
	}

	statePos(value) {
		return this._states[value].pos();
	}

	determinePos(viewpointRect) {
		const { x: sx, y: sy, xx, yy } = viewpointRect;
		while (true) {
			const newX = Math.random() * (xx - sx) + sx;
			const newY = Math.random() * (yy - sy) + sy;
			const pos = { x: newX, y: newY };
			const check = this.check(pos);
			if (check) {
				continue;
			}
			return pos;
		}
	}

	addState(pos) {
		const node = new StateNode(Object.keys(this._states).length, pos);
		this._states[node.value] = node;
	}

	updateState(value, dx, dy) {
		this._states[value].updateCoord(dx, dy);
	}

	addTransition(start, end) {}

	check(pos) {
		for (let i in this._states) {
			if (this._states[i].checkClick(pos)) return i;
		}
	}

	handleUpdate() {
		generateAlgorithm();
	}

	handleReset() {
		algorithm = '';
		updateTransitions(algorithm);
	}
}

export { GraphicHelper, Graph };
