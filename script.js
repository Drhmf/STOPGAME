import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
	arrayUnion,
	doc,
	getDoc,
	getFirestore,
	onSnapshot,
	runTransaction,
	serverTimestamp,
	setDoc,
	updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
	getAuth,
	onAuthStateChanged,
	signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const hasPlaceholderConfig = Object.values(firebaseConfig).some((value) =>
	String(value || "").startsWith("YOUR_")
);

class Player {
	constructor({ id, name, boardEl, historyEl, handEl, progressEl }) {
		this.id = id;
		this.name = name;
		this.boardEl = boardEl;
		this.historyEl = historyEl;
		this.handEl = handEl;
		this.progressEl = progressEl;
		this.boardNumbers = this.buildBoardNumbers();
		this.usedNumbers = [];
		this.foundNumbers = [];
		this.handProgress = 0;
	}

	buildBoardNumbers() {
		const numbers = Array.from({ length: 100 }, (_, index) => index + 1);
		for (let i = numbers.length - 1; i > 0; i -= 1) {
			const j = Math.floor(Math.random() * (i + 1));
			[numbers[i], numbers[j]] = [numbers[j], numbers[i]];
		}
		return numbers;
	}

	applyRemote(data) {
		if (!data) {
			return;
		}
		this.name = data.name;
		this.boardNumbers = data.boardNumbers || this.boardNumbers;
		this.usedNumbers = data.usedNumbers || [];
		this.foundNumbers = data.foundNumbers || [];
		this.handProgress = data.handProgress || 0;
	}

	reset(name) {
		this.name = name;
		this.boardNumbers = this.buildBoardNumbers();
		this.usedNumbers = [];
		this.foundNumbers = [];
		this.handProgress = 0;
	}
}

class RoomClient {
	constructor(database) {
		this.db = database;
	}

	roomRef(code) {
		return doc(this.db, "rooms", code);
	}

	async createRoom(code, payload) {
		const ref = this.roomRef(code);
		await runTransaction(this.db, async (transaction) => {
			const snapshot = await transaction.get(ref);
			if (snapshot.exists()) {
				const data = snapshot.data();
				// Verificar si la sala está expirada (24 horas)
				const expirationTime = 24 * 60 * 60 * 1000; // 24 horas en ms
				const updatedAt = data.updatedAt?.toMillis() || 0;
				const now = Date.now();
				if (now - updatedAt < expirationTime) {
					throw new Error("Ya existe una sala con ese código. Prueba otro.");
				}
				// Si está expirada, eliminar y crear nueva
				transaction.delete(ref);
			}
			transaction.set(ref, payload);
		});
		return ref;
	}

	async joinRoom(code, payload) {
		const ref = this.roomRef(code);
		await runTransaction(this.db, async (transaction) => {
			const snapshot = await transaction.get(ref);
			if (!snapshot.exists()) {
				throw new Error("La sala no existe.");
			}
			const data = snapshot.data();
			// Verificar si la sala está expirada (24 horas)
			const expirationTime = 24 * 60 * 60 * 1000; // 24 horas en ms
			const updatedAt = data.updatedAt?.toMillis() || 0;
			const now = Date.now();
			if (now - updatedAt >= expirationTime) {
				throw new Error("Esta sala ha expirado. El host debe crear una nueva.");
			}
			if (data.players && data.players["2"]) {
				throw new Error("La sala ya tiene dos jugadores.");
			}
			transaction.update(ref, {
				"players.2": payload,
				status: "waiting",
				updatedAt: serverTimestamp(),
				lastActivity: serverTimestamp()
			});
		});
		return ref;
	}

	listen(code, callback) {
		return onSnapshot(this.roomRef(code), (snapshot) => {
			if (snapshot.exists()) {
				callback(snapshot.data());
			}
		});
	}

	async startGame(code, resetVersion) {
		const ref = this.roomRef(code);
		await updateDoc(ref, {
			status: "playing",
			currentPlayerId: 1,
			targetNumber: null,
			targetOwnerId: null,
			winnerId: null,
			resetVersion,
			updatedAt: serverTimestamp(),
			lastActivity: serverTimestamp()
		});
	}

	async resetPlayer(code, playerId, payload) {
		const ref = this.roomRef(code);
		await updateDoc(ref, {
			[`players.${playerId}`]: payload,
			updatedAt: serverTimestamp(),
			lastActivity: serverTimestamp()
		});
	}

	async chooseNumber(code, playerId, number) {
		const ref = this.roomRef(code);
		await runTransaction(this.db, async (transaction) => {
			const snapshot = await transaction.get(ref);
			if (!snapshot.exists()) {
				throw new Error("Sala no encontrada.");
			}
			const data = snapshot.data();
			if (data.status !== "playing") {
				throw new Error("La partida aun no inicia.");
			}
			if (data.currentPlayerId !== playerId) {
				throw new Error("No es tu turno.");
			}
			if (data.targetNumber !== null) {
				throw new Error("Ya hay un numero activo.");
			}
			const player = data.players?.[String(playerId)];
			if (!player) {
				throw new Error("Jugador no encontrado.");
			}
			const used = player.usedNumbers || [];
			if (used.includes(number)) {
				throw new Error("Numero repetido.");
			}
			const nextUsed = [...used, number];
			transaction.update(ref, {
				[`players.${playerId}.usedNumbers`]: nextUsed,
				targetNumber: number,
				targetOwnerId: playerId,
				updatedAt: serverTimestamp(),
				lastActivity: serverTimestamp()
			});
		});
	}

	async confirmFound(code, finderId) {
		const ref = this.roomRef(code);
		await runTransaction(this.db, async (transaction) => {
			const snapshot = await transaction.get(ref);
			if (!snapshot.exists()) {
				throw new Error("Sala no encontrada.");
			}
			const data = snapshot.data();
			if (data.targetNumber === null) {
				throw new Error("No hay numero activo.");
			}
			if (data.targetOwnerId === finderId) {
				throw new Error("No puedes confirmar en tu propio turno.");
			}
			const player = data.players?.[String(finderId)];
			if (!player) {
				throw new Error("Jugador no encontrado.");
			}
			const found = player.foundNumbers || [];
			const target = data.targetNumber;
			const nextFound = found.includes(target) ? found : [...found, target];
			transaction.update(ref, {
				[`players.${finderId}.foundNumbers`]: nextFound,
				targetNumber: null,
				targetOwnerId: null,
				currentPlayerId: finderId,
				updatedAt: serverTimestamp(),
				lastActivity: serverTimestamp()
			});
		});
	}

	async incrementHand(code, playerId, maxDots) {
		const ref = this.roomRef(code);
		await runTransaction(this.db, async (transaction) => {
			const snapshot = await transaction.get(ref);
			if (!snapshot.exists()) {
				throw new Error("Sala no encontrada.");
			}
			const data = snapshot.data();
			if (data.status !== "playing") {
				return;
			}
			if (data.currentPlayerId !== playerId) {
				return;
			}
			if (data.targetNumber === null) {
				return;
			}
			const player = data.players?.[String(playerId)];
			if (!player) {
				return;
			}
			const nextProgress = Math.min((player.handProgress || 0) + 1, maxDots);
			const updates = {
				[`players.${playerId}.handProgress`]: nextProgress,
				updatedAt: serverTimestamp(),
				lastActivity: serverTimestamp()
			};
			if (nextProgress >= maxDots) {
				updates.status = "finished";
				updates.winnerId = playerId;
			}
			transaction.update(ref, updates);
		});
	}

	async deleteExpiredRoom(code) {
		const ref = this.roomRef(code);
		await runTransaction(this.db, async (transaction) => {
			const snapshot = await transaction.get(ref);
			if (snapshot.exists()) {
				const data = snapshot.data();
				const expirationTime = 24 * 60 * 60 * 1000; // 24 horas
				const updatedAt = data.updatedAt?.toMillis() || 0;
				const now = Date.now();
				if (now - updatedAt >= expirationTime) {
					transaction.delete(ref);
				}
			}
		});
	}
}

class Game {
	constructor(options) {
		this.turnEl = options.turnEl;
		this.targetEl = options.targetEl;
		this.statusEl = options.statusEl;
		this.startBtn = options.startBtn;
		this.rollBtn = options.rollBtn;
		this.manualBtn = options.manualBtn;
		this.manualInput = options.manualInput;
		this.modeInputs = options.modeInputs;
		this.victoryEl = options.victoryEl;
		this.winnerModal = options.winnerModal;
		this.winnerMessage = options.winnerMessage;
		this.playAgainBtn = options.playAgainBtn;
		this.nameInput = options.nameInput;
		this.nameLabels = options.nameLabels;
		this.players = options.players;
		this.roomCodeInput = options.roomCodeInput;
		this.createRoomBtn = options.createRoomBtn;
		this.joinRoomBtn = options.joinRoomBtn;
		this.roomStatusEl = options.roomStatusEl;
		this.playerRoleEl = options.playerRoleEl;
		this.boardTitles = options.boardTitles;
		this.historyTitles = options.historyTitles;

		this.maxDots = 300;
		this.fillIntervalMs = 1000;
		this.state = this.getInitialState();
		this.fillTimer = null;
		this.audioContext = null;
		this.roomClient = options.roomClient;
		this.roomCode = null;
		this.playerId = null;
		this.roomUnsubscribe = null;
		this.resetVersion = 0;
	}

	getInitialState() {
		return {
			running: false,
			currentPlayerId: 1,
			targetNumber: null,
			targetOwnerId: null,
			status: "idle",
			mode: "auto",
			winnerId: null
		};
	}

	init() {
		this.buildHands();
		this.bindEvents();
		this.updateUI();
		this.handleModeChange();
		if (hasPlaceholderConfig) {
			this.setStatus("Configura Firebase en script.js para habilitar salas.");
			this.setRoomStatus("Sin Firebase");
			this.createRoomBtn.disabled = true;
			this.joinRoomBtn.disabled = true;
			this.startBtn.disabled = true;
			return;
		}
		this.setStatus("Ingresa o crea una sala para comenzar.");
	}

	bindEvents() {
		this.createRoomBtn.addEventListener("click", () => this.handleCreateRoom());
		this.joinRoomBtn.addEventListener("click", () => this.handleJoinRoom());
		this.startBtn.addEventListener("click", () => this.handleStartGame());
		this.rollBtn.addEventListener("click", () => this.rollNumber());
		this.manualBtn.addEventListener("click", () => this.submitManualNumber());
		this.manualInput.addEventListener("keydown", (event) => {
			if (event.key === "Enter") {
				this.submitManualNumber();
			}
		});
		this.modeInputs.forEach((input) => {
			input.addEventListener("change", () => this.handleModeChange());
		});
		this.playAgainBtn.addEventListener("click", () => this.handleStartGame());
		this.players.forEach((player) => {
			player.boardEl.addEventListener("click", (event) => this.handleBoardClick(event, player));
		});
	}

	async handleCreateRoom() {
		if (!this.ensureAuthReady()) {
			return;
		}
		const code = this.normalizeRoomCode(this.roomCodeInput.value) || this.generateRoomCode();
		const playerName = this.nameInput.value.trim() || "Jugador 1";
		this.players[0].reset(playerName);
		const payload = {
			status: "waiting",
			currentPlayerId: 1,
			targetNumber: null,
			targetOwnerId: null,
			winnerId: null,
			resetVersion: 0,
			players: {
				1: this.serializePlayer(this.players[0])
			},
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		};
		try {
			await this.roomClient.createRoom(code, payload);
			this.connectToRoom(code, 1);
			this.setRoomStatus(`Sala creada: ${code}`);
		} catch (error) {
			this.setStatus(error.message || "No se pudo crear la sala.");
		}
	}

	async handleJoinRoom() {
		if (!this.ensureAuthReady()) {
			return;
		}
		const code = this.normalizeRoomCode(this.roomCodeInput.value);
		if (!code) {
			this.setStatus("Ingresa un codigo de sala valido.");
			return;
		}
		const playerName = this.nameInput.value.trim() || "Jugador 2";
		this.players[1].reset(playerName);
		try {
			await this.roomClient.joinRoom(code, this.serializePlayer(this.players[1]));
			this.connectToRoom(code, 2);
			this.setRoomStatus(`Conectado a sala: ${code}`);
		} catch (error) {
			this.setStatus(error.message || "No se pudo unir a la sala.");
		}
	}

	connectToRoom(code, playerId) {
		this.roomCode = code;
		this.playerId = playerId;
		this.playerRoleEl.textContent = `Jugador ${playerId}`;
		this.roomCodeInput.value = code;
		this.syncNameInput();
		this.createRoomBtn.disabled = true;
		this.joinRoomBtn.disabled = true;
		this.startBtn.disabled = playerId !== 1;
		this.listenToRoom();
		this.updateVisibleBoards();
	}

	listenToRoom() {
		if (this.roomUnsubscribe) {
			this.roomUnsubscribe();
		}
		this.roomUnsubscribe = this.roomClient.listen(this.roomCode, (data) => {
			this.applyRoomState(data);
		});
	}

	applyRoomState(data) {
		this.state.status = data.status || "idle";
		this.state.currentPlayerId = data.currentPlayerId || 1;
		this.state.targetNumber = data.targetNumber ?? null;
		this.state.targetOwnerId = data.targetOwnerId ?? null;
		this.state.winnerId = data.winnerId ?? null;
		this.resetVersion = data.resetVersion || 0;
		this.players[0].applyRemote(data.players?.["1"]);
		this.players[1].applyRemote(data.players?.["2"]);
		this.syncNameInput();
		this.renderBoard(this.getLocalPlayer());
		this.renderHistory(this.getLocalPlayer());
		this.updateBoardMarks(this.getLocalPlayer());
		this.updateHandProgress(this.players[0]);
		this.updateHandProgress(this.players[1]);
		this.updateUI();
		this.syncFillTimer();
		this.applyGameStatus();
		this.handleResetIfNeeded(data.resetVersion || 0);
	}

	applyGameStatus() {
		if (this.state.status === "waiting") {
			this.setStatus("Esperando al otro jugador...");
			return;
		}
		if (this.state.status === "playing" && this.state.targetNumber === null) {
			if (this.isMyTurn()) {
				this.setStatus("Tu turno: elige un numero.");
			} else {
				this.setStatus("Esperando el numero del rival...");
			}
		}
		if (this.state.status === "finished" && this.state.winnerId) {
			const winner = this.getPlayerById(this.state.winnerId);
			this.victoryEl.textContent = `${winner.name} gana la partida.`;
			this.victoryEl.classList.remove("hidden");
			this.winnerMessage.textContent = `${winner.name} lleno su mano primero.`;
			this.winnerModal.classList.remove("hidden");
		}
	}

	async handleStartGame() {
		if (!this.roomCode) {
			this.setStatus("Primero crea o unete a una sala.");
			return;
		}
		if (this.playerId !== 1) {
			this.setStatus("Solo el Jugador 1 puede iniciar la partida.");
			return;
		}
		if (!this.players[1].name) {
			this.setStatus("Necesitas que el segundo jugador se una.");
			return;
		}
		try {
			const nextReset = this.resetVersion + 1;
			await this.roomClient.startGame(this.roomCode, nextReset);
			this.victoryEl.classList.add("hidden");
			this.winnerModal.classList.add("hidden");
			this.setStatus("Partida reiniciada.");
		} catch (error) {
			this.setStatus(error.message || "No se pudo iniciar la partida.");
		}
	}

	async handleResetIfNeeded(remoteVersion) {
		if (!this.roomCode || !this.playerId) {
			return;
		}
		if (remoteVersion === 0 || remoteVersion === this.state.lastResetVersion) {
			return;
		}
		this.state.lastResetVersion = remoteVersion;
		const localPlayer = this.getLocalPlayer();
		localPlayer.reset(localPlayer.name);
		await this.roomClient.resetPlayer(this.roomCode, this.playerId, this.serializePlayer(localPlayer));
	}

	async rollNumber() {
		if (!this.canChooseNumber()) {
			return;
		}
		const player = this.getLocalPlayer();
		const available = this.getAvailableNumbers(player);
		if (available.length === 0) {
			this.setStatus("No quedan numeros disponibles.");
			return;
		}
		const target = available[Math.floor(Math.random() * available.length)];
		await this.chooseNumber(target);
	}

	async submitManualNumber() {
		if (!this.canChooseNumber()) {
			return;
		}
		const value = Number(this.manualInput.value.trim());
		if (!Number.isInteger(value) || value < 1 || value > 100) {
			this.setStatus("El numero manual debe estar entre 1 y 100.");
			return;
		}
		const player = this.getLocalPlayer();
		if (player.usedNumbers.includes(value)) {
			this.setStatus("Ese numero ya fue usado por este jugador.");
			return;
		}
		await this.chooseNumber(value);
	}

	async chooseNumber(target) {
		try {
			await this.roomClient.chooseNumber(this.roomCode, this.playerId, target);
			this.manualInput.value = "";
		} catch (error) {
			this.setStatus(error.message || "No se pudo seleccionar el numero.");
		}
	}

	canChooseNumber() {
		if (!this.state.running) {
			return false;
		}
		if (this.state.targetNumber !== null) {
			return false;
		}
		if (!this.isMyTurn()) {
			return false;
		}
		return true;
	}

	handleModeChange() {
		const selected = Array.from(this.modeInputs).find((input) => input.checked);
		this.state.mode = selected ? selected.value : "auto";
		const manualEnabled = this.state.mode === "manual";
		this.manualInput.disabled = !manualEnabled || !this.state.running;
		this.setNumberControlsDisabled(this.state.targetNumber !== null || !this.state.running);
		if (this.state.running && this.state.targetNumber === null && this.isMyTurn()) {
			this.rollBtn.disabled = manualEnabled;
			this.manualBtn.disabled = !manualEnabled;
		}
	}

	setNumberControlsDisabled(disabled) {
		this.rollBtn.disabled = disabled || this.state.mode === "manual" || !this.isMyTurn();
		this.manualBtn.disabled = disabled || this.state.mode !== "manual" || !this.isMyTurn();
	}

	async handleBoardClick(event, boardOwner) {
		if (!this.state.running || this.state.targetNumber === null) {
			return;
		}
		if (boardOwner.id !== this.playerId) {
			return;
		}
		if (this.state.targetOwnerId === this.playerId) {
			return;
		}
		const button = event.target.closest("button.number-tile");
		if (!button || button.classList.contains("found")) {
			return;
		}
		const selected = Number(button.dataset.number);
		if (selected === this.state.targetNumber) {
			try {
				await this.roomClient.confirmFound(this.roomCode, this.playerId);
				this.playSuccessSound();
			} catch (error) {
				this.setStatus(error.message || "No se pudo confirmar.");
			}
		} else {
			button.classList.remove("wrong");
			void button.offsetWidth;
			button.classList.add("wrong");
		}
	}

	syncFillTimer() {
		const shouldFill = this.state.running &&
			this.state.targetNumber !== null &&
			this.state.currentPlayerId === this.playerId;
		if (shouldFill) {
			this.startFilling();
		} else {
			this.stopFilling();
		}
	}

	startFilling() {
		this.stopFilling();
		this.fillTimer = setInterval(() => {
			this.roomClient.incrementHand(this.roomCode, this.playerId, this.maxDots);
		}, this.fillIntervalMs);
	}

	stopFilling() {
		if (this.fillTimer) {
			clearInterval(this.fillTimer);
			this.fillTimer = null;
		}
	}

	buildHands() {
		this.players.forEach((player) => {
			player.handEl.innerHTML = "";
			for (let i = 0; i < this.maxDots; i += 1) {
				const dot = document.createElement("span");
				player.handEl.appendChild(dot);
			}
		});
	}

	renderBoard(player) {
		if (!player.boardNumbers || player.boardNumbers.length === 0) {
			return;
		}
		if (player.boardEl.children.length === 100) {
			return;
		}
		player.boardEl.innerHTML = "";
		player.boardNumbers.forEach((number) => {
			const button = document.createElement("button");
			button.className = "number-tile";
			button.type = "button";
			button.textContent = number;
			button.dataset.number = String(number);
			player.boardEl.appendChild(button);
		});
	}

	renderHistory(player) {
		player.historyEl.innerHTML = "";
		player.usedNumbers.forEach((number) => {
			const chip = document.createElement("span");
			chip.className = "history-chip";
			chip.textContent = number;
			player.historyEl.appendChild(chip);
		});
	}

	updateBoardMarks(player) {
		const foundSet = new Set(player.foundNumbers);
		Array.from(player.boardEl.children).forEach((tile) => {
			const value = Number(tile.dataset.number);
			tile.classList.toggle("found", foundSet.has(value));
		});
	}

	updateHandProgress(player) {
		const dots = Array.from(player.handEl.children);
		dots.forEach((dot, index) => {
			dot.classList.toggle("filled", index < player.handProgress);
		});
		player.progressEl.textContent = `${player.handProgress} / ${this.maxDots}`;
	}

	updateUI() {
		this.turnEl.textContent = this.getPlayerById(this.state.currentPlayerId)?.name || "--";
		document.querySelectorAll(".player-card").forEach((card) => {
			const player = Number(card.dataset.player);
			card.classList.toggle("active", player === this.state.currentPlayerId);
		});
		this.nameLabels[1].textContent = this.players[0].name || "Jugador 1";
		this.nameLabels[2].textContent = this.players[1].name || "Jugador 2";
		this.targetEl.textContent = this.state.targetNumber === null ? "--" : String(this.state.targetNumber);
		this.startBtn.disabled = this.playerId !== 1 || this.state.status === "playing";
		this.state.running = this.state.status === "playing";
		this.handleModeChange();
	}

	syncNameInput() {
		if (!this.playerId) {
			return;
		}
		const localPlayer = this.getLocalPlayer();
		this.nameInput.value = localPlayer.name || "";
		this.nameInput.disabled = true;
	}

	setStatus(message) {
		this.statusEl.textContent = message;
	}

	setRoomStatus(message) {
		this.roomStatusEl.textContent = message;
	}

	getAvailableNumbers(player) {
		const used = new Set(player.usedNumbers);
		const available = [];
		for (let i = 1; i <= 100; i += 1) {
			if (!used.has(i)) {
				available.push(i);
			}
		}
		return available;
	}

	getLocalPlayer() {
		return this.getPlayerById(this.playerId) || this.players[0];
	}

	getPlayerById(id) {
		return this.players.find((player) => player.id === id);
	}

	isMyTurn() {
		return this.state.currentPlayerId === this.playerId;
	}

	serializePlayer(player) {
		return {
			name: player.name,
			boardNumbers: player.boardNumbers,
			usedNumbers: player.usedNumbers,
			foundNumbers: player.foundNumbers,
			handProgress: player.handProgress
		};
	}

	updateVisibleBoards() {
		const localId = this.playerId || 1;
		const otherId = localId === 1 ? 2 : 1;
		const localBoard = document.querySelector(`.board-section[data-player='${localId}']`);
		const otherBoard = document.querySelector(`.board-section[data-player='${otherId}']`);
		if (localBoard) {
			localBoard.classList.remove("hidden");
		}
		if (otherBoard) {
			otherBoard.classList.add("hidden");
		}
		if (this.boardTitles[localId]) {
			this.boardTitles[localId].textContent = "Tu tablero";
		}
		if (this.historyTitles[localId]) {
			this.historyTitles[localId].textContent = "Tu historial";
		}
	}

	generateRoomCode() {
		const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
		let code = "";
		for (let i = 0; i < 4; i += 1) {
			code += charset[Math.floor(Math.random() * charset.length)];
		}
		return code;
	}

	normalizeRoomCode(value) {
		return value.trim().toUpperCase();
	}

	ensureAuthReady() {
		if (hasPlaceholderConfig) {
			this.setStatus("Completa la configuracion de Firebase primero.");
			return false;
		}
		if (!auth.currentUser) {
			this.setStatus("Autenticando, intenta de nuevo en un segundo.");
			return false;
		}
		return true;
	}

	playSuccessSound() {
		try {
			if (!this.audioContext) {
				this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
			}
			const oscillator = this.audioContext.createOscillator();
			const gainNode = this.audioContext.createGain();
			oscillator.type = "triangle";
			oscillator.frequency.value = 620;
			gainNode.gain.value = 0.12;
			oscillator.connect(gainNode);
			gainNode.connect(this.audioContext.destination);
			oscillator.start();
			oscillator.stop(this.audioContext.currentTime + 0.15);
		} catch (error) {
			// Audio optional; ignore if browser blocks it.
		}
	}
}

const game = new Game({
	turnEl: document.getElementById("turn-indicator"),
	targetEl: document.getElementById("target-number"),
	statusEl: document.getElementById("status-text"),
	startBtn: document.getElementById("start-btn"),
	rollBtn: document.getElementById("roll-btn"),
	manualBtn: document.getElementById("manual-btn"),
	manualInput: document.getElementById("manual-number"),
	modeInputs: document.querySelectorAll("input[name='mode']"),
	victoryEl: document.getElementById("victory"),
	winnerModal: document.getElementById("winner-modal"),
	winnerMessage: document.getElementById("winner-message"),
	playAgainBtn: document.getElementById("play-again"),
	nameInput: document.getElementById("player-name"),
	nameLabels: {
		1: document.getElementById("player1-label"),
		2: document.getElementById("player2-label")
	},
	players: [
		new Player({
			id: 1,
			name: "Jugador 1",
			boardEl: document.getElementById("board-1"),
			historyEl: document.getElementById("history-1"),
			handEl: document.querySelector(".hand-dots[data-player='1']"),
			progressEl: document.getElementById("hand-progress-1")
		}),
		new Player({
			id: 2,
			name: "Jugador 2",
			boardEl: document.getElementById("board-2"),
			historyEl: document.getElementById("history-2"),
			handEl: document.querySelector(".hand-dots[data-player='2']"),
			progressEl: document.getElementById("hand-progress-2")
		})
	],
	roomCodeInput: document.getElementById("room-code"),
	createRoomBtn: document.getElementById("create-room-btn"),
	joinRoomBtn: document.getElementById("join-room-btn"),
	roomStatusEl: document.getElementById("room-status"),
	playerRoleEl: document.getElementById("player-role"),
	boardTitles: {
		1: document.getElementById("board-title-1"),
		2: document.getElementById("board-title-2")
	},
	historyTitles: {
		1: document.getElementById("history-title-1"),
		2: document.getElementById("history-title-2")
	},
	roomClient: new RoomClient(db)
});

game.init();

if (!hasPlaceholderConfig) {
	onAuthStateChanged(auth, (user) => {
		if (!user) {
			signInAnonymously(auth).catch(() => {
				game.setStatus("No se pudo autenticar con Firebase.");
			});
		}
	});
}
