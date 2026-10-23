import * as THREE from 'three';

export const playerState = {
    moveForward: false, moveBackward: false, moveLeft: false, moveRight: false,
    isSprinting: false, isSliding: false, isDiving: false, lean: 0,
    velocity: new THREE.Vector3(), direction: new THREE.Vector3(),
    slideTimer: 0, diveTimer: 0, baseHeight: 1.6
};

let playerGroup, camera, renderer, playerBody;
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
let walkTimer = 0;

export function setupMovement(pGroup, cam, rend, scene) {
    playerGroup = pGroup; camera = cam; renderer = rend;

    // --- PLAYER BODY (Visible when looking down) ---
    playerBody = new THREE.Group();
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2a3b2c, roughness: 0.9 });
    const bootsMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
    
    // Legs
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), pantsMat);
    leftLeg.position.set(-0.15, -0.4, 0); // Relative to camera
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), pantsMat);
    rightLeg.position.set(0.15, -0.4, 0);

    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.15, 0.3), bootsMat);
    leftBoot.position.set(0, -0.85, -0.05);
    leftLeg.add(leftBoot);
    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.15, 0.3), bootsMat);
    rightBoot.position.set(0, -0.85, -0.05);
    rightLeg.add(rightBoot);

    playerBody.add(leftLeg, rightLeg);
    camera.add(playerBody); // Attach body to camera so it follows your eyes

    // --- TOUCH JOYSTICK ---
    const zone = document.getElementById('joystick-zone');
    const base = document.getElementById('joystick-base');
    const knob = document.getElementById('joystick-knob');
    let joyActive = false, joyStartX = 0, joyStartY = 0, maxDist = 40;

    zone.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        joyActive = true;
        joyStartX = touch.clientX; joyStartY = touch.clientY;
        base.style.display = 'block';
        base.style.left = (joyStartX - 60) + 'px';
        base.style.top = (joyStartY - 60) + 'px';
        knob.style.transform = `translate(-50%, -50%)`;
    });

    zone.addEventListener('touchmove', (e) => {
        if (!joyActive) return;
        const touch = e.touches[0];
        let dx = touch.clientX - joyStartX;
        let dy = touch.clientY - joyStartY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > maxDist) { dx = (dx / dist) * maxDist; dy = (dy / dist) * maxDist; }
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

        playerState.moveForward = dy < -15;
        playerState.moveBackward = dy > 15;
        playerState.moveLeft = dx < -15;
        playerState.moveRight = dx > 15;
        playerState.isSprinting = dist > 35;
    });

    zone.addEventListener('touchend', () => {
        joyActive = false; base.style.display = 'none';
        playerState.moveForward = playerState.moveBackward = playerState.moveLeft = playerState.moveRight = playerState.isSprinting = false;
    });

    // --- LOOK CONTROLS ---
    let touchStartX = 0, touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
        if (e.target.closest('#joystick-zone') || e.target.classList.contains('btn')) return;
        touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
    });
    document.addEventListener('touchmove', (e) => {
        if (e.target.closest('#joystick-zone') || e.target.classList.contains('btn') || playerState.isDiving) return;
        const touchX = e.touches[0].clientX, touchY = e.touches[0].clientY;
        const deltaX = touchX - touchStartX, deltaY = touchY - touchStartY;
        euler.y -= deltaX * 0.005; euler.x -= deltaY * 0.005;
        euler.x = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, euler.x));
        camera.quaternion.setFromEuler(euler);
        touchStartX = touchX; touchStartY = touchY;
    });
    document.addEventListener('mousemove', (e) => {
        if (e.buttons !== 1 || playerState.isDiving) return; 
        euler.y -= e.movementX * 0.002; euler.x -= e.movementY * 0.002;
        euler.x = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, euler.x));
        camera.quaternion.setFromEuler(euler);
    });

    // PC Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyW') playerState.moveForward = true;
        if (e.code === 'KeyS') playerState.moveBackward = true;
        if (e.code === 'KeyA') playerState.moveLeft = true;
        if (e.code === 'KeyD') playerState.moveRight = true;
        if (e.code === 'ShiftLeft') playerState.isSprinting = true;
        if (e.code === 'KeyQ') playerState.lean = -1;
        if (e.code === 'KeyE') playerState.lean = 1;
        if (e.code === 'ControlLeft') playerState.isSliding = true;
        if (e.code === 'KeyZ') playerState.isDiving = true;
    });
    document.addEventListener('keyup', (e) => {
        if (e.code === 'KeyW') playerState.moveForward = false;
        if (e.code === 'KeyS') playerState.moveBackward = false;
        if (e.code === 'KeyA') playerState.moveLeft = false;
        if (e.code === 'KeyD') playerState.moveRight = false;
        if (e.code === 'ShiftLeft') playerState.isSprinting = false;
        if (e.code === 'KeyQ' || e.code === 'KeyE') playerState.lean = 0;
    });
}

export function updateMovement(delta) {
    let targetHeight = playerState.baseHeight;
    
    // 1. Slide/Dive Animations
    if (playerState.isDiving) {
        playerState.diveTimer += delta;
        targetHeight = 0.4;
        // Dive forward and tilt camera down
        playerGroup.translateZ(-25 * delta); 
        euler.x = THREE.MathUtils.lerp(euler.x, -0.5, delta * 5);
        if (playerState.diveTimer > 1.2) { playerState.isDiving = false; playerState.diveTimer = 0; }
    } else if (playerState.isSliding) {
        playerState.slideTimer += delta;
        targetHeight = 0.7;
        // Tilt camera back slightly during slide
        euler.x = THREE.MathUtils.lerp(euler.x, 0.2, delta * 5);
        if (playerState.slideTimer > 0.8) { playerState.isSliding = false; playerState.slideTimer = 0; }
    } else {
        // Return pitch to normal if not diving/sliding
        euler.x = THREE.MathUtils.lerp(euler.x, 0, delta * 5);
    }

    // Smooth camera height (crouch/dive)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetHeight, delta * 10);
    camera.quaternion.setFromEuler(euler);

    // 2. Lean Mechanics (Shift camera left/right and tilt)
    const targetLeanX = playerState.lean * 0.4; // Move camera sideways
    const targetLeanZ = playerState.lean * -0.2; // Tilt camera (roll)
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetLeanX, delta * 10);
    camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, targetLeanZ, delta * 10);

    // 3. Walk/Run Leg Animations
    if (playerState.moveForward || playerState.moveBackward || playerState.moveLeft || playerState.moveRight) {
        walkTimer += delta * (playerState.isSprinting ? 15 : 10);
        const bobAmount = playerState.isSprinting ? 0.08 : 0.04;
        
        // Bob camera
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetHeight + Math.sin(walkTimer) * bobAmount, delta * 10);
        
        // Swing legs
        playerBody.children[0].rotation.x = Math.sin(walkTimer) * 0.5; // Left Leg
        playerBody.children[1].rotation.x = Math.sin(walkTimer + Math.PI) * 0.5; // Right Leg
    } else {
        // Idle
        playerBody.children[0].rotation.x = THREE.MathUtils.lerp(playerBody.children[0].rotation.x, 0, delta * 10);
        playerBody.children[1].rotation.x = THREE.MathUtils.lerp(playerBody.children[1].rotation.x, 0, delta * 10);
    }

    // 4. Physics Movement
    const currentSpeed = playerState.isSliding ? 70.0 : (playerState.isSprinting ? 50.0 : 30.0);
    playerState.velocity.x -= playerState.velocity.x * 10.0 * delta;
    playerState.velocity.z -= playerState.velocity.z * 10.0 * delta;

    playerState.direction.z = Number(playerState.moveForward) - Number(playerState.moveBackward);
    playerState.direction.x = Number(playerState.moveRight) - Number(playerState.moveLeft);
    playerState.direction.normalize();

    if (playerState.moveForward || playerState.moveBackward) playerState.velocity.z -= playerState.direction.z * currentSpeed * delta;
    if (playerState.moveLeft || playerState.moveRight) playerState.velocity.x -= playerState.direction.x * currentSpeed * delta;

    // Apply movement to the Player Group, not the Camera
    playerGroup.translateX(-playerState.velocity.x * delta);
    playerGroup.translateZ(playerState.velocity.z * delta);
}
