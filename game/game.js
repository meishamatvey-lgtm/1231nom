// Game State
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    SETTINGS: 'settings'
};

// Game Configuration
const config = {
    musicVolume: 70,
    sfxVolume: 80,
    graphicsQuality: 'medium',
    controls: 'keyboard'
};

// Game Variables
let currentState = GameState.MENU;
let coinCount = 0;
let canvas, ctx;
let player;
let coins = [];
let buildings = [];
let camera = { x: 0, y: 0, z: 0 };
let joystickData = { active: false, dx: 0, dy: 0 };
let keys = {};

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Setup event listeners
    setupMenuListeners();
    setupGameListeners();
    setupMobileControls();
    
    // Start the game loop
    gameLoop();
}

// Resize canvas to fit screen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Menu Event Listeners
function setupMenuListeners() {
    document.getElementById('playBtn').addEventListener('click', startGame);
    document.getElementById('settingsBtn').addEventListener('click', showSettings);
    document.getElementById('backBtn').addEventListener('click', hideSettings);
    document.getElementById('resumeBtn').addEventListener('click', resumeGame);
    document.getElementById('quitBtn').addEventListener('click', quitToMenu);
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
    
    // Settings sliders
    document.getElementById('musicVolume').addEventListener('input', (e) => {
        config.musicVolume = e.target.value;
    });
    
    document.getElementById('sfxVolume').addEventListener('input', (e) => {
        config.sfxVolume = e.target.value;
    });
    
    document.getElementById('graphicsQuality').addEventListener('change', (e) => {
        config.graphicsQuality = e.target.value;
    });
    
    document.getElementById('controls').addEventListener('change', (e) => {
        config.controls = e.target.value;
        updateControlsVisibility();
    });
}

// Game Event Listeners
function setupGameListeners() {
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        
        if (e.code === 'Escape' && currentState === GameState.PLAYING) {
            pauseGame();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
}

// Mobile Controls
function setupMobileControls() {
    const joystickBase = document.getElementById('joystickBase');
    const joystickKnob = document.getElementById('joystickKnob');
    const jumpBtn = document.getElementById('jumpBtn');
    
    // Joystick touch events
    joystickBase.addEventListener('touchstart', (e) => {
        e.preventDefault();
        joystickData.active = true;
        updateJoystick(e.touches[0], joystickBase, joystickKnob);
    });
    
    joystickBase.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (joystickData.active) {
            updateJoystick(e.touches[0], joystickBase, joystickKnob);
        }
    });
    
    joystickBase.addEventListener('touchend', (e) => {
        e.preventDefault();
        joystickData.active = false;
        joystickData.dx = 0;
        joystickData.dy = 0;
        joystickKnob.style.transform = `translate(-50%, -50%)`;
    });
    
    // Jump button
    jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (player && currentState === GameState.PLAYING) {
            player.jump();
        }
    });
}

function updateJoystick(touch, base, knob) {
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = rect.width / 2 - 25;
    
    if (distance > maxDistance) {
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
    }
    
    joystickData.dx = dx / maxDistance;
    joystickData.dy = dy / maxDistance;
    
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

function updateControlsVisibility() {
    const mobileControls = document.getElementById('mobileControls');
    if (config.controls === 'touch') {
        mobileControls.classList.remove('hidden');
    } else {
        mobileControls.classList.add('hidden');
    }
}

// Menu Functions
function showSettings() {
    currentState = GameState.SETTINGS;
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('settingsMenu').classList.remove('hidden');
}

function hideSettings() {
    currentState = GameState.MENU;
    document.getElementById('settingsMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
}

function startGame() {
    currentState = GameState.PLAYING;
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('gameContainer').classList.remove('hidden');
    
    // Initialize game world
    initWorld();
    
    updateControlsVisibility();
}

function pauseGame() {
    currentState = GameState.PAUSED;
    document.getElementById('pauseMenu').classList.remove('hidden');
}

function resumeGame() {
    currentState = GameState.PLAYING;
    document.getElementById('pauseMenu').classList.add('hidden');
}

function quitToMenu() {
    currentState = GameState.MENU;
    document.getElementById('pauseMenu').classList.add('hidden');
    document.getElementById('gameContainer').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
    
    // Reset game
    coinCount = 0;
    updateCoinDisplay();
}

// World Initialization
function initWorld() {
    // Create player
    player = {
        x: 0,
        y: 1.7,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        speed: 0.15,
        jumpForce: 0.3,
        onGround: true,
        width: 0.5,
        height: 1.7,
        depth: 0.5,
        
        jump: function() {
            if (this.onGround) {
                this.vy = this.jumpForce;
                this.onGround = false;
            }
        },
        
        update: function() {
            // Handle input
            if (config.controls === 'keyboard') {
                if (keys['KeyW'] || keys['ArrowUp']) this.vz = -this.speed;
                else if (keys['KeyS'] || keys['ArrowDown']) this.vz = this.speed;
                else this.vz = 0;
                
                if (keys['KeyA'] || keys['ArrowLeft']) this.vx = -this.speed;
                else if (keys['KeyD'] || keys['ArrowRight']) this.vx = this.speed;
                else this.vx = 0;
                
                if (keys['Space']) this.jump();
            } else {
                // Mobile controls
                this.vx = joystickData.dx * this.speed;
                this.vz = joystickData.dy * this.speed;
            }
            
            // Apply velocity
            this.x += this.vx;
            this.z += this.vz;
            
            // Gravity
            this.vy -= 0.015;
            this.y += this.vy;
            
            // Ground collision
            if (this.y < 1.7) {
                this.y = 1.7;
                this.vy = 0;
                this.onGround = true;
            }
            
            // Update camera
            camera.x = this.x;
            camera.z = this.z;
        }
    };
    
    // Generate city buildings
    generateCity();
    
    // Generate coins
    generateCoins();
}

function generateCity() {
    buildings = [];
    const blockSize = 20;
    const streetWidth = 8;
    
    for (let bx = -3; bx <= 3; bx++) {
        for (let bz = -3; bz <= 3; bz++) {
            if (bx === 0 && bz === 0) continue; // Skip center area
            
            const building = {
                x: bx * (blockSize + streetWidth),
                z: bz * (blockSize + streetWidth),
                width: blockSize - 2,
                depth: blockSize - 2,
                height: 5 + Math.random() * 15,
                color: `hsl(${Math.random() * 60 + 200}, 50%, ${40 + Math.random() * 20}%)`
            };
            buildings.push(building);
        }
    }
}

function generateCoins() {
    coins = [];
    for (let i = 0; i < 50; i++) {
        const coin = {
            x: (Math.random() - 0.5) * 200,
            y: 1 + Math.random() * 3,
            z: (Math.random() - 0.5) * 200,
            collected: false,
            rotation: Math.random() * Math.PI * 2
        };
        coins.push(coin);
    }
}

// Update coin display
function updateCoinDisplay() {
    document.getElementById('coinCount').textContent = coinCount;
}

// Check coin collection
function checkCoinCollection() {
    coins.forEach(coin => {
        if (coin.collected) return;
        
        const dx = coin.x - player.x;
        const dy = coin.y - player.y;
        const dz = coin.z - player.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < 1.5) {
            coin.collected = true;
            coinCount++;
            updateCoinDisplay();
        }
    });
}

// 3D Projection
function project(x, y, z) {
    const fov = 500;
    const scale = fov / (fov + z - camera.z + 10);
    
    const screenX = canvas.width / 2 + (x - camera.x) * scale;
    const screenY = canvas.height / 2 - (y - 1.7) * scale;
    
    return { x: screenX, y: screenY, scale: scale };
}

// Render Functions
function render() {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#1e3c72');
    skyGradient.addColorStop(0.5, '#667eea');
    skyGradient.addColorStop(1, '#87CEEB');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    ctx.fillStyle = '#4a7c59';
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
    
    // Sort objects by depth
    const renderList = [];
    
    // Add buildings to render list
    buildings.forEach(building => {
        const relZ = building.z - camera.z;
        if (relZ > -10) {
            renderList.push({ type: 'building', obj: building, z: relZ });
        }
    });
    
    // Add coins to render list
    coins.forEach(coin => {
        if (!coin.collected) {
            const relZ = coin.z - camera.z;
            if (relZ > -10) {
                renderList.push({ type: 'coin', obj: coin, z: relZ });
            }
        }
    });
    
    // Add player to render list
    renderList.push({ type: 'player', obj: player, z: 0 });
    
    // Sort by Z (far to near)
    renderList.sort((a, b) => b.z - a.z);
    
    // Render all objects
    renderList.forEach(item => {
        if (item.type === 'building') {
            renderBuilding(item.obj);
        } else if (item.type === 'coin') {
            renderCoin(item.obj);
        } else if (item.type === 'player') {
            renderPlayer(item.obj);
        }
    });
}

function renderBuilding(building) {
    const proj = project(building.x, 0, building.z);
    const w = building.width * proj.scale;
    const h = building.height * proj.scale;
    const d = building.depth * proj.scale;
    
    // Building front face
    ctx.fillStyle = building.color;
    ctx.fillRect(proj.x - w / 2, proj.y - h, w, h);
    
    // Building top face
    ctx.fillStyle = adjustColor(building.color, 30);
    ctx.beginPath();
    ctx.moveTo(proj.x - w / 2, proj.y - h);
    ctx.lineTo(proj.x - w / 2 + d * 0.3, proj.y - h - d * 0.3);
    ctx.lineTo(proj.x + w / 2 + d * 0.3, proj.y - h - d * 0.3);
    ctx.lineTo(proj.x + w / 2, proj.y - h);
    ctx.closePath();
    ctx.fill();
    
    // Windows
    ctx.fillStyle = '#FFE4B5';
    const windowRows = Math.floor(h / 15);
    const windowCols = Math.floor(w / 12);
    
    for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
            if (Math.random() > 0.3) {
                const wx = proj.x - w / 2 + 4 + col * 12;
                const wy = proj.y - h + 5 + row * 15;
                const ws = 6 * proj.scale;
                ctx.fillRect(wx, wy, ws, ws);
            }
        }
    }
}

function renderCoin(coin) {
    coin.rotation += 0.05;
    
    const proj = project(coin.x, coin.y, coin.z);
    const size = 0.4 * proj.scale;
    
    // Coin glow
    const gradient = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, size * 2);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, size * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Coin body
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.ellipse(proj.x, proj.y, size * Math.abs(Math.cos(coin.rotation)), size, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Coin shine
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.ellipse(proj.x - size * 0.2, proj.y - size * 0.2, size * 0.3 * Math.abs(Math.cos(coin.rotation)), size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
}

function renderPlayer(player) {
    const proj = project(player.x, player.y, player.z);
    const w = player.width * proj.scale;
    const h = player.height * proj.scale;
    
    // Player body
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(proj.x - w / 2, proj.y - h, w, h);
    
    // Player head
    const headSize = w * 0.6;
    ctx.fillStyle = '#FFE4C4';
    ctx.beginPath();
    ctx.arc(proj.x, proj.y - h - headSize / 2, headSize / 2, 0, Math.PI * 2);
    ctx.fill();
}

function adjustColor(color, amount) {
    // Simple color adjustment for demo
    return color;
}

// Game Loop
function gameLoop() {
    if (currentState === GameState.PLAYING) {
        // Update
        player.update();
        checkCoinCollection();
        
        // Render
        render();
    }
    
    requestAnimationFrame(gameLoop);
}

// Start the game when page loads
window.addEventListener('load', init);
