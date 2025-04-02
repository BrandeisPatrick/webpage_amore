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
    "17.jpg", "21.jpg", "22.jpg", "23.jpg", "24.jpg", "25.jpg", "26.jpg",
    "27.jpg", "28.jpg", "29.jpg", "3.jpg",  "30.jpg", "31.jpg", "32.jpg",
    "33.jpg", "35.jpg", "36.jpg", "37.jpg", "38.jpg", "4.jpg",  "40.jpg",
    "41.jpg", "42.jpg", "43.jpg", "44.JPEG","45.JPEG","46.JPEG","47.JPEG",
    "6.jpg",  "9.jpg"
];

// --- Card Message Data (Used to trigger text display) ---
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
const defaultMessage = "You are amazing"; // Default message

// --- Get References to UI Elements ---
const textDisplayElement = document.getElementById('card-text-display');
if (!textDisplayElement) { console.error("Text display element #card-text-display not found!"); }
const startButton = document.getElementById('start-game-button');
const refreshButton = document.getElementById('refresh-button');

// --- Basic Setup ---
const canvas = document.getElementById('webgl-canvas'); if (!canvas) console.error("Canvas element #webgl-canvas not found!");
const scene = new THREE.Scene(); scene.background = new THREE.Color('#0a0a0a'); // Slightly darker bg
const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100); camera.position.set(0, 1.5, 9); scene.add(camera);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.useLegacyLights = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding; // Correct property name - DEPRECATED use outputColorSpace
// renderer.outputColorSpace = THREE.SRGBColorSpace; // Use this in newer Three.js versions
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- Lighting ---
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x555555, 0.9); // Slightly brighter ambient down light
scene.add(hemisphereLight);
const keyLight = new THREE.DirectionalLight(0xffffff, 1.6); // Slightly stronger key light
keyLight.position.set(3, 4, 3); keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 1024; // Keep decent shadow resolution
keyLight.shadow.mapSize.height = 1024;
keyLight.shadow.camera.near = 0.5; keyLight.shadow.camera.far = 20; keyLight.shadow.bias = -0.002; scene.add(keyLight);

// --- Post-Processing ---
let composer;
function setupPostProcessing() {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    // Slightly adjusted Bloom for potentially better performance/look
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.4, 0.5, 0.75); // strength, radius, threshold
    composer.addPass(bloomPass);
    composer.setSize(sizes.width, sizes.height);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
setupPostProcessing();

// --- Card Settings ---
const numberOfCards = 6;
const cardWidth = 1.5;
const imageAspectRatio = 1.4;
const cardHeight = cardWidth * imageAspectRatio;
const cardThickness = 0.05;
const cardGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardThickness);
const cards = [];

// --- Card Materials ---
// const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xB08D57, roughness: 0.4, metalness: 0.7 }); // Original Golden edge
const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xB8860B, roughness: 0.3, metalness: 0.8 }); // Darker, richer gold
const cardBackColor = '#1F1F1F'; // Darker back
const cardFrontColor = '#ADD8E6'; // Light Blue background for front canvas behind image
const cardBorderColor = '#B8860B'; // Match edge color

// --- Function to Generate Card Back Texture ---
function createGeneratedCardBackTexture() {
    const canvasWidth = 256; const canvasHeight = Math.floor(canvasWidth * imageAspectRatio); const canvas = document.createElement('canvas'); canvas.width = canvasWidth; canvas.height = canvasHeight; const ctx = canvas.getContext('2d');
    ctx.fillStyle = cardBackColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    const borderThickness = canvasWidth * 0.05; ctx.strokeStyle = cardBorderColor; ctx.lineWidth = borderThickness; ctx.strokeRect(borderThickness / 2, borderThickness / 2, canvasWidth - borderThickness, canvasHeight - borderThickness); const texture = new THREE.CanvasTexture(canvas); texture.needsUpdate = true; return texture;
}

// --- Function to Generate Front Card Texture (Image + Border) ---
function createFrontCardTexture(imagePath, callback) {
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
if (uniqueImageFiles.length < numberOfCards) {
    console.error(`Error: Need at least ${numberOfCards} unique images listed in availableImageFiles, found only ${uniqueImageFiles.length}.`);
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
        console.log(`Requesting front texture generation for: ${imagePath}`);
        createFrontCardTexture(imagePath, (frontTexture) => {
            console.log(`Front texture created for: ${filename}`);
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
                console.log(`All ${numberOfCards} card meshes created and added to scene.`);
                 // Enable start button if it was disabled during loading attempt
                 if(startButton && startButton.disabled && startButton.textContent === "Loading...") {
                    startButton.textContent = "Start Game";
                    startButton.disabled = false;
                 }
            }
        });
    });
} else {
     console.error("Card selection failed, cannot create cards.");
     if(startButton) startButton.disabled = true; // Disable start if selection fails
}

// --- Ground Plane ---
const groundGeometry = new THREE.PlaneGeometry(30, 30);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x151515, // Slightly lighter base
    roughness: 0.6,  // Less rough (more reflection)
    metalness: 0.2   // Slightly more metallic
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = initialYPosition - cardHeight / 2 - 0.1;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// --- Raycasting & Interaction ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let currentlyHovered = null;
let isGamePlayable = false;
let isGameActive = false;

function updateMouseCoords(event) {
    // Adjust for touch events if needed
    const touch = event.touches ? event.touches[0] : event;
    mouse.x = (touch.clientX / sizes.width) * 2 - 1;
    mouse.y = - (touch.clientY / sizes.height) * 2 + 1;
}

// --- Event Listeners (mousemove, click, touch) ---
function handlePointerMove(event) { // Renamed to handle multiple event types
     if (!isGamePlayable) {
         // If game not playable, ensure no lingering hover effects
         if (currentlyHovered && !currentlyHovered.userData.isAnimating) {
             gsap.to(currentlyHovered.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "power1.out" });
             gsap.to(currentlyHovered.position, { y: initialYPosition, duration: 0.3, ease: "power1.out" });
             currentlyHovered = null;
         }
         return;
     }

     updateMouseCoords(event);
     raycaster.setFromCamera(mouse, camera);
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
         // De-hover the previous one (should be handled above, but good failsafe)
         if (currentlyHovered && !currentlyHovered.userData.isAnimating) {
             gsap.to(currentlyHovered.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "power1.out" });
             gsap.to(currentlyHovered.position, { y: targetYPosition, duration: 0.3, ease: "power1.out" });
         }
         // Hover the new one
         currentlyHovered = intersects[0].object;
         if (!currentlyHovered.userData.isAnimating) {
             gsap.to(currentlyHovered.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 0.3, ease: "power1.out" });
             gsap.to(currentlyHovered.position, { y: targetYPosition + 0.2, duration: 0.3, ease: "power1.out" });
         }
     }
}

function handlePointerClick() { // Renamed to handle multiple event types
    // On touch devices, hover might not happen before click, so re-check intersection
    // However, for simplicity, we'll rely on the currentlyHovered state set by move/touch
     if (!isGamePlayable || !currentlyHovered || currentlyHovered.userData.isAnimating) {
         return;
     }
     console.log(`Click/Tap Trigger: Flipping card ${currentlyHovered.userData.id} (${currentlyHovered.userData.filename})`);
     flipCard(currentlyHovered);
}

window.addEventListener('mousemove', handlePointerMove);
window.addEventListener('touchmove', handlePointerMove, { passive: true }); // Use passive for performance on touchmove

window.addEventListener('click', handlePointerClick);
// No separate touchend needed if click handles taps well enough

// --- Card Flip Logic (Modified for Default Text Display & Animation) ---
function flipCard(card) {
    const filename = card.userData.filename;
    console.log(`--- flipCard START ---`);
    console.log(`Clicked card filename: '${filename}'`);

    const hasSpecificMessage = cardMessages.hasOwnProperty(filename);
    const messageToDisplay = hasSpecificMessage ? cardMessages[filename] : defaultMessage;
    console.log(`Message to display: "${messageToDisplay}"`);

    // --- Check for re-clicking face-up card ---
    if (!card.userData.isFlipped) {
        console.log(`Card '${filename}' is already face-up. Re-evaluating display.`);
        if (textDisplayElement) {
            console.log(`Updating text display for face-up card.`);
            textDisplayElement.textContent = messageToDisplay;
            // Animate IN (slide up and fade in) even on re-click
            // Use the target 'bottom' value from CSS (e.g., '22%')
            gsap.fromTo(textDisplayElement,
                { opacity: textDisplayElement.style.opacity || 0, bottom: "20%" }, // Start from current/down
                {
                    opacity: 1,
                    bottom: "22%", // Target position
                    duration: 0.5,
                    ease: "power1.out"
                }
             );
        } else {
            console.error("textDisplayElement missing when trying to update face-up card!");
        }
        console.log(`--- flipCard END (face-up card) ---`);
        return;
    }
    // --- End re-click check ---

    if (card.userData.isAnimating) {
        console.log(`Card '${filename}' is already animating. Ignoring click.`);
        console.log(`--- flipCard END (isAnimating) ---`);
        return;
    }
    card.userData.isAnimating = true;
    console.log(`Card '${filename}' starting animation. Setting isAnimating=true.`);

    // Hide current text display (slide down and fade out) BEFORE flipping
    if (textDisplayElement) {
        console.log(`Fading/Sliding out text display before flip animation.`);
        gsap.to(textDisplayElement, {
            opacity: 0,
            bottom: "20%", // Animate downwards to the 'hidden' position state
            duration: 0.3,
            ease: "power1.in" // Ease in for disappearance
        });
    } else {
        console.error("textDisplayElement missing before flip animation!");
    }

    const targetRotationY = 0; // Rotate to face forward
    const duration = 0.9; // Slightly longer flip duration
    const targetYPosition = initialYPosition;
    const easeFlip = "back.out(1.5)"; // Add a bit of overshoot to the flip

    // Animate scale/position back to normal before flip if needed (hover effect)
    gsap.to(card.scale, { x: 1, y: 1, z: 1, duration: 0.2, ease: "power1.in" });
    gsap.to(card.position, { y: targetYPosition, duration: 0.2, ease: "power1.in" });

    console.log(`Starting main flip rotation animation for '${filename}'. Target Y: ${targetRotationY}`);
    gsap.to(card.rotation, {
        y: targetRotationY,
        duration: duration,
        ease: easeFlip, // Use the overshoot ease
        onComplete: () => {
            console.log(`--- flipCard onComplete START for '${filename}' ---`);
            card.userData.isFlipped = false; // Mark as face-up
            card.userData.isAnimating = false;
            console.log(`Set isFlipped=false, isAnimating=false`);

            // --- Show Text On Complete ---
            console.log(`[onComplete] Checking textDisplayElement...`);
            if (textDisplayElement) {
                console.log(`[onComplete] textDisplayElement found.`);
                textDisplayElement.textContent = messageToDisplay;
                console.log(`[onComplete] Set textContent to: '${textDisplayElement.textContent}'`);
                // Animate IN (slide up and fade in)
                console.log(`[onComplete] Fading/Sliding text display in.`);
                // Use the target 'bottom' value from CSS (e.g., '22%')
                gsap.fromTo(textDisplayElement,
                    { opacity: 0, bottom: "18%" }, // Start slightly lower and transparent
                    {
                        opacity: 1,
                        bottom: "22%", // Target position
                        duration: 0.6,
                        ease: "power2.out",
                        onComplete: () => {
                            console.log(`[onComplete] Text fade/slide animation complete.`);
                        }
                    });
            } else {
                console.error("[onComplete] textDisplayElement NOT FOUND!");
            }
            // --- End Show Text Logic ---

            handleHoverAfterAnimation(card);
            console.log(`--- flipCard onComplete END for '${filename}' ---`);
        }
    });
    console.log(`--- flipCard END (main logic initiated) ---`);
}


// --- Handle Hover After Animation ---
function handleHoverAfterAnimation(card) {
    // Check if the mouse/pointer is currently over the card after animation finishes
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([card]);
    const targetYPosition = initialYPosition;

    if (intersects.length > 0) {
        console.log(`[handleHoverAfterAnimation] Pointer still over ${card.userData.filename}, re-applying hover.`);
        currentlyHovered = card; // Ensure it's marked as hovered
        if (!currentlyHovered.userData.isAnimating) { // Double check
            gsap.to(currentlyHovered.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 0.3, ease: "power1.out" });
            gsap.to(currentlyHovered.position, { y: targetYPosition + 0.2, duration: 0.3, ease: "power1.out" });
        }
    } else if (currentlyHovered === card) {
        // Pointer moved away while card was flipping/animating
         console.log(`[handleHoverAfterAnimation] Pointer no longer over ${card.userData.filename}.`);
        currentlyHovered = null;
    }
}

// --- Function to Arrange Cards for Game (with Enhanced Animation) ---
function arrangeForGame() {
    if (isGameActive) return;
    if (cards.length !== numberOfCards) {
        console.warn("Cannot arrange for game, cards not fully created yet. Wait.");
        const btn = document.getElementById('start-game-button');
        if(btn && !btn.disabled) { // Only show loading if not already disabled
            btn.textContent = "Loading...";
            btn.disabled = true;
            // Setup a check to re-enable if loading finishes
             setTimeout(() => {
                 if(btn && btn.textContent === "Loading...") {
                      btn.textContent = "Start Game";
                      btn.disabled = false;
                      console.warn("Re-enabled start button after delay. Card loading might still be ongoing.");
                 }
             }, 3000); // Increased delay slightly
        }
        return;
    }

    // Ensure button text/state is correct if loading finished quickly
    if(startButton && startButton.textContent === "Loading...") {
        startButton.textContent = "Start Game"; startButton.disabled = false;
    }

    console.log("ArrangeForGame: Starting animation sequence.");
    isGameActive = true;
    isGamePlayable = false;

    // Hide text display immediately when game starts arranging
    if (textDisplayElement) {
        gsap.to(textDisplayElement, {
            opacity: 0,
            bottom: "20%", // Ensure it slides down if visible
            duration: 0.3,
            ease: "power1.in"
         });
    }

    const targetCardSpacingX = cardWidth * 1.25;
    const targetRowWidth = (numberOfCards - 1) * targetCardSpacingX;
    const targetRowOffsetX = -targetRowWidth / 2;
    const targetYPosition = initialYPosition;
    const targetZPosition = 1.5;

    const tl = gsap.timeline({
        onComplete: () => {
            console.log("ArrangeForGame Timeline COMPLETE. Gameplay enabled.");
            cards.forEach(card => {
                card.userData.isAnimating = false;
                card.userData.isFlipped = true; // Ensure all marked face-down
            });
            isGamePlayable = true;
            isGameActive = false;
        }
    });

    // Fade and SLIDE UP title
    tl.to("#main-title", {
        opacity: 0,
        top: '-60px', // Move it further up off-screen relative to its CSS `top`
        duration: 0.7,
        ease: "power2.in", // Smooth disappearance
        pointerEvents: 'none'
    }, 0); // Start immediately

    // Fade out start button
    tl.to("#start-game-button", {
        opacity: 0,
        duration: 0.5,
        ease: "power1.in",
        pointerEvents: 'none'
    }, 0.1); // Start slightly after title


    // Animate each card
    cards.forEach((card, i) => {
        card.userData.isAnimating = true;
        const targetX = i * targetCardSpacingX + targetRowOffsetX;
        const targetY = targetYPosition;
        const targetZ = targetZPosition;
        const targetRotationY = Math.PI; // Face down

        // Use a slightly more dynamic ease like back.out
        const easeType = "back.out(1.2)"; // Subtle overshoot
        const duration = 1.2; // Slightly longer for smoother feel

        tl.to(card.position, {
            x: targetX,
            y: targetY,
            z: targetZ,
            duration: duration,
            ease: easeType
        }, 0.3 + i * 0.1) // Stagger start time more
        .to(card.rotation, {
            x: 0,
            y: targetRotationY,
            z: 0,
            duration: duration * 0.8, // Rotation slightly faster than position
            ease: easeType
        }, 0.3 + i * 0.1); // Start rotation with position
    });
}

// --- Add Event Listener for Start Button ---
if (startButton) {
    startButton.addEventListener('click', arrangeForGame);
} else {
    console.error("Start game button #start-game-button not found!");
}

// --- Add Event Listener for Refresh Button ---
if (refreshButton) {
    refreshButton.addEventListener('click', () => {
        console.log("Refresh button clicked - reloading page.");
        // Add a slight delay and fade out maybe? (Optional)
        document.body.style.transition = 'opacity 0.3s ease-out';
        document.body.style.opacity = 0;
        setTimeout(() => location.reload(), 300); // Reload after fade
    });
} else {
    console.error("Refresh button #refresh-button not found!");
}

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
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
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, initialYPosition, 0);
controls.minDistance = 3;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI / 2.05; // Allow slightly less looking down

// --- Animation Loop ---
const clock = new THREE.Clock();
function tick() {
    controls.update(); // Update controls every frame for damping

    // Render using composer if available, otherwise use renderer directly
    if (composer) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }

    window.requestAnimationFrame(tick); // Request next frame
}

// --- Start ---
tick(); // Start the animation loop
console.log("3D Card Scene Initialized. Loading Textures...");
console.warn("Check console for texture loading errors and card creation messages!");