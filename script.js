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
// ***** Using the list you provided previously *****
const availableImageFiles = [
    "1.jpg", "10.jpg", "11.jpg", "12.jpg", "13.jpg", "14.jpg", "15.jpg",
    "17.jpg", "21.jpg", "22.jpg", "23.jpg", "24.jpg", "25.jpg", "26.jpg",
    "27.jpg", "28.jpg", "29.jpg", "3.jpg",  "30.jpg", "31.jpg", "32.jpg",
    "33.jpg", "35.jpg", "36.jpg", "37.jpg", "38.jpg", "4.jpg",  "40.jpg",
    "41.jpg", "42.jpg", "43.jpg", "44.JPEG","45.JPEG","46.JPEG","47.JPEG",
    "6.jpg",  "9.jpg"
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
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.4, 0.8); // Adjust bloom if needed
    composer.addPass(bloomPass);
    composer.setSize(sizes.width, sizes.height);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
setupPostProcessing();

// --- Card Settings ---
const numberOfCards = 6; const cardWidth = 1.5; const imageAspectRatio = 1.4; // Aspect ratio of the CARD FACE (Height / Width)
const cardHeight = cardWidth * imageAspectRatio; const cardThickness = 0.05; const cardGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardThickness); const cards = [];

// --- Card Materials ---
const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xB08D57, roughness: 0.4, metalness: 0.7 }); // Golden edge
const cardBackColor = '#1A1A1A'; // Dark background for back
const cardFrontColor = '#ADD8E6'; // Light Blue background for front canvas behind image // <<< UPDATED COLOR
const cardBorderColor = '#B08D57'; // Golden border color

// --- Function to Generate Card Back Texture ---
function createGeneratedCardBackTexture() {
    const canvasWidth = 256; const canvasHeight = Math.floor(canvasWidth * imageAspectRatio); const canvas = document.createElement('canvas'); canvas.width = canvasWidth; canvas.height = canvasHeight; const ctx = canvas.getContext('2d');
    // Background Color
    ctx.fillStyle = cardBackColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    // Border
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

    const borderThickness = canvasTextureWidth * 0.035; // Adjust border thickness relative to canvas size

    // 1. Draw Background Color for the front face
    ctx.fillStyle = cardFrontColor; // Uses the updated light blue color
    ctx.fillRect(0, 0, canvasTextureWidth, canvasTextureHeight);

    // 2. Load the actual image
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Important if loading from different domains or potentially data URLs
    img.onload = () => {
        // 3. Calculate drawing dimensions to center and preserve aspect ratio
        const imgAspectRatio = img.naturalHeight / img.naturalWidth;
        const canvasAspectRatio = canvasTextureHeight / canvasTextureWidth; // Same as imageAspectRatio setting

        let drawWidth, drawHeight, drawX, drawY;
        const padding = borderThickness * 1.5; // Add padding between image and border

        // Calculate available drawing area inside padding
        const availableWidth = canvasTextureWidth - 2 * padding;
        const availableHeight = canvasTextureHeight - 2 * padding;

        if (imgAspectRatio > canvasAspectRatio) {
            // Image is taller/thinner than canvas area
            drawHeight = availableHeight;
            drawWidth = drawHeight / imgAspectRatio;
            drawX = padding + (availableWidth - drawWidth) / 2;
            drawY = padding;
        } else {
            // Image is wider/shorter than canvas area (or same ratio)
            drawWidth = availableWidth;
            drawHeight = drawWidth * imgAspectRatio;
            drawX = padding;
            drawY = padding + (availableHeight - drawHeight) / 2;
        }

        // 4. Draw the loaded image centered onto the canvas
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        // 5. Draw the Golden Border (around the padding area)
        ctx.strokeStyle = cardBorderColor;
        ctx.lineWidth = borderThickness;
        // Draw border slightly inside the edge
        ctx.strokeRect(
            borderThickness / 2,
            borderThickness / 2,
            canvasTextureWidth - borderThickness,
            canvasTextureHeight - borderThickness
        );

        // 6. Create the final texture and call the callback
        const finalTexture = new THREE.CanvasTexture(textureCanvas);
        finalTexture.colorSpace = THREE.SRGBColorSpace; // Important for color correctness
        finalTexture.needsUpdate = true;
        callback(finalTexture); // Pass the generated texture back
    };
    img.onerror = (error) => {
        console.error(`Error loading image for front texture: '${imagePath}'`, error);
        // Optionally: Create a fallback texture (e.g., solid color or error message)
        // For now, we'll just log the error and the card front might be blank/black
        // Create a simple fallback texture
         ctx.fillStyle = 'red';
         ctx.fillRect(0, 0, canvasTextureWidth, canvasTextureHeight);
         ctx.font = "20px Arial";
         ctx.fillStyle = "white";
         ctx.textAlign = "center";
         ctx.fillText("Error", canvasTextureWidth / 2, canvasTextureHeight / 2);
         const errorTexture = new THREE.CanvasTexture(textureCanvas);
         errorTexture.needsUpdate = true;
         callback(errorTexture); // Pass the error texture back
    };
    img.src = imagePath; // Start loading the image
}


// --- Static Initial Layout Settings ---
const initialLayoutRadius = 4.0; // How far cards are from the center
const initialLayoutAngle = Math.PI / 1.8; // Total angle spread (~100 degrees)
const initialYPosition = 0; // Vertical position

// --- Texture Loading & Card Creation ---
const textureLoader = new THREE.TextureLoader(); // Keep for potential other uses, though back is generated now
const cardBackTexture = createGeneratedCardBackTexture();

// --- Select Unique Images ---
const uniqueImageFiles = [...new Set(availableImageFiles)];
if (uniqueImageFiles.length < numberOfCards) {
    console.error(`Error: Need at least ${numberOfCards} unique images listed in availableImageFiles, found only ${uniqueImageFiles.length}.`);
    document.body.innerHTML = `<h1 style="color: red;">Error: Not enough unique images listed in script.js...</h1>`;
    throw new Error(`Insufficient unique images listed.`);
}
const shuffledUniqueFiles = shuffleArray(uniqueImageFiles);
const selectedImageFiles = shuffledUniqueFiles.slice(0, numberOfCards);
console.log("Selected unique images:", selectedImageFiles);

// --- Create Cards ---
let cardsCreated = 0; // Counter for async creation
if (selectedImageFiles.length === numberOfCards) {
    selectedImageFiles.forEach((filename, i) => {
        const imagePath = `images/${filename}`;
        console.log(`Requesting front texture generation for: ${imagePath}`);

        // *** Use the new function to create front texture ***
        createFrontCardTexture(imagePath, (frontTexture) => {
            // This code runs *after* the image is loaded and canvas texture is ready
             console.log(`Front texture created for: ${filename}`);

            const backMaterial = new THREE.MeshStandardMaterial({
                map: cardBackTexture,
                roughness: 0.7,
                metalness: 0.1
            });
            const frontMaterial = new THREE.MeshStandardMaterial({
                map: frontTexture, // Use the generated canvas texture
                roughness: 0.85, // Adjust as needed
                metalness: 0.05   // Adjust as needed
            });
            const materials = [
                edgeMaterial,  // right edge (+x)
                edgeMaterial,  // left edge (-x)
                edgeMaterial,  // top edge (+y)
                edgeMaterial,  // bottom edge (-y)
                frontMaterial, // front face (+z)
                backMaterial   // back face (-z)
            ];
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
            scene.add(cardMesh);
            cards.push(cardMesh); // Add card to the array

            cardsCreated++;
            if (cardsCreated === numberOfCards) {
                 console.log(`All ${numberOfCards} cards created and added to scene.`);
                 // Now it's safer to assume cards are ready for interaction logic setup,
                 // though the `tick` loop might have already started.
            }
        });
    });
} else {
     console.error("Card selection failed, cannot create cards.");
}


// --- Ground Plane ---
const groundGeometry = new THREE.PlaneGeometry(30, 30); const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9, metalness: 0.1 }); const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial); groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = initialYPosition - cardHeight / 2 - 0.1; // Position relative to initial Y
groundMesh.receiveShadow = true; scene.add(groundMesh);

// --- Raycasting & Interaction ---
const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2(); let currentlyHovered = null;
let isGamePlayable = false; let isGameActive = false; // isGameActive flags the transition animation
function updateMouseCoords(event) { mouse.x = (event.clientX / sizes.width) * 2 - 1; mouse.y = - (event.clientY / sizes.height) * 2 + 1; }

// --- Event Listeners (mousemove, click) --- //
window.addEventListener('mousemove', (event) => {
    if (!isGamePlayable) {
         if (currentlyHovered && !currentlyHovered.userData.isAnimating) {
             gsap.to(currentlyHovered.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "power1.out" });
             gsap.to(currentlyHovered.position, { y: 0, duration: 0.3, ease: "power1.out" }); // Game row Y=0
             currentlyHovered = null;
         }
        return;
    }

    updateMouseCoords(event);
    raycaster.setFromCamera(mouse, camera);
    // Make sure cards array is populated before intersecting
    const intersects = cards.length > 0 ? raycaster.intersectObjects(cards) : [];
    const targetYPosition = 0;

    if (currentlyHovered && (intersects.length === 0 || intersects[0].object !== currentlyHovered)) {
        if (!currentlyHovered.userData.isAnimating) {
            gsap.to(currentlyHovered.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "power1.out" });
            gsap.to(currentlyHovered.position, { y: targetYPosition, duration: 0.3, ease: "power1.out" });
        }
        currentlyHovered = null;
    }
    if (intersects.length > 0 && intersects[0].object !== currentlyHovered) {
        if (currentlyHovered && !currentlyHovered.userData.isAnimating) {
            gsap.to(currentlyHovered.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "power1.out" });
            gsap.to(currentlyHovered.position, { y: targetYPosition, duration: 0.3, ease: "power1.out" });
        }
        currentlyHovered = intersects[0].object;
        if (!currentlyHovered.userData.isAnimating) {
            gsap.to(currentlyHovered.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 0.3, ease: "power1.out" });
            gsap.to(currentlyHovered.position, { y: targetYPosition + 0.2, duration: 0.3, ease: "power1.out" });
        }
    }
});


window.addEventListener('click', () => {
    // Logging before the check
    // console.log(`Click Check: isGamePlayable=${isGamePlayable}, currentlyHovered=${currentlyHovered ? currentlyHovered.userData.id : null}, isAnimating=${currentlyHovered ? currentlyHovered.userData.isAnimating : 'N/A'}`);

    if (!isGamePlayable || !currentlyHovered || currentlyHovered.userData.isAnimating) {
        return;
    }
    // Logging before calling flipCard
     console.log(`Click Trigger: Flipping card ${currentlyHovered.userData.id}`);
    flipCard(currentlyHovered);
});

// --- Card Flip Logic --- //
function flipCard(card) {
    console.log(`FlipCard ENTERED for card ${card.userData.id}, isFlipped=${card.userData.isFlipped}`);

    if (!card.userData.isFlipped) {
         console.log(`FlipCard RETURN EARLY: Card ${card.userData.id} is already face up.`);
        return;
    }

    if (card.userData.isAnimating) {
         console.log(`FlipCard RETURN EARLY: Card ${card.userData.id} is already animating.`);
        return;
    }
    card.userData.isAnimating = true;

    const targetRotationY = 0; // Target face-up rotation
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


// --- Function to Arrange Cards for Game --- //
function arrangeForGame() {
    if (isGameActive) return; // Prevent triggering during animation
    // Add a check to ensure cards are loaded before arranging
    if (cards.length !== numberOfCards) {
         console.warn("Cannot arrange for game, cards not fully created yet. Please wait.");
         // Maybe disable button temporarily or provide feedback like changing button text
         const btn = document.getElementById('start-game-button');
         if(btn) {
            btn.textContent = "Loading..."; // Indicate loading state
            // Optionally re-enable/reset text later when cardsCreated === numberOfCards
         }
        return;
    }

     // If button text was changed, reset it
     const btn = document.getElementById('start-game-button');
     if(btn && btn.textContent === "Loading...") {
         btn.textContent = "Start Game"; // Or whatever original text was
     }


    console.log("arrangeForGame: Starting animation sequence.");
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
controls.target.set(0, initialYPosition, 0); // Target the center of the initial layout
controls.minDistance = 3; controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI / 2.0; // Prevent looking from below ground

// --- Animation Loop ---
const clock = new THREE.Clock();
function tick() {
    controls.update(); // Update orbit controls

    // Render scene using composer if available
    if (composer) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }

    window.requestAnimationFrame(tick); // Request next frame
}

// --- Start ---
// We start the tick loop immediately. Card creation is asynchronous.
// Interaction logic (hover, click, arrange) should be robust enough
// to handle the cards array being populated gradually.
tick();
console.log("3D Card Scene Initialized. Loading Textures...");
console.warn("Check console for texture loading errors!");
// Note: The check for 'selectedImageFiles.length === numberOfCards' happens before async creation starts.
// The actual 'cards.length === numberOfCards' check is now inside arrangeForGame.