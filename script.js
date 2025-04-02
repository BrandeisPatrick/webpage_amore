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
// *** MODIFICATION 1: Uncomment and use the default message ***
const defaultMessage = "You are amazing"; // Default message to show if no specific message is found

// --- Get References to UI Elements ---
const textDisplayElement = document.getElementById('card-text-display');
if (!textDisplayElement) { console.error("Text display element #card-text-display not found!"); }
const startButton = document.getElementById('start-game-button');
const refreshButton = document.getElementById('refresh-button');


// --- Basic Setup ---
const canvas = document.getElementById('webgl-canvas'); if (!canvas) console.error("Canvas element #webgl-canvas not found!");
const scene = new THREE.Scene(); scene.background = new THREE.Color('#111111');
const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100); camera.position.set(0, 1.5, 9); scene.add(camera);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.useLegacyLights = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding; // Correct property name
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- Lighting ---
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8); scene.add(hemisphereLight);
const keyLight = new THREE.DirectionalLight(0xffffff, 1.5); keyLight.position.set(3, 4, 3); keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 1024; keyLight.shadow.mapSize.height = 1024; keyLight.shadow.camera.near = 0.5; keyLight.shadow.camera.far = 20; keyLight.shadow.bias = -0.002; scene.add(keyLight);

// --- Post-Processing ---
let composer;
function setupPostProcessing() {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.4, 0.8); // Adjust bloom if needed
    composer.addPass(bloomPass);
    composer.setSize(sizes.width, sizes.height);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
setupPostProcessing();

// --- Card Settings ---
const numberOfCards = 6;
const cardWidth = 1.5;
const imageAspectRatio = 1.4; // Aspect ratio of the CARD FACE (Height / Width)
const cardHeight = cardWidth * imageAspectRatio;
const cardThickness = 0.05;
const cardGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardThickness);
const cards = [];

// --- Card Materials ---
const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xB08D57, roughness: 0.4, metalness: 0.7 }); // Golden edge
const cardBackColor = '#1A1A1A'; // Dark background for back
const cardFrontColor = '#ADD8E6'; // Light Blue background for front canvas behind image
const cardBorderColor = '#B08D57'; // Golden border color

// --- Function to Generate Card Back Texture ---
function createGeneratedCardBackTexture() {
    const canvasWidth = 256; const canvasHeight = Math.floor(canvasWidth * imageAspectRatio); const canvas = document.createElement('canvas'); canvas.width = canvasWidth; canvas.height = canvasHeight; const ctx = canvas.getContext('2d');
    ctx.fillStyle = cardBackColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    const borderThickness = canvasWidth * 0.05; ctx.strokeStyle = cardBorderColor; ctx.lineWidth = borderThickness; ctx.strokeRect(borderThickness / 2, borderThickness / 2, canvasWidth - borderThickness, canvasHeight - borderThickness); const texture = new THREE.CanvasTexture(canvas); texture.needsUpdate = true; return texture;
}

// --- Function to Generate Front Card Texture (Image + Border) ---
function createFrontCardTexture(imagePath, callback) {
    const canvasTextureWidth = 512; // Resolution for the texture canvas
    const canvasTextureHeight = Math.floor(canvasTextureWidth * imageAspectRatio);
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = canvasTextureWidth;
    textureCanvas.height = canvasTextureHeight;
    const ctx = textureCanvas.getContext('2d');
    const borderThickness = canvasTextureWidth * 0.035;

    ctx.fillStyle = cardFrontColor;
    ctx.fillRect(0, 0, canvasTextureWidth, canvasTextureHeight);

    const img = new Image();
    img.crossOrigin = "Anonymous"; // Important for loading from potentially different origins if needed
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
        finalTexture.colorSpace = THREE.SRGBColorSpace; // Use correct color space
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
        callback(errorTexture); // Provide an error texture
    };
    img.src = imagePath;
}

// --- Static Initial Layout Settings ---
const initialLayoutRadius = 4.0;
const initialLayoutAngle = Math.PI / 1.8;
const initialYPosition = 0; // Set cards initially at Y=0

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
        const imagePath = `images/${filename}`; // Assuming images are in an 'images' subfolder
        console.log(`Requesting front texture generation for: ${imagePath}`);
        createFrontCardTexture(imagePath, (frontTexture) => {
            console.log(`Front texture created for: ${filename}`);
            const backMaterial = new THREE.MeshStandardMaterial({ map: cardBackTexture, roughness: 0.7, metalness: 0.1 });
            const frontMaterial = new THREE.MeshStandardMaterial({ map: frontTexture, roughness: 0.85, metalness: 0.05 });
            const materials = [ edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial, frontMaterial, backMaterial ];
            const cardMesh = new THREE.Mesh(cardGeometry, materials);
            cardMesh.castShadow = true; cardMesh.receiveShadow = true;

            // Calculate initial position in arc
            const fraction = numberOfCards <= 1 ? 0.5 : i / (numberOfCards - 1);
            const currentAngle = (fraction - 0.5) * initialLayoutAngle;
            const xPos = initialLayoutRadius * Math.sin(currentAngle);
            const zPos = initialLayoutRadius * Math.cos(currentAngle) - initialLayoutRadius;
            cardMesh.position.set(xPos, initialYPosition, zPos);
            cardMesh.rotation.y = -currentAngle + Math.PI; // Start face down towards center

            cardMesh.userData = { id: i, filename: filename, isFlipped: true, isAnimating: false }; // isFlipped=true means BACK showing
            scene.add(cardMesh);
            cards.push(cardMesh);

            cardsCreated++;
            if (cardsCreated === numberOfCards) {
                console.log(`All ${numberOfCards} card meshes created and added to scene.`);
                // Consider enabling start button here if it was disabled
            }
        });
    });
} else {
     console.error("Card selection failed, cannot create cards.");
     // Disable start button or show error message
}

// --- Ground Plane ---
const groundGeometry = new THREE.PlaneGeometry(30, 30);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9, metalness: 0.1 });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = initialYPosition - cardHeight / 2 - 0.1; // Position relative to cards
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// --- Raycasting & Interaction ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let currentlyHovered = null;
let isGamePlayable = false; // Controls if cards can be clicked
let isGameActive = false;   // Prevents starting game arrangement multiple times

function updateMouseCoords(event) {
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = - (event.clientY / sizes.height) * 2 + 1;
}

// --- Event Listeners (mousemove, click) ---
window.addEventListener('mousemove', (event) => {
    if (!isGamePlayable) {
        // If game not playable, ensure no lingering hover effects
        if (currentlyHovered && !currentlyHovered.userData.isAnimating) {
             gsap.to(currentlyHovered.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "power1.out" });
             gsap.to(currentlyHovered.position, { y: initialYPosition, duration: 0.3, ease: "power1.out" }); // Use initialYPosition
             currentlyHovered = null;
        }
        return; // Don't process hover if game not playable
    }

    updateMouseCoords(event);
    raycaster.setFromCamera(mouse, camera);
    const intersects = cards.length > 0 ? raycaster.intersectObjects(cards) : [];
    const targetYPosition = initialYPosition; // Base Y position

    // Check if mouse moved OFF the previously hovered card
    if (currentlyHovered && (intersects.length === 0 || intersects[0].object !== currentlyHovered)) {
        if (!currentlyHovered.userData.isAnimating) {
            gsap.to(currentlyHovered.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "power1.out" });
            gsap.to(currentlyHovered.position, { y: targetYPosition, duration: 0.3, ease: "power1.out" }); // Return to base Y
        }
        currentlyHovered = null;
    }

    // Check if mouse moved ONTO a new card
    if (intersects.length > 0 && intersects[0].object !== currentlyHovered) {
        // De-hover the previous one if it exists (though the check above should handle it)
        if (currentlyHovered && !currentlyHovered.userData.isAnimating) {
            gsap.to(currentlyHovered.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "power1.out" });
            gsap.to(currentlyHovered.position, { y: targetYPosition, duration: 0.3, ease: "power1.out" });
        }
        // Hover the new one
        currentlyHovered = intersects[0].object;
        if (!currentlyHovered.userData.isAnimating) {
            gsap.to(currentlyHovered.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 0.3, ease: "power1.out" });
            gsap.to(currentlyHovered.position, { y: targetYPosition + 0.2, duration: 0.3, ease: "power1.out" }); // Lift slightly
        }
    }
});

window.addEventListener('click', () => {
    if (!isGamePlayable || !currentlyHovered || currentlyHovered.userData.isAnimating) {
        return; // Only allow clicks if game is playable, a card is hovered, and it's not animating
    }
    console.log(`Click Trigger: Flipping card ${currentlyHovered.userData.id} (${currentlyHovered.userData.filename})`);
    flipCard(currentlyHovered);
});

// --- Card Flip Logic (Modified for Default Text Display) ---
function flipCard(card) {
    const filename = card.userData.filename; // Get filename early
    console.log(`--- flipCard START ---`);
    console.log(`Clicked card filename: '${filename}' (Type: ${typeof filename})`);

    // *** MODIFICATION 2: Check for specific message and use default if not found ***
    const hasSpecificMessage = cardMessages.hasOwnProperty(filename);
    const messageToDisplay = hasSpecificMessage ? cardMessages[filename] : defaultMessage; // Use default message if no specific one
    console.log(`Does cardMessages have key '${filename}'? : ${hasSpecificMessage}`);
    console.log(`Message to display: "${messageToDisplay}"`);

    // --- Check for re-clicking face-up card ---
    // If isFlipped is false, it means the FRONT (image) is already showing
    if (!card.userData.isFlipped) {
        console.log(`Card '${filename}' is already face-up. Re-evaluating display.`);
        if (textDisplayElement) {
            console.log(`Updating text display for face-up card.`);
            textDisplayElement.textContent = messageToDisplay; // Show specific message OR default
            // *** MODIFICATION 3: Always fade in text on re-click (to show default or specific) ***
            gsap.to(textDisplayElement, { opacity: 1, duration: 0.3 }); // Always ensure it's visible
        } else {
            console.error("textDisplayElement missing when trying to update face-up card!");
        }
        console.log(`--- flipCard END (face-up card) ---`);
        return; // Exit function
    }
    // --- End re-click check ---

    if (card.userData.isAnimating) {
        console.log(`Card '${filename}' is already animating. Ignoring click.`);
        console.log(`--- flipCard END (isAnimating) ---`);
        return;
    }
    card.userData.isAnimating = true;
    console.log(`Card '${filename}' starting animation. Setting isAnimating=true.`);

    // Hide current text display immediately before flipping BACK to FRONT
    if (textDisplayElement) {
        console.log(`Fading out text display before flip animation.`);
        gsap.to(textDisplayElement, { opacity: 0, duration: 0.2 });
    } else {
        console.error("textDisplayElement missing before flip animation!");
    }

    const targetRotationY = 0; // Rotate to face forward
    const duration = 0.8;
    const targetYPosition = initialYPosition; // Ensure it flips at the base Y level

    // Animate scale/position back to normal before flip if needed (hover effect)
    gsap.to(card.scale, { x: 1, y: 1, z: 1, duration: 0.2, ease: "power1.in" });
    gsap.to(card.position, { y: targetYPosition, duration: 0.2, ease: "power1.in" });

    console.log(`Starting main flip rotation animation for '${filename}'. Target Y: ${targetRotationY}`);
    gsap.to(card.rotation, {
        y: targetRotationY,
        duration: duration,
        ease: "power3.inOut",
        onComplete: () => {
            console.log(`--- flipCard onComplete START for '${filename}' ---`);
            card.userData.isFlipped = false; // Mark as face-up (FRONT showing)
            card.userData.isAnimating = false;
            console.log(`Set isFlipped=false, isAnimating=false`);

            // --- Show Text On Complete ---
            console.log(`[onComplete] Checking textDisplayElement...`);
            if (textDisplayElement) {
                console.log(`[onComplete] textDisplayElement found.`);
                textDisplayElement.textContent = messageToDisplay; // Set content to specific or default message
                console.log(`[onComplete] Set textContent to: '${textDisplayElement.textContent}'`);
                // *** MODIFICATION 4: Always fade in the text display after flip ***
                console.log(`[onComplete] Fading text display opacity to: 1`);
                gsap.to(textDisplayElement, {
                    opacity: 1, // Always fade to opacity 1
                    duration: 0.5,
                    onComplete: () => { // Optional log
                        console.log(`[onComplete] Text fade animation complete. Final opacity should be ~1`);
                    }
                   });
            } else {
                console.error("[onComplete] textDisplayElement NOT FOUND!");
            }
            // --- End Show Text Logic ---

            handleHoverAfterAnimation(card); // Re-apply hover effect if mouse is still over
            console.log(`--- flipCard onComplete END for '${filename}' ---`);
        }
    });
     console.log(`--- flipCard END (main logic initiated) ---`);
}


// --- Handle Hover After Animation ---
function handleHoverAfterAnimation(card) {
    // Check if the mouse is currently over the card after animation finishes
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([card]); // Check only this card
    const targetYPosition = initialYPosition;

    if (intersects.length > 0) {
        // Mouse is still over the card, re-apply hover effect
        console.log(`[handleHoverAfterAnimation] Mouse still over ${card.userData.filename}, re-applying hover.`);
        currentlyHovered = card; // Ensure it's marked as hovered
        if (!currentlyHovered.userData.isAnimating) { // Double check it's not animating
            gsap.to(currentlyHovered.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 0.3, ease: "power1.out" });
            gsap.to(currentlyHovered.position, { y: targetYPosition + 0.2, duration: 0.3, ease: "power1.out" });
        }
    } else if (currentlyHovered === card) {
        // Mouse moved away while card was flipping/animating
         console.log(`[handleHoverAfterAnimation] Mouse no longer over ${card.userData.filename}.`);
        currentlyHovered = null; // Clear hover state if mouse isn't over it
        // Scale/position should already be reset before flip, so no need to animate back here
    }
}

// --- Function to Arrange Cards for Game ---
function arrangeForGame() {
    if (isGameActive) return; // Prevent multiple calls
    if (cards.length !== numberOfCards) {
        console.warn("Cannot arrange for game, cards not fully created yet. Wait.");
        const btn = document.getElementById('start-game-button');
        if(btn) { btn.textContent = "Loading..."; btn.disabled = true; }
        // Set timeout to re-enable button - better approach would be Promise/callback on card creation
        setTimeout(() => {
            if(btn && btn.textContent === "Loading...") { // Check if still loading
                 btn.textContent = "Start Game";
                 btn.disabled = false;
                 console.warn("Re-enabled start button after delay. Card loading might still be ongoing.");
            }
        }, 2000); // Increased delay
        return;
    }

    // Ensure button text/state is correct if loading finished quickly
    const btn = document.getElementById('start-game-button');
    if(btn && btn.textContent === "Loading...") {
        btn.textContent = "Start Game"; btn.disabled = false;
    }

    console.log("ArrangeForGame: Starting animation sequence.");
    isGameActive = true; // Mark arranging as active
    isGamePlayable = false; // Disable clicks during arrangement

    // Hide text display when game starts arranging
    if (textDisplayElement) {
         gsap.to(textDisplayElement, { opacity: 0, duration: 0.3 });
    }

    const targetCardSpacingX = cardWidth * 1.25;
    const targetRowWidth = (numberOfCards - 1) * targetCardSpacingX;
    const targetRowOffsetX = -targetRowWidth / 2;
    const targetYPosition = initialYPosition; // Arrange at base Y level
    const targetZPosition = 1.5; // Bring cards forward

    const tl = gsap.timeline({
        onComplete: () => {
            console.log("ArrangeForGame Timeline COMPLETE. Gameplay enabled.");
            cards.forEach(card => {
                card.userData.isAnimating = false;
                card.userData.isFlipped = true; // Ensure all cards are marked as face-down
            });
            isGamePlayable = true; // Enable card clicks
            isGameActive = false;  // Mark arranging as finished
        }
    });

    // Fade out title and start button
    tl.to("#main-title", { opacity: 0, duration: 0.5, pointerEvents: 'none' }, 0); // Disable pointer events too
    tl.to("#start-game-button", { opacity: 0, duration: 0.5, pointerEvents: 'none' }, 0);
    // Note: Refresh button remains visible

    // Animate each card
    cards.forEach((card, i) => {
        card.userData.isAnimating = true; // Mark card as animating
        const targetX = i * targetCardSpacingX + targetRowOffsetX;
        const targetY = targetYPosition; // Target Y
        const targetZ = targetZPosition; // Target Z
        const targetRotationY = Math.PI; // Ensure they end face down (Math.PI rotation)

        // Add animations to the timeline
        tl.to(card.position, {
              x: targetX,
              y: targetY,
              z: targetZ,
              duration: 1.0,
              ease: "power2.inOut"
          }, 0.2 + i * 0.08) // Stagger start time slightly
          .to(card.rotation, {
              x: 0, // Ensure no x rotation
              y: targetRotationY,
              z: 0, // Ensure no z rotation
              duration: 0.8,
              ease: "power2.inOut"
          }, 0.3 + i * 0.08); // Stagger start time slightly
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
        location.reload(); // Reloads the current page
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
controls.target.set(0, initialYPosition, 0); // Target the base Y position
controls.minDistance = 3;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI / 2.0; // Prevent going below ground slightly more strictly

// --- Animation Loop ---
const clock = new THREE.Clock();
function tick() {
    controls.update(); // Update controls every frame

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