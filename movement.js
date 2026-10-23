import * as THREE from 'three';

export const playerState = {
    moveForward: false, moveBackward: false, moveLeft: false, moveRight: false,
    isSprinting: false, isSliding: false, isDiving: false,
    velocity: new THREE.Vector3(), direction: new THREE.Vector3(),
    slideTimer: 0, diveTimer: 0, speed: 45.0, baseHeight: 1.6
};

let camera, renderer;
let playerBody;
const euler = new THREE.Euler(0, 0, 0, 'YXZ');

export function setupMovement(cam, rend, scene) {
    camera = cam; renderer = rend;

    // --- PLAYER BODY ---
    playerBody = new THREE.Group();
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2a3b2c, roughness: 0.9 }); // Military green
    const bootsMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
    
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), pantsMat);
    leftLeg.position.set(-0.15, -0.9, -0.2);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), pantsMat);
    rightLeg.position.set(0.15, -0.9, -0.2);
    
    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.35), bootsMat);
    leftBoot.position.set(-0.15, -1.3, -0.25);
    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.35), bootsMat);
    rightBoot.position.set(0.15, -1.3, -0.25);

    playerBody.add(leftLeg, rightLeg, leftBoot, rightBoot);
    camera.add(playerBody);

    // --- TOUCH JOYSTICK ---
    const zone = document.getElementById('joystick-zone');
    const base = document.getElementById('joystick-base');
    const knob = document.getElementById('joystick-knob');
    let joyActive = false, joyStartX = 0, joyStartY = 0, maxDist = 40;

    zone.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        joyActive = true;
        joyStartX = touch.clientX;
        joyStartY = touch.clientY;
        base.style.display = 'block';
        base.style.left = (joyStartX - 60) + 'px';
        base.style.bottom = 'auto';
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

        // Map to movement
        playerState.moveForward = dy < -10;
        playerState.moveBackward = dy > 10;
        playerState.moveLeft = dx < -10;
        playerState.moveRight = dx > 10;
    });

    zone.addEventListener('touchend', () => {
        joyActive = false;
        base.style.display = 'none';
        playerState.moveForward = playerState.moveBackward = playerState.moveLeft = playerState.moveRight = false;
    });

    // --- PC CONTROLS ---
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

    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyW') playerState.moveForward = true;
        if (e.code === 'KeyS') playerState.moveBackward = true;
        if (e.code === 'KeyA') playerState.moveLeft = true;
        if (e.code === 'KeyD') playerState.moveRight = true;
        if (e.code === 'ControlLeft') playerState.isSliding = true;
        if (e.code === 'KeyZ') playerState.isDiving = true;
    });
    document.addEventListener('keyup', (e) => {
        if (e.code === 'KeyW') playerState.moveForward = false;
        if (e.code === 'KeyS') playerState.moveBackward = false;
        if (e.code === 'KeyA') playerState.moveLeft = false;
        if (e.code === 'KeyD') playerState.moveRight = false;
    });
}

export function updateMovement(delta) {
    // Height & Body Animation
    let targetHeight = playerState.baseHeight;
    if(playerState.isDiving) {
        playerState.diveTimer += delta;
        targetHeight = 0.4;
        camera.translateZ(-20 * delta); 
        if(playerState.diveTimer > 1.0) { playerState.isDiving = false; playerState.diveTimer = 0; }
    } else if (playerState.isSliding) {
        playerState.slideTimer += delta;
        targetHeight = 0.7;
        if(playerState.slideTimer > 0.8) { playerState.isSliding = false; playerState.slideTimer = 0; }
    }
    
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetHeight, delta * 10);
    
    // Animate legs if walking
    if (playerState.moveForward || playerState.moveBackward || playerState.moveLeft || playerState.moveRight) {
        const time = Date.now() * 0.01;
        playerBody.position.y = Math.sin(time) * 0.05;
        playerBody.rotation.z = Math.sin(time * 0.5) * 0.02;
    }

    // Physics
    const currentSpeed = playerState.isSliding ? 70.0 : 35.0;
    playerState.velocity.x -= playerState.velocity.x * 10.0 * delta;
    playerState.velocity.z -= playerState.velocity.z * 10.0 * delta;

    playerState.direction.z = Number(playerState.moveForward) - Number(playerState.moveBackward);
    playerState.direction.x = Number(playerState.moveRight) - Number(playerState.moveLeft);
    playerState.direction.normalize();

    if (playerState.moveForward || playerState.moveBackward) playerState.velocity.z -= playerState.direction.z * currentSpeed * delta;
    if (playerState.moveLeft || playerState.moveRight) playerState.velocity.x -= playerState.direction.x * currentSpeed * delta;

    camera.translateX(-playerState.velocity.x * delta);
    camera.translateZ(playerState.velocity.z * delta);
}
