// script.js
import * as THREE from 'three';
import { OrbitControls }         from 'three/addons/controls/OrbitControls.js';
import { EffectComposer }        from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }            from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass }       from 'three/addons/postprocessing/UnrealBloomPass.js';
import gsap                      from 'gsap';

// --- Helper: Shuffle Array ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- List of your image filenames ---
const availableImageFiles = [
    "1.jpg", "10.jpg", "11.jpg", "12.jpg", "13.jpg", "14.jpg", "15.jpg",
    "17.jpg", "21.jpg", "22.jpg", "23.jpg", "24.jpg", "25.jpg", 
    "27.jpg", "28.jpg", "29.jpg", "3.jpg",  "30.jpg", "31.jpg", "32.jpg",
    "33.jpg", "35.jpg", "36.jpg", "37.jpg", "38.jpg",  "40.jpg",
    "41.jpg", "42.jpg", "43.jpg", "44.JPEG","45.JPEG","46.JPEG","47.JPEG",
    "6.jpg",  "9.jpg"
];

// --- Card Message Data ---
const cardMessages = {
    "1.jpg": "Happy birthday, amore! Let's celebrate together every year!",
    "4.jpg": "SEXY!!!",
    "6.jpg": "My Wednesday Amore",
    "10.jpg": "Your boy friend has good taste!",
    "11.jpg": "Same phone!!",
    "13.jpg": "This is my favorite. You are so cute.",
    "21.jpg": "Eat like the royal family in the movie Roman Holiday.",
    "22.jpg": "A beautiful view and a beautiful lady.",
    "23.jpg": "I love you so much; you are sooooo sexy.",
    "29.jpg": "Amore with her friends.",
    "31.jpg": "Wednesday!!",
    "35.jpg": "Heart heart heart!",
    "37.jpg": "Family trip!!",
    "40.jpg": "I love the beautiful view and my beautiful amore.",
    "42.jpg": "I miss you too.",
    "43.jpg": "Very sexy and revealing, lol.",
    "44.JPEG": "Amore, so confident and professional.",
    "45.JPEG": "So elegant and professional!",
    "46.JPEG": "My K-pop star, amore!",
    "47.JPEG": "Amore, you are so stunning, like stars in the dark sky!!!!!!!"
};
const defaultMessage = "You are amazing";

// --- Get References to UI Elements ---
const textDisplayElement = document.getElementById('card-text-display');
if (!textDisplayElement) { console.error("Text display element #card-text-display not found!"); }
const startButton = document.getElementById('start-game-button');
const refreshButton = document.getElementById('refresh-button');

// --- Basic Setup ---
const canvas = document.getElementById('webgl-canvas'); if (!canvas) console.error("Canvas element #webgl-canvas not found!");
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0a0a0a');
const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100); camera.position.set(0, 1.5, 9); scene.add(camera);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.useLegacyLights = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
// renderer.outputColorSpace = THREE.SRGBColorSpace; // Use this in newer Three.js versions
renderer.outputEncoding = THREE.sRGBEncoding; // Deprecated
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- Lighting ---
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x555555, 0.9);
scene.add(hemisphereLight);
const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
keyLight.position.set(3, 4, 3); keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 1024;
keyLight.shadow.mapSize.height = 1024;
keyLight.shadow.camera.near = 0.5; keyLight.shadow.camera.far = 20; keyLight.shadow.bias = -0.002; scene.add(keyLight);

// --- Post-Processing ---
let composer;
function setupPostProcessing() {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.4, 0.5, 0.75);
    composer.addPass(bloomPass);
    composer.setSize(sizes.width, sizes.height);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
setupPostProcessing();

// --- Particle System ---
let particles;
function createParticles() {
    const particleCount = 7000;
    const positions = new Float32Array(particleCount * 3);
    const spread = 30;

    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i]     = (Math.random() - 0.5) * spread;
        positions[i + 1] = (Math.random() - 0.5) * spread;
        positions[i + 2] = (Math.random() - 0.5) * spread;
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        color: 0xAAAAAA,
        size: 0.03,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.7,
    });

    particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    console.log("Particle system created.");
}
createParticles();

// --- Card Settings ---
const numberOfCards = 6;
const cardWidth = 1.5;
const imageAspectRatio = 1.4;
const cardHeight = cardWidth * imageAspectRatio;
const cardThickness = 0.05;
const cardGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardThickness);
const cards = [];

// --- Card Materials ---
const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xB8860B, roughness: 0.3, metalness: 0.8 });
const cardBackColor = '#1F1F1F';
const cardFrontColor = '#ADD8E6';
const cardBorderColor = '#B8860B';

// --- Function to Generate Card Back Texture ---
function createGeneratedCardBackTexture() { /* ... (no changes needed) ... */
    const canvasWidth = 256; const canvasHeight = Math.floor(canvasWidth * imageAspectRatio); const canvas = document.createElement('canvas'); canvas.width = canvasWidth; canvas.height = canvasHeight; const ctx = canvas.getContext('2d');
    ctx.fillStyle = cardBackColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    const borderThickness = canvasWidth * 0.05; ctx.strokeStyle = cardBorderColor; ctx.lineWidth = borderThickness; ctx.strokeRect(borderThickness / 2, borderThickness / 2, canvasWidth - borderThickness, canvasHeight - borderThickness); const texture = new THREE.CanvasTexture(canvas); texture.needsUpdate = true; return texture;
}

// --- Function to Generate Front Card Texture ---
function createFrontCardTexture(imagePath, callback) { /* ... (no changes needed) ... */
    const canvasTextureWidth = 512;
    const canvasTextureHeight = Math.floor(canvasTextureWidth * imageAspectRatio);
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = canvasTextureWidth;
    textureCanvas.height = canvasTextureHeight;
    const ctx = textureCanvas.getContext('2d');
    const borderThickness = canvasTextureWidth * 0.035;

    ctx.fillStyle = cardFrontColor;
    ctx.fillRect(0, 0, canvasTextureWidth, canvasTextureHeight);

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
        const imgAspectRatio = img.naturalHeight / img.naturalWidth;
        const canvasAspectRatio = canvasTextureHeight / canvasTextureWidth;
        let drawWidth, drawHeight, drawX, drawY;
        const padding = borderThickness * 1.5;
        const availableWidth = canvasTextureWidth - 2 * padding;
        const availableHeight = canvasTextureHeight - 2 * padding;

        if (imgAspectRatio > canvasAspectRatio) {
            drawHeight = availableHeight;
            drawWidth = drawHeight / imgAspectRatio;
            drawX = padding + (availableWidth - drawWidth) / 2;
            drawY = padding;
        } else {
            drawWidth = availableWidth;
            drawHeight = drawWidth * imgAspectRatio;
            drawX = padding;
            drawY = padding + (availableHeight - drawHeight) / 2;
        }
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        ctx.strokeStyle = cardBorderColor;
        ctx.lineWidth = borderThickness;
        ctx.strokeRect(borderThickness / 2, borderThickness / 2, canvasTextureWidth - borderThickness, canvasTextureHeight - borderThickness);

        const finalTexture = new THREE.CanvasTexture(textureCanvas);
        finalTexture.colorSpace = THREE.SRGBColorSpace;
        finalTexture.needsUpdate = true;
        callback(finalTexture);
    };
    img.onerror = (error) => {
        console.error(`Error loading image for front texture: '${imagePath}'`, error);
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, canvasTextureWidth, canvasTextureHeight);
        ctx.font = "20px Arial"; ctx.fillStyle = "white"; ctx.textAlign = "center";
        ctx.fillText("Error", canvasTextureWidth / 2, canvasTextureHeight / 2);
        const errorTexture = new THREE.CanvasTexture(textureCanvas);
        errorTexture.needsUpdate = true;
        callback(errorTexture);
    };
    img.src = imagePath;
}

// --- Static Initial Layout Settings ---
const initialLayoutRadius = 4.0;
const initialLayoutAngle = Math.PI / 1.8;
const initialYPosition = 0;

// --- Texture Loading & Card Creation ---
const textureLoader = new THREE.TextureLoader();
const cardBackTexture = createGeneratedCardBackTexture();

// --- Select Unique Images ---
const uniqueImageFiles = [...new Set(availableImageFiles)];
if (uniqueImageFiles.length < numberOfCards) { /* ... (error handling) ... */
    console.error(`Error: Need at least ${numberOfCards} unique images...`);
    document.body.innerHTML = `<h1 style="color: red;">Error: Not enough unique images listed...</h1>`;
    throw new Error(`Insufficient unique images listed.`);
}
const shuffledUniqueFiles = shuffleArray(uniqueImageFiles);
const selectedImageFiles = shuffledUniqueFiles.slice(0, numberOfCards);
console.log("Selected unique images:", selectedImageFiles);

// --- Create Cards ---
let cardsCreated = 0;
if (selectedImageFiles.length === numberOfCards) {
    selectedImageFiles.forEach((filename, i) => {
        const imagePath = `images/${filename}`;
        createFrontCardTexture(imagePath, (frontTexture) => {
            const backMaterial = new THREE.MeshStandardMaterial({ map: cardBackTexture, roughness: 0.7, metalness: 0.1 });
            const frontMaterial = new THREE.MeshStandardMaterial({ map: frontTexture, roughness: 0.85, metalness: 0.05 });
            const materials = [ edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial, frontMaterial, backMaterial ];
            const cardMesh = new THREE.Mesh(cardGeometry, materials);
            cardMesh.castShadow = true; cardMesh.receiveShadow = true;

            const fraction = numberOfCards <= 1 ? 0.5 : i / (numberOfCards - 1);
            const currentAngle = (fraction - 0.5) * initialLayoutAngle;
            const xPos = initialLayoutRadius * Math.sin(currentAngle);
            const zPos = initialLayoutRadius * Math.cos(currentAngle) - initialLayoutRadius;
            cardMesh.position.set(xPos, initialYPosition, zPos);
            cardMesh.rotation.y = -currentAngle + Math.PI;

            cardMesh.userData = { id: i, filename: filename, isFlipped: true, isAnimating: false };
            scene.add(cardMesh);
            cards.push(cardMesh);

            cardsCreated++;
            if (cardsCreated === numberOfCards) {
                console.log(`All ${numberOfCards} card meshes created.`);
                 if(startButton && startButton.disabled && startButton.textContent === "Loading...") {
                    startButton.textContent = "Start Game";
                    startButton.disabled = false;
                 }
            }
        });
    });
} else { /* ... (error handling) ... */
     console.error("Card selection failed...");
     if(startButton) startButton.disabled = true;
}

// --- Ground Plane ---
const groundGeometry = new THREE.PlaneGeometry(30, 30);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.6, metalness: 0.2 });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = initialYPosition - cardHeight / 2 - 0.1;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// ========================================================
// --- Raycasting & Interaction (REVISED) ---
// ========================================================
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(); // Use 'pointer' for mouse/touch
let currentlyHovered = null;      // For visual hover feedback only
let isGamePlayable = false;
let isGameActive = false;
let interactionHasOccurred = false; // Flag to potentially prevent double events

// Update pointer coordinates from mouse or touch events
function updatePointerCoords(event) {
    // Use changedTouches for touchend, otherwise use event directly (works for mouse, touchstart, touchmove)
    const touch = event.changedTouches ? event.changedTouches[0] : event.touches ? event.touches[0] : event;
    // Make sure we have clientX/Y (should exist for relevant events)
    if (touch.clientX !== undefined && touch.clientY !== undefined) {
        pointer.x = (touch.clientX / sizes.width) * 2 - 1;
        pointer.y = - (touch.clientY / sizes.height) * 2 + 1;
        return true; // Coordinates updated
    }
    console.warn("Could not get pointer coordinates from event:", event.type);
    return false; // Failed to update
}


// Handle visual hover effect (mousemove) - Does NOT trigger actions
function handlePointerMove(event) {
    // Only apply hover if game is playable AND it's not a touch event
    const isTouchEvent = event.type.startsWith('touch'); // Basic check for touch event type
    if (!isGamePlayable || isTouchEvent) {
         // Clear existing hover if pointer moves off or if it's a touch event
         if (currentlyHovered && !currentlyHovered.userData.isAnimating) {
            gsap.to(currentlyHovered.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "power1.out" });
            gsap.to(currentlyHovered.position, { y: initialYPosition, duration: 0.3, ease: "power1.out" });
            currentlyHovered = null;
         }
         if(isTouchEvent) return; // Don't process hover further for touch events
    }

    if (!updatePointerCoords(event)) return; // Update pointer coords

    raycaster.setFromCamera(pointer, camera);
    const intersects = cards.length > 0 ? raycaster.intersectObjects(cards) : [];
    const targetYPosition = initialYPosition;

    // Check if pointer moved OFF the previously hovered card
    if (currentlyHovered && (intersects.length === 0 || intersects[0].object !== currentlyHovered)) {
        if (!currentlyHovered.userData.isAnimating) {
            gsap.to(currentlyHovered.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "power1.out" });
            gsap.to(currentlyHovered.position, { y: targetYPosition, duration: 0.3, ease: "power1.out" });
        }
        currentlyHovered = null;
    }

    // Check if pointer moved ONTO a new card
    if (intersects.length > 0 && intersects[0].object !== currentlyHovered) {
        if (currentlyHovered && !currentlyHovered.userData.isAnimating) { // De-hover previous
            gsap.to(currentlyHovered.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "power1.out" });
            gsap.to(currentlyHovered.position, { y: targetYPosition, duration: 0.3, ease: "power1.out" });
        }
        // Hover the new one (visually only)
        currentlyHovered = intersects[0].object;
        if (!currentlyHovered.userData.isAnimating) {
            gsap.to(currentlyHovered.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 0.3, ease: "power1.out" });
            gsap.to(currentlyHovered.position, { y: targetYPosition + 0.2, duration: 0.3, ease: "power1.out" });
        }
    }
}

// Handle the action (click or tap end) - Triggers the card flip
function handleInteractionEnd(event) {
    if (!isGamePlayable || interactionHasOccurred) {
        // If an interaction already happened very recently, ignore (helps prevent double fire)
        if(interactionHasOccurred) console.log("Ignoring potential double event:", event.type);
        return;
    }

    // Attempt to prevent click event after touchend if browser synthesizes it
    // Note: This might not always work perfectly across all browsers/versions
    if (event.type === 'touchend') {
        // event.preventDefault(); // Use cautiously - might prevent other desired behavior like link clicks if you had any
    }

    if (!updatePointerCoords(event)) {
        console.log("handleInteractionEnd: Failed to get pointer coords for event:", event.type);
        return; // Exit if coords couldn't be determined
    }

    console.log(`handleInteractionEnd type: ${event.type}, pointer: ${pointer.x.toFixed(2)}, ${pointer.y.toFixed(2)}`);

    raycaster.setFromCamera(pointer, camera);
    const intersects = cards.length > 0 ? raycaster.intersectObjects(cards, false) : [];

    if (intersects.length > 0) {
        const targetCard = intersects[0].object;
        // Check if the intersected object is a valid, non-animating card
        if (cards.includes(targetCard) && !targetCard.userData.isAnimating) {
            console.log(`InteractionEnd Trigger: Flipping card ${targetCard.userData.id} (${targetCard.userData.filename})`);

            // Set flag to potentially ignore subsequent click event
            interactionHasOccurred = true;
            setTimeout(() => { interactionHasOccurred = false; }, 100); // Reset flag after a short delay

            flipCard(targetCard);

        } else {
             console.log("InteractionEnd: Intersected with non-card or animating card.");
        }
    } else {
        console.log("InteractionEnd: No card intersection found.");
    }

    // If we tapped/clicked empty space, ensure any visual hover is removed
    if (intersects.length === 0 && currentlyHovered && !currentlyHovered.userData.isAnimating) {
        gsap.to(currentlyHovered.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "power1.out" });
        gsap.to(currentlyHovered.position, { y: initialYPosition, duration: 0.3, ease: "power1.out" });
        currentlyHovered = null;
    }
}


// --- Add Event Listeners ---
// Listener for visual hover (mouse only)
window.addEventListener('mousemove', handlePointerMove);

// Listener for Touch Start (might be useful for immediate feedback later, but not essential now)
// window.addEventListener('touchstart', (event) => {
//     if (!isGamePlayable) return;
//     updatePointerCoords(event); // Update coords on touch start
//     // Could potentially raycast here to set 'currentlyHovered' for touch if needed
// }, { passive: true });

// Listener for Touch Move (mainly to prevent hover during drag)
window.addEventListener('touchmove', handlePointerMove, { passive: true });

// Listener for Touch End (Primary action trigger for touch)
window.addEventListener('touchend', handleInteractionEnd);

// Listener for Click (Primary action trigger for mouse, fallback for touch)
window.addEventListener('click', handleInteractionEnd);

// ========================================================
// --- End of Revised Interaction Logic ---
// ========================================================


// --- Card Flip Logic ---
function flipCard(card) { /* ... (no changes needed in flipCard logic itself) ... */
    const filename = card.userData.filename;
    console.log(`--- flipCard START ---`);
    console.log(`Clicked card filename: '${filename}'`);

    const hasSpecificMessage = cardMessages.hasOwnProperty(filename);
    const messageToDisplay = hasSpecificMessage ? cardMessages[filename] : defaultMessage;
    console.log(`Message to display: "${messageToDisplay}"`);

    if (!card.userData.isFlipped) {
        console.log(`Card '${filename}' is already face-up.`);
        if (textDisplayElement) {
            textDisplayElement.textContent = messageToDisplay;
            gsap.fromTo(textDisplayElement,
                { opacity: textDisplayElement.style.opacity || 0, bottom: "20%" },
                { opacity: 1, bottom: "22%", duration: 0.5, ease: "power1.out"}
             );
        } else { console.error("textDisplayElement missing!"); }
        console.log(`--- flipCard END (face-up card) ---`);
        return;
    }

    if (card.userData.isAnimating) { console.log(`Card '${filename}' is already animating.`); return; }
    card.userData.isAnimating = true;
    console.log(`Card '${filename}' starting animation.`);

    if (textDisplayElement) {
        gsap.to(textDisplayElement, {
            opacity: 0, bottom: "20%", duration: 0.3, ease: "power1.in"
        });
    } else { console.error("textDisplayElement missing!"); }

    const targetRotationY = 0;
    const duration = 0.9;
    const targetYPosition = initialYPosition;
    const easeFlip = "back.out(1.5)";

    gsap.to(card.scale, { x: 1, y: 1, z: 1, duration: 0.2, ease: "power1.in" });
    gsap.to(card.position, { y: targetYPosition, duration: 0.2, ease: "power1.in" });

    gsap.to(card.rotation, {
        y: targetRotationY, duration: duration, ease: easeFlip,
        onComplete: () => {
            card.userData.isFlipped = false;
            card.userData.isAnimating = false;
            console.log(`Flip complete for '${filename}'`);
            if (textDisplayElement) {
                textDisplayElement.textContent = messageToDisplay;
                gsap.fromTo(textDisplayElement,
                    { opacity: 0, bottom: "18%" },
                    { opacity: 1, bottom: "22%", duration: 0.6, ease: "power2.out"}
                );
            } else { console.error("textDisplayElement NOT FOUND!"); }
            handleHoverAfterAnimation(card); // Check if pointer is still over after animation
        }
    });
}


// --- Handle Hover After Animation ---
function handleHoverAfterAnimation(card) { /* ... (no changes needed) ... */
    raycaster.setFromCamera(pointer, camera); // Use pointer instead of mouse
    const intersects = raycaster.intersectObjects([card]);
    const targetYPosition = initialYPosition;

    if (intersects.length > 0) {
        console.log(`[handleHoverAfterAnimation] Pointer still over ${card.userData.filename}.`);
        currentlyHovered = card;
        if (!currentlyHovered.userData.isAnimating) {
            gsap.to(currentlyHovered.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 0.3, ease: "power1.out" });
            gsap.to(currentlyHovered.position, { y: targetYPosition + 0.2, duration: 0.3, ease: "power1.out" });
        }
    } else if (currentlyHovered === card) {
         console.log(`[handleHoverAfterAnimation] Pointer no longer over ${card.userData.filename}.`);
        currentlyHovered = null;
    }
}

// --- Function to Arrange Cards for Game ---
function arrangeForGame() { /* ... (no changes needed) ... */
    if (isGameActive) return;
    if (cards.length !== numberOfCards) {
        console.warn("Cannot arrange for game, cards not fully created yet.");
        const btn = document.getElementById('start-game-button');
        if(btn && !btn.disabled) {
            btn.textContent = "Loading...";
            btn.disabled = true;
             setTimeout(() => {
                 if(btn && btn.textContent === "Loading...") {
                      btn.textContent = "Start Game";
                      btn.disabled = false;
                      console.warn("Re-enabled start button after delay.");
                 }
             }, 3000);
        }
        return;
    }

    if(startButton && startButton.textContent === "Loading...") {
        startButton.textContent = "Start Game"; startButton.disabled = false;
    }

    console.log("ArrangeForGame: Starting animation sequence.");
    isGameActive = true;
    isGamePlayable = false;

    if (textDisplayElement) {
        gsap.to(textDisplayElement, {
            opacity: 0, bottom: "20%", duration: 0.3, ease: "power1.in"
         });
    }

    const targetCardSpacingX = cardWidth * 1.25;
    const targetRowWidth = (numberOfCards - 1) * targetCardSpacingX;
    const targetRowOffsetX = -targetRowWidth / 2;
    const targetYPosition = initialYPosition;
    const targetZPosition = 1.5;

    const tl = gsap.timeline({
        onComplete: () => {
            console.log("ArrangeForGame Timeline COMPLETE.");
            cards.forEach(card => {
                card.userData.isAnimating = false;
                card.userData.isFlipped = true;
            });
            isGamePlayable = true;
            isGameActive = false;
        }
    });

    tl.to("#main-title", {
        opacity: 0, top: '-60px', duration: 0.7, ease: "power2.in", pointerEvents: 'none'
    }, 0);

    tl.to("#start-game-button", {
        opacity: 0, duration: 0.5, ease: "power1.in", pointerEvents: 'none'
    }, 0.1);

    cards.forEach((card, i) => {
        card.userData.isAnimating = true;
        const targetX = i * targetCardSpacingX + targetRowOffsetX;
        const targetY = targetYPosition;
        const targetZ = targetZPosition;
        const targetRotationY = Math.PI;
        const easeType = "back.out(1.2)";
        const duration = 1.2;

        tl.to(card.position, {
            x: targetX, y: targetY, z: targetZ, duration: duration, ease: easeType
        }, 0.3 + i * 0.1)
        .to(card.rotation, {
            x: 0, y: targetRotationY, z: 0, duration: duration * 0.8, ease: easeType
        }, 0.3 + i * 0.1);
    });
}

// --- Add Event Listener for Start Button ---
if (startButton) { /* ... (no changes needed) ... */
    startButton.addEventListener('click', arrangeForGame);
} else { console.error("Start game button not found!"); }

// --- Add Event Listener for Refresh Button ---
if (refreshButton) { /* ... (no changes needed) ... */
    refreshButton.addEventListener('click', () => {
        console.log("Refresh button clicked.");
        document.body.style.transition = 'opacity 0.3s ease-out';
        document.body.style.opacity = 0;
        setTimeout(() => location.reload(), 300);
    });
} else { console.error("Refresh button not found!"); }

// --- Handle Window Resize ---
window.addEventListener('resize', () => { /* ... (no changes needed) ... */
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (composer) {
        composer.setSize(sizes.width, sizes.height);
        composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
});

// --- Orbit Controls ---
const controls = new OrbitControls(camera, canvas); /* ... (no changes needed) ... */
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, initialYPosition, 0);
controls.minDistance = 3;
controls.maxDistance = 25;
controls.maxPolarAngle = Math.PI / 2.05;
// Disable touch panning on controls to potentially avoid conflict with card interaction
// You might need to re-enable if camera control via touch is desired. Test carefully.
// controls.enablePan = false; // Optional: test if this helps interaction reliability


// --- Animation Loop ---
const clock = new THREE.Clock();
function tick() { /* ... (no changes needed except particle animation) ... */
    const elapsedTime = clock.getElapsedTime();
    controls.update();
    if (particles) {
        particles.rotation.y = elapsedTime * 0.02; // Rotate particles
    }
    if (composer) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
    window.requestAnimationFrame(tick);
}

// --- Start ---
tick();
console.log("3D Card Scene Initialized.");
console.warn("Check console for texture loading/interaction messages!");
