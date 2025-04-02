// script.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import gsap from 'gsap';

// --- Helper: Shuffle Array ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- List of your image filenames ---
// ***** Make sure these match files in your 'images' folder *****
const availableImageFiles = [
    "038413c2-1de3-4eb0-9adb-03c45bedadb8.jpg",
    "0e1f3879-1b96-4112-8df4-69e2c14cfd1d.jpg",
    "0e751c5e-ea7b-452f-acaa-136225c16a7b.jpg",
    "0eefd4a6-adb5-41f9-b975-735e5ebc9ee7.jpg",
    "1000aa90-7e1c-4668-ba57-f14929117ff2.jpg",
    "252b58cc-7233-48c1-916f-cffe37e15274.jpg",
    // You can add more from your list if needed, or use different ones
    "2dcbafe0-00b0-4752-b30f-0b8c904f6965.jpg",
    "31e3f51a-e4df-4c87-a9f5-94f759757b6e.jpg",
    "477683d4-41f7-44c8-868c-f6abc2e47bd8.jpg",
    "4be2040d-8643-4549-bf3f-97e797222545.jpg",
    "525c02fd-5cfa-4885-9abf-96927a1d920b.jpg",
    "52b6ed95-7856-4954-b4b7-461668b8aa19.jpg",
    "55d6ca7f-2ada-4679-906e-046737b18c7f.jpg",
    "56452cb7-d4d6-4387-a8fc-bfd32684546e.jpg",
    "5d421d5f-931c-4b36-87c7-03d844288a9e.jpg",
    // ... Add others from your list if you want more variety ...
];
// --- End of filename list ---


// --- Basic Setup ---
const canvas = document.getElementById('webgl-canvas'); if (!canvas) console.error("Canvas element #webgl-canvas not found!");
const scene = new THREE.Scene(); scene.background = new THREE.Color('#111111'); const sizes = { width: window.innerWidth, height: window.innerHeight }; const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100); camera.position.set(0, 1.5, 9); scene.add(camera);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); /* ... */ renderer.useLegacyLights = false; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputEncoding = THREE.sRGBEncoding; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.setSize(sizes.width, sizes.height); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- Lighting ---
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8); scene.add(hemisphereLight); const keyLight = new THREE.DirectionalLight(0xffffff, 1.5); keyLight.position.set(3, 4, 3); keyLight.castShadow = true; /* ... */ keyLight.shadow.mapSize.width = 1024; keyLight.shadow.mapSize.height = 1024; keyLight.shadow.camera.near = 0.5; keyLight.shadow.camera.far = 20; keyLight.shadow.bias = -0.002; scene.add(keyLight);

// --- Post-Processing ---
let composer;
function setupPostProcessing() {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.4, 0.8);
    composer.addPass(bloomPass);
    composer.setSize(sizes.width, sizes.height);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
setupPostProcessing();

// --- Card Settings ---
const numberOfCards = 6; const cardWidth = 1.5; const imageAspectRatio = 1.4; const cardHeight = cardWidth * imageAspectRatio; const cardThickness = 0.05; const cardGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardThickness); const cards = [];

// --- Card Edge Material ---
const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xB08D57, roughness: 0.4, metalness: 0.7 });

// --- Function to Generate Card Back Texture (Grey Rose) ---
function createGeneratedCardBackTexture() {
    const canvasWidth = 256; const canvasHeight = Math.floor(canvasWidth * imageAspectRatio); const canvas = document.createElement('canvas'); canvas.width = canvasWidth; canvas.height = canvasHeight; const ctx = canvas.getContext('2d');
    // Background Color (Grey Rose)
    ctx.fillStyle = '#1A1A1A'; // Greyish Rose (Or try #C08081 for more pink)
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    // Border
    const borderThickness = canvasWidth * 0.05; ctx.strokeStyle = '#B08D57'; ctx.lineWidth = borderThickness; ctx.strokeRect(borderThickness / 2, borderThickness / 2, canvasWidth - borderThickness, canvasHeight - borderThickness); const texture = new THREE.CanvasTexture(canvas); texture.needsUpdate = true; return texture;
}

// --- Static Initial Layout Settings ---
const initialLayoutRadius = 4.0; // How far cards are from the center
const initialLayoutAngle = Math.PI / 1.8; // Total angle spread (~100 degrees)
const initialYPosition = 0; // Vertical position

// --- Texture Loading & Card Creation ---
const textureLoader = new THREE.TextureLoader(); const cardBackTexture = createGeneratedCardBackTexture();

// --- Select Unique Images ---
// 1. Get unique filenames
const uniqueImageFiles = [...new Set(availableImageFiles)];
// 2. Check if enough unique files exist
if (uniqueImageFiles.length < numberOfCards) {
    console.error(`Error: Need at least ${numberOfCards} unique images listed in availableImageFiles, found only ${uniqueImageFiles.length}.`);
    document.body.innerHTML = `<h1 style="color: red;">Error: Not enough unique images listed in script.js...</h1>`;
    throw new Error(`Insufficient unique images listed.`);
}
// 3. Shuffle the unique list
const shuffledUniqueFiles = shuffleArray(uniqueImageFiles);
// 4. Select the required number
const selectedImageFiles = shuffledUniqueFiles.slice(0, numberOfCards);
console.log("Selected unique images:", selectedImageFiles);

// --- Create Cards ---
// Check if selection was successful (should always be if check above passed)
if (selectedImageFiles.length === numberOfCards) {
    selectedImageFiles.forEach((filename, i) => {
        const imagePath = `images/${filename}`;
        console.log(`Attempting to load front texture: ${imagePath}`);
        const frontTexture = textureLoader.load(imagePath, undefined, undefined, (error) => console.error(`Error loading front texture: '${imagePath}'`, error));

        // ***** FRONT BORDER NOTE *****
        // To add a border to the front, you should ideally edit
        // the image files themselves (e.g., filename) in an image editor
        // to include the border directly on the picture.

        const backMaterial = new THREE.MeshStandardMaterial({ map: cardBackTexture, roughness: 0.7, metalness: 0.1 });
        const frontMaterial = new THREE.MeshStandardMaterial({ map: frontTexture, roughness: 0.85, metalness: 0.05 });
        const materials = [edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial, frontMaterial, backMaterial];
        const cardMesh = new THREE.Mesh(cardGeometry, materials);
        cardMesh.castShadow = true; cardMesh.receiveShadow = true;

        // Static Initial Position & Rotation (Wide Fan, Backs Showing)
        const fraction = numberOfCards <= 1 ? 0.5 : i / (numberOfCards - 1);
        const currentAngle = (fraction - 0.5) * initialLayoutAngle;
        const xPos = initialLayoutRadius * Math.sin(currentAngle);
        const zPos = initialLayoutRadius * Math.cos(currentAngle) - initialLayoutRadius;
        cardMesh.position.set(xPos, initialYPosition, zPos);
        cardMesh.rotation.x = 0;
        cardMesh.rotation.y = -currentAngle + Math.PI; // Face BACK towards center
        cardMesh.rotation.z = 0;

        // Set initial state to isFlipped = true (back showing)
        cardMesh.userData = { id: i, filename: filename, isFlipped: true, isAnimating: false };
        scene.add(cardMesh); cards.push(cardMesh);
    });
}

// --- Ground Plane ---
const groundGeometry = new THREE.PlaneGeometry(30, 30); const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9, metalness: 0.1 }); const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial); groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = initialYPosition - cardHeight / 2 - 0.1; // Position relative to initial Y
groundMesh.receiveShadow = true; scene.add(groundMesh);

// --- Raycasting & Interaction ---
const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2(); let currentlyHovered = null;
let isGamePlayable = false; let isGameActive = false; // isGameActive flags the transition animation
function updateMouseCoords(event) { mouse.x = (event.clientX / sizes.width) * 2 - 1; mouse.y = - (event.clientY / sizes.height) * 2 + 1; }

window.addEventListener('mousemove', (event) => {
    // Only allow hover effect during active gameplay (isGamePlayable is true)
    if (!isGamePlayable) {
         // Reset hover if needed when not playable
         if (currentlyHovered && !currentlyHovered.userData.isAnimating) {
            gsap.to(currentlyHovered.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "power1.out" });
            gsap.to(currentlyHovered.position, { y: 0, duration: 0.3, ease: "power1.out" }); // Game row Y=0
            currentlyHovered = null;
        }
        return;
    }

    // --- Hover Logic during Gameplay ---
    updateMouseCoords(event);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cards);
    const targetYPosition = 0; // Y position of cards in game row

    // Handle hover out
    if (currentlyHovered && (intersects.length === 0 || intersects[0].object !== currentlyHovered)) {
        if (!currentlyHovered.userData.isAnimating) {
            gsap.to(currentlyHovered.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "power1.out" });
            gsap.to(currentlyHovered.position, { y: targetYPosition, duration: 0.3, ease: "power1.out" });
        }
        currentlyHovered = null;
    }
    // Handle hover on
    if (intersects.length > 0 && intersects[0].object !== currentlyHovered) {
        // De-hover previous card if any
        if (currentlyHovered && !currentlyHovered.userData.isAnimating) {
            gsap.to(currentlyHovered.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "power1.out" });
            gsap.to(currentlyHovered.position, { y: targetYPosition, duration: 0.3, ease: "power1.out" });
        }
        // Hover new card
        currentlyHovered = intersects[0].object;
        if (!currentlyHovered.userData.isAnimating) {
            // Apply hover effect
            gsap.to(currentlyHovered.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 0.3, ease: "power1.out" });
            gsap.to(currentlyHovered.position, { y: targetYPosition + 0.2, duration: 0.3, ease: "power1.out" });
        }
    }
    // --- End Hover Logic ---
});


window.addEventListener('click', () => {
    // Logging before the check
    console.log(`Click Check: isGamePlayable=${isGamePlayable}, currentlyHovered=${currentlyHovered ? currentlyHovered.userData.id : null}, isAnimating=${currentlyHovered ? currentlyHovered.userData.isAnimating : 'N/A'}`);

    // Only allow clicks during active gameplay on a hovered, non-animating card
    if (!isGamePlayable || !currentlyHovered || currentlyHovered.userData.isAnimating) {
        return;
    }
    // Logging before calling flipCard
    console.log(`Click Trigger: Flipping card ${currentlyHovered.userData.id}`);
    // Trigger flip
    flipCard(currentlyHovered);
});


// --- Card Flip Logic (Only flips face-up) ---
function flipCard(card) {
    console.log(`FlipCard ENTERED for card ${card.userData.id}, isFlipped=${card.userData.isFlipped}`);

    // Only flip if currently face down (isFlipped is true)
    if (!card.userData.isFlipped) {
        console.log(`FlipCard RETURN EARLY: Card ${card.userData.id} is already face up.`);
        return; // Do nothing if already face up
    }

    // Check animation flag AFTER checking flipped state
    if (card.userData.isAnimating) {
        console.log(`FlipCard RETURN EARLY: Card ${card.userData.id} is already animating.`);
        return;
    }
    card.userData.isAnimating = true; // Mark as animating

    // Target rotation is ALWAYS face up (0)
    const targetRotationY = 0; // Always target face up
    const duration = 0.8;
    const targetYPosition = 0; // Y position of cards in game row

    // Reset hover effects before flipping
    gsap.to(card.scale, { x: 1, y: 1, z: 1, duration: 0.2, ease: "power1.in" });
    gsap.to(card.position, { y: targetYPosition, duration: 0.2, ease: "power1.in" }); // Ensure Y is at game row level

    // Animate the rotation
    gsap.to(card.rotation, {
        y: targetRotationY,
        duration: duration,
        ease: "power3.inOut", // Use a smooth easing for the flip
        onComplete: () => {
            console.log(`FlipCard COMPLETE for card ${card.userData.id}. Setting isAnimating=false.`); // Log completion
            // Set flipped state directly to false (face up)
            card.userData.isFlipped = false; // Card is now face up
            card.userData.isAnimating = false; // Mark animation as complete
            handleHoverAfterAnimation(card); // Check hover state after animation
        }
    });
}

function handleHoverAfterAnimation(card) {
    // Checks if mouse is still over the card after flip and re-applies hover effect
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([card]);
    const targetYPosition = 0; // Y position of cards in game row

    if (intersects.length > 0) {
        currentlyHovered = card; // Ensure it's marked as hovered
        if (!currentlyHovered.userData.isAnimating) { // Double check not animating
            gsap.to(currentlyHovered.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 0.3, ease: "power1.out" });
            gsap.to(currentlyHovered.position, { y: targetYPosition + 0.2, duration: 0.3, ease: "power1.out" });
        }
    } else if (currentlyHovered === card) {
        // Mouse moved off the card during animation
        currentlyHovered = null;
    }
 }


// --- Function to Arrange Cards for Game (Single Row) ---
function arrangeForGame() {
    if (isGameActive) return; // Prevent triggering during animation
    if (cards.length === 0) { console.warn("Cannot arrange for game, no cards created."); return; }
    console.log("arrangeForGame: Starting animation sequence.");
    // isCarouselActive removed
    isGameActive = true; // Indicate game transition is active
    isGamePlayable = false; // Disable clicking/hovering during transition

    // Target layout settings
    const targetCardSpacingX = cardWidth * 1.25; const targetRowWidth = (numberOfCards - 1) * targetCardSpacingX; const targetRowOffsetX = -targetRowWidth / 2; const targetYPosition = 0; const targetZPosition = 1.5;

    const tl = gsap.timeline({
        onComplete: () => {
            console.log("ArrangeForGame Timeline COMPLETE.");
            // Reset isAnimating for ALL cards here after the entire timeline finishes
            cards.forEach(card => {
                 console.log(`Timeline complete: Resetting isAnimating for card ${card.userData.id}`);
                 card.userData.isAnimating = false;
                 card.userData.isFlipped = true; // Ensure final state is face down
            });
            isGamePlayable = true; // Allow interactions NOW
            isGameActive = false; // Transition animation finished
            console.log("Gameplay enabled.");
        }
    });

    // Fade out UI
    tl.to("#main-title", { opacity: 0, duration: 0.5 }, 0);
    tl.to("#start-game-button", { opacity: 0, duration: 0.5, pointerEvents: 'none' }, 0);

    // Animate each card to the target row
    cards.forEach((card, i) => {
        card.userData.isAnimating = true; // Mark as animating for the transition
        const targetX = i * targetCardSpacingX + targetRowOffsetX;
        const targetY = targetYPosition;
        const targetZ = targetZPosition;
        const targetRotationY = Math.PI; // Face down

        // Animate from current static fan pose (face back) to target row pose (face down)
        tl.to(card.position, {
            x: targetX, y: targetY, z: targetZ, duration: 1.0, ease: "power2.inOut"
            }, 0.2 + i * 0.08) // Stagger start

        // Animate rotation
          .to(card.rotation, {
            x: 0, // Ensure flat
            y: targetRotationY,
            z: 0,
            duration: 0.8,
            ease: "power2.inOut"
            }, 0.3 + i * 0.08); // Stagger start slightly later
    });
}


// --- Add Event Listener for Start Button ---
const startButton = document.getElementById('start-game-button');
if (startButton) { startButton.addEventListener('click', arrangeForGame); } else { console.error("Start game button not found!"); }

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth; sizes.height = window.innerHeight; camera.aspect = sizes.width / sizes.height; camera.updateProjectionMatrix(); renderer.setSize(sizes.width, sizes.height); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); if (composer) { composer.setSize(sizes.width, sizes.height); composer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); }
});

// --- Orbit Controls ---
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.05;
// Target the center of the layout
controls.target.set(0, initialYPosition, 0);
controls.minDistance = 3; controls.maxDistance = 20; controls.maxPolarAngle = Math.PI / 2.0;

// --- Animation Loop ---
const clock = new THREE.Clock();
function tick() {
    // Removed carousel update logic

    controls.update(); // Update orbit controls
    // Render scene
    if (composer) { composer.render(); } else { renderer.render(scene, camera); }
    window.requestAnimationFrame(tick); // Request next frame
}

// --- Start ---
// Final check before starting the loop
if (selectedImageFiles.length === numberOfCards && cards.length === numberOfCards) {
    tick(); // Start the animation loop
    console.log(`3D Card Collection Initialized (${numberOfCards} cards). Initial layout: Static Fan (Backs Showing).`);
    console.warn("Check console for texture errors!");
} else {
    console.error("Execution halted due to initialization errors (check image list or card creation loop).");
    // Error message should already be on page if image list was short.
}