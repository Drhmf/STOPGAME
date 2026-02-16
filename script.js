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

// ========== SISTEMA DE ALMACENAMIENTO LOCAL ==========
class LocalStorage {
	static getProfile() {
		const stored = localStorage.getItem("playerProfile");
		return stored ? JSON.parse(stored) : this.getDefaultProfile();
	}

	static getDefaultProfile() {
		return {
			username: "",
			avatar: "👤",
			level: 1,
			experience: 0,
			totalGamesPlayed: 0,
			totalWins: 0,
			totalLoses: 0,
			achievements: []
		};
	}

	static saveProfile(profile) {
		localStorage.setItem("playerProfile", JSON.stringify(profile));
	}

	static getTheme() {
		return localStorage.getItem("theme") || "light";
	}

	static setTheme(theme) {
		localStorage.setItem("theme", theme);
	}

	static getDifficulty() {
		return localStorage.getItem("difficulty") || "normal";
	}

	static setDifficulty(difficulty) {
		localStorage.setItem("difficulty", difficulty);
	}

	static getGameMode() {
		return localStorage.getItem("gameMode") || "classic";
	}

	static setGameMode(mode) {
		localStorage.setItem("gameMode", mode);
	}

	static addAchievement(achievementId) {
		const profile = this.getProfile();
		if (!profile.achievements.includes(achievementId)) {
			profile.achievements.push(achievementId);
			this.saveProfile(profile);
		}
	}

	static hasAchievement(achievementId) {
		const profile = this.getProfile();
		return profile.achievements.includes(achievementId);
	}
}

// ========== SISTEMA DE LOGROS ==========
const ACHIEVEMENTS = {
	firstGame: {
		id: "firstGame",
		name: "Primera Partida",
		description: "Juega tu primer juego",
		icon: "🎮",
		check: (stats) => stats.totalGamesPlayed >= 1
	},
	firstWin: {
		id: "firstWin",
		name: "Primer Ganador",
		description: "Gana tu primera partida",
		icon: "🏆",
		check: (stats) => stats.totalWins >= 1
	},
	winStreak3: {
		id: "winStreak3",
		name: "Racha Triple",
		description: "Gana 3 partidas seguidas",
		icon: "🔥",
		check: (stats) => stats.winStreak >= 3
	},
	winStreak5: {
		id: "winStreak5",
		name: "Racha de Fuego",
		description: "Gana 5 partidas seguidas",
		icon: "🌟",
		check: (stats) => stats.winStreak >= 5
	},
	level10: {
		id: "level10",
		name: "Nivel 10",
		description: "Alcanza el nivel 10",
		icon: "⬆️",
		check: (stats) => stats.level >= 10
	},
	level25: {
		id: "level25",
		name: "Maestro",
		description: "Alcanza el nivel 25",
		icon: "👑",
		check: (stats) => stats.level >= 25
	},
	speedracer: {
		id: "speedracer",
		name: "Velocity",
		description: "Gana una partida en menos de 60 segundos",
		icon: "⚡",
		check: (stats) => stats.fastestVictory < 60000
	},
	tenGames: {
		id: "tenGames",
		name: "Rutina",
		description: "Juega 10 partidas",
		icon: "✅",
		check: (stats) => stats.totalGamesPlayed >= 10
	}
};

// ========== SISTEMA DE EXPERIENCIA Y NIVELES ==========
class LevelSystem {
	static BASE_XP = 100;
	static XP_MULTIPLIER = 1.1;

	static getXPRequired(level) {
		return Math.floor(this.BASE_XP * Math.pow(this.XP_MULTIPLIER, level - 1));
	}

	static addExperience(profile, amount) {
		profile.experience += amount;
		
		let levelUp = false;
		while (profile.experience >= this.getXPRequired(profile.level)) {
			profile.experience -= this.getXPRequired(profile.level);
			profile.level += 1;
			levelUp = true;
		}

		return levelUp;
	}

	static getProgressPercentage(profile) {
		const required = this.getXPRequired(profile.level);
		const progress = (profile.experience / required) * 100;
		return Math.min(progress, 100);
	}

	static getTitleForLevel(level) {
		if (level >= 50) return "Leyenda";
		if (level >= 40) return "Campeón";
		if (level >= 30) return "Maestro";
		if (level >= 20) return "Experto";
		if (level >= 10) return "Intermedio";
		if (level >= 5) return "Aprendiz";
		return "Novato";
	}
}

// ========== SISTEMA DE DIFICULTAD ==========
const DIFFICULTIES = {
	easy: {
		id: "easy",
		name: "Fácil",
		range: { min: 1, max: 50 },
		xpMultiplier: 0.5
	},
	normal: {
		id: "normal",
		name: "Normal",
		range: { min: 1, max: 100 },
		xpMultiplier: 1
	},
	hard: {
		id: "hard",
		name: "Difícil",
		range: { min: 1, max: 200 },
		xpMultiplier: 1.5
	},
	extreme: {
		id: "extreme",
		name: "Extremo",
		range: { min: 1, max: 500 },
		xpMultiplier: 2
	}
};

// ========== SISTEMA DE MODOS DE JUEGO ==========
const GAME_MODES = {
	classic: {
		id: "classic",
		name: "Clásico",
		description: "Encuentra números hasta llenar tu mano",
		icon: "📊"
	},
	infinite: {
		id: "infinite",
		name: "Infinito",
		description: "Sin límite de números, solo gana por tiempo (3 min)",
		icon: "♾️",
		timerMs: 180000
	},
	challenge: {
		id: "challenge",
		name: "Desafío",
		description: "Encuentra exactamente 50 números en el menor tiempo",
		icon: "⚡",
		targetCount: 50
	}
};

// ========== UTILIDADES ==========
class NotificationSystem {
	static notify(message, type = "info") {
		const notification = document.createElement("div");
		notification.className = `notification notification-${type}`;
		notification.textContent = message;
		document.body.appendChild(notification);

		setTimeout(() => {
			notification.classList.add("show");
		}, 10);

		setTimeout(() => {
			notification.classList.remove("show");
			setTimeout(() => notification.remove(), 300);
		}, 3000);
	}

	static playSound(type = "success") {
		try {
			const audioContext = new (window.AudioContext || window.webkitAudioContext)();
			const frequencies = {
				success: 620,
				error: 200,
				achievement: 800,
				levelup: 1000
			};
			const frequency = frequencies[type] || 400;
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();
			oscillator.type = "triangle";
			oscillator.frequency.value = frequency;
			gainNode.gain.value = 0.1;
			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);
			oscillator.start();
			oscillator.stop(audioContext.currentTime + 0.15);
		} catch (error) {
			// Audio opcional
		}
	}
}

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

	buildBoardNumbers(maxNumber = 100) {
		const numbers = Array.from({ length: maxNumber }, (_, index) => index + 1);
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

	reset(name, maxNumber = 100) {
		this.name = name;
		this.boardNumbers = this.buildBoardNumbers(maxNumber);
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
				const expirationTime = 24 * 60 * 60 * 1000;
				const updatedAt = data.updatedAt?.toMillis() || 0;
				const now = Date.now();
				if (now - updatedAt < expirationTime) {
					throw new Error("Ya existe una sala con ese código. Prueba otro.");
				}
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
			const expirationTime = 24 * 60 * 60 * 1000;
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
			gameStartTime: serverTimestamp(),
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
				const expirationTime = 24 * 60 * 60 * 1000;
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
		
		// Nuevos elementos para mejoras
		this.difficultyInputs = options.difficultyInputs || [];
		this.modeSelectInputs = options.modeSelectInputs || [];
		this.themeToggleBtn = options.themeToggleBtn;
		this.profileBtn = options.profileBtn;
		this.achievementsBtn = options.achievementsBtn;
		this.profileModal = options.profileModal;
		this.achievementsModal = options.achievementsModal;
		this.closeProfileBtn = options.closeProfileBtn;
		this.closeAchievementsBtn = options.closeAchievementsBtn;
		this.usernameInput = options.usernameInput;
		this.avatarInput = options.avatarInput;
		this.saveProfileBtn = options.saveProfileBtn;

		this.maxDots = 300;
		this.fillIntervalMs = 1000;
		this.state = this.getInitialState();
		this.fillTimer = null;
		this.roomClient = options.roomClient;
		this.roomCode = null;
		this.playerId = null;
		this.roomUnsubscribe = null;
		this.resetVersion = 0;
		this.gameStartTime = null;

		// Cargar preferencias
		this.currentDifficulty = LocalStorage.getDifficulty();
		this.currentGameMode = LocalStorage.getGameMode();
		this.profile = LocalStorage.getProfile();
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
		this.applyTheme();
		this.updateProfileUI();
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

		// Eventos de dificultad
		this.difficultyInputs?.forEach((input) => {
			input.addEventListener("change", (e) => {
				this.currentDifficulty = e.target.value;
				LocalStorage.setDifficulty(this.currentDifficulty);
			});
		});

		// Eventos de modo de juego
		this.modeSelectInputs?.forEach((input) => {
			input.addEventListener("change", (e) => {
				this.currentGameMode = e.target.value;
				LocalStorage.setGameMode(this.currentGameMode);
			});
		});

		// Eventos de tema
		this.themeToggleBtn?.addEventListener("click", () => {
			const current = LocalStorage.getTheme();
			const next = current === "light" ? "dark" : "light";
			LocalStorage.setTheme(next);
			this.applyTheme();
		});

		// Eventos de perfil
		this.profileBtn?.addEventListener("click", () => {
			this.profileModal?.classList.remove("hidden");
		});
		this.closeProfileBtn?.addEventListener("click", () => {
			this.profileModal?.classList.add("hidden");
		});
		this.saveProfileBtn?.addEventListener("click", () => {
			this.handleSaveProfile();
		});

		// Eventos de logros
		this.achievementsBtn?.addEventListener("click", () => {
			this.refreshAchievementsModal();
			this.achievementsModal?.classList.remove("hidden");
		});
		this.closeAchievementsBtn?.addEventListener("click", () => {
			this.achievementsModal?.classList.add("hidden");
		});
	}

	applyTheme() {
		const theme = LocalStorage.getTheme();
		document.documentElement.setAttribute("data-theme", theme);
		if (this.themeToggleBtn) {
			this.themeToggleBtn.textContent = theme === "light" ? "🌙" : "☀️";
		}
	}

	updateProfileUI() {
		const profile = LocalStorage.getProfile();
		const profileDisplay = document.getElementById("profile-display");
		if (profileDisplay) {
			profileDisplay.innerHTML = `
				<span class="avatar">${profile.avatar}</span>
				<div class="profile-info">
					<p class="username">${profile.username || "Sin nombre"}</p>
					<p class="level">Nivel ${profile.level}</p>
				</div>
			`;
		}
	}

	handleSaveProfile() {
		const username = this.usernameInput?.value.trim() || "";
		const avatar = this.avatarInput?.value.trim() || "👤";

		if (username.length === 0) {
			NotificationSystem.notify("El nombre de usuario no puede estar vacío", "error");
			return;
		}

		const profile = LocalStorage.getProfile();
		profile.username = username;
		profile.avatar = avatar;
		LocalStorage.saveProfile(profile);

		this.profile = profile;
		this.updateProfileUI();
		NotificationSystem.notify("Perfil guardado exitosamente", "success");
		this.profileModal?.classList.add("hidden");
	}

	refreshAchievementsModal() {
		const profile = LocalStorage.getProfile();
		const container = document.getElementById("achievements-grid");
		if (!container) return;

		container.innerHTML = "";
		Object.values(ACHIEVEMENTS).forEach((achievement) => {
			const hasIt = profile.achievements.includes(achievement.id);
			const div = document.createElement("div");
			div.className = `achievement ${hasIt ? "unlocked" : "locked"}`;
			div.title = achievement.description;
			div.innerHTML = `
				<div class="achievement-icon">${achievement.icon}</div>
				<p class="achievement-name">${achievement.name}</p>
				${hasIt ? '<p class="unlock-text">✓ Desbloqueado</p>' : ''}
			`;
			container.appendChild(div);
		});
	}

	getDifficultyConfig() {
		return DIFFICULTIES[this.currentDifficulty] || DIFFICULTIES.normal;
	}

	getGameModeConfig() {
		return GAME_MODES[this.currentGameMode] || GAME_MODES.classic;
	}

	async handleCreateRoom() {
		if (!this.ensureAuthReady()) {
			return;
		}
		
		const playerName = this.nameInput.value.trim();
		if (!playerName) {
			this.setStatus("⚠️ Debes ingresar tu nombre antes de crear una sala.");
			NotificationSystem.notify("Ingresa tu nombre primero", "error");
			this.nameInput.focus();
			return;
		}
		
		const code = this.normalizeRoomCode(this.roomCodeInput.value) || this.generateRoomCode();
		const difficulty = this.currentDifficulty;
		const gameMode = this.currentGameMode;
		const diffConfig = DIFFICULTIES[difficulty];

		this.players[0].reset(playerName, diffConfig.range.max);
		const payload = {
			status: "waiting",
			currentPlayerId: 1,
			targetNumber: null,
			targetOwnerId: null,
			winnerId: null,
			resetVersion: 0,
			difficulty,
			gameMode,
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
			NotificationSystem.notify(`Sala creada en modo ${diffConfig.name}`, "success");
		} catch (error) {
			this.setStatus(error.message || "No se pudo crear la sala.");
			NotificationSystem.notify(error.message, "error");
		}
	}

	async handleJoinRoom() {
		if (!this.ensureAuthReady()) {
			return;
		}
		
		const playerName = this.nameInput.value.trim();
		if (!playerName) {
			this.setStatus("⚠️ Debes ingresar tu nombre antes de unirte a una sala.");
			NotificationSystem.notify("Ingresa tu nombre primero", "error");
			this.nameInput.focus();
			return;
		}
		
		const code = this.normalizeRoomCode(this.roomCodeInput.value);
		if (!code) {
			this.setStatus("Ingresa un codigo de sala valido.");
			return;
		}
		this.players[1].reset(playerName, 100);
		try {
			await this.roomClient.joinRoom(code, this.serializePlayer(this.players[1]));
			this.connectToRoom(code, 2);
			this.setRoomStatus(`Conectado a sala: ${code}`);
			NotificationSystem.notify("Conectado a la sala", "success");
		} catch (error) {
			this.setStatus(error.message || "No se pudo unir a la sala.");
			NotificationSystem.notify(error.message, "error");
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
		this.gameStartTime = data.gameStartTime;
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
			this.handleGameEnd();
		}
	}

	handleGameEnd() {
		const winner = this.getPlayerById(this.state.winnerId);
		const isWinner = this.state.winnerId === this.playerId;

		this.victoryEl.textContent = `${winner.name} gana la partida.`;
		this.victoryEl.classList.remove("hidden");
		this.winnerMessage.textContent = `${winner.name} lleno su mano primero.`;
		this.winnerModal.classList.remove("hidden");

		// Actualizar estadísticas
		this.updateStats(isWinner);
		this.checkAchievements();
	}

	updateStats(isWinner) {
		const profile = LocalStorage.getProfile();
		profile.totalGamesPlayed += 1;
		
		if (isWinner) {
			profile.totalWins += 1;
			profile.winStreak = (profile.winStreak || 0) + 1;
			
			// Calcular experiencia basada en dificultad
			const diffConfig = this.getDifficultyConfig();
			const baseXP = 50;
			const xpGain = Math.floor(baseXP * diffConfig.xpMultiplier);
			
			const leveledUp = LevelSystem.addExperience(profile, xpGain);
			if (leveledUp) {
				NotificationSystem.playSound("levelup");
				NotificationSystem.notify(
					`¡Nivel ${profile.level} alcanzado! ${LevelSystem.getTitleForLevel(profile.level)}`,
					"success"
				);
			}
		} else {
			profile.totalLoses += 1;
			profile.winStreak = 0;
			
			// XP reducida por pérdida
			const xpGain = Math.floor(25);
			LevelSystem.addExperience(profile, xpGain);
		}

		LocalStorage.saveProfile(profile);
		this.profile = profile;
		this.updateProfileUI();
	}

	checkAchievements() {
		const profile = LocalStorage.getProfile();
		const stats = {
			totalGamesPlayed: profile.totalGamesPlayed,
			totalWins: profile.totalWins,
			level: profile.level,
			winStreak: profile.winStreak || 0,
			fastestVictory: profile.fastestVictory || Infinity
		};

		Object.values(ACHIEVEMENTS).forEach((achievement) => {
			if (!profile.achievements.includes(achievement.id) && achievement.check(stats)) {
				LocalStorage.addAchievement(achievement.id);
				NotificationSystem.playSound("achievement");
				NotificationSystem.notify(
					`¡Logro desbloqueado! ${achievement.name}`,
					"success"
				);
			}
		});
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
		const diffConfig = this.getDifficultyConfig();
		localPlayer.reset(localPlayer.name, diffConfig.range.max);
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
		const diffConfig = this.getDifficultyConfig();
		const maxNum = diffConfig.range.max;
		const value = Number(this.manualInput.value.trim());
		if (!Number.isInteger(value) || value < 1 || value > maxNum) {
			this.setStatus(`El numero manual debe estar entre 1 y ${maxNum}.`);
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
				NotificationSystem.playSound("success");
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
		if (player.boardEl.children.length === player.boardNumbers.length) {
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
		const diffConfig = this.getDifficultyConfig();
		const used = new Set(player.usedNumbers);
		const available = [];
		for (let i = diffConfig.range.min; i <= diffConfig.range.max; i += 1) {
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
	// Nuevos elementos
	difficultyInputs: document.querySelectorAll("input[name='difficulty']"),
	modeSelectInputs: document.querySelectorAll("input[name='game-mode']"),
	themeToggleBtn: document.getElementById("theme-toggle"),
	profileBtn: document.getElementById("profile-btn"),
	achievementsBtn: document.getElementById("achievements-btn"),
	profileModal: document.getElementById("profile-modal"),
	achievementsModal: document.getElementById("achievements-modal"),
	closeProfileBtn: document.getElementById("close-profile"),
	closeAchievementsBtn: document.getElementById("close-achievements"),
	usernameInput: document.getElementById("username-input"),
	avatarInput: document.getElementById("avatar-input"),
	saveProfileBtn: document.getElementById("save-profile"),
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
