import * as THREE from 'three';

export const playerState = {
    moveForward: false, moveBackward: false, moveLeft: false, moveRight: false,
    isSprinting: false, isSliding: false, isDiving: false,
    velocity: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    slideTimer: 0, diveTimer: 0,
    speed: 40.0, baseHeight: 1.6
};

let camera, renderer;
const euler = new THREE.Euler(0, 0, 0, 'YXZ');

export function setupMovement(cam, rend, scene) {
    camera = cam; renderer = rend;

    // Touch Look
    let touchStartX = 0, touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
        if (e.target.classList.contains('btn')) return;
        touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
    });
    document.addEventListener('touchmove', (e) => {
        if (e.target.classList.contains('btn')) return;
        const touchX = e.touches[0].clientX, touchY = e.touches[0].clientY;
        const deltaX = touchX - touchStartX, deltaY = touchY - touchStartY;
        if(!playerState.isDiving) {
            euler.y -= deltaX * 0.005; euler.x -= deltaY * 0.005;
            euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.x));
            camera.quaternion.setFromEuler(euler);
        }
        touchStartX = touchX; touchStartY = touchY;
    });

    // PC Mouse
    document.addEventListener('mousemove', (e) => {
        if (e.buttons !== 1 || playerState.isDiving) return; 
        euler.y -= e.movementX * 0.002; euler.x -= e.movementY * 0.002;
        euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.x));
        camera.quaternion.setFromEuler(euler);
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyW') playerState.moveForward = true;
        if (e.code === 'KeyS') playerState.moveBackward = true;
        if (e.code === 'KeyA') playerState.moveLeft = true;
        if (e.code === 'KeyD') playerState.moveRight = true;
        if (e.code === 'ShiftLeft') playerState.isSprinting = true;
        if (e.code === 'ControlLeft') playerState.isSliding = true;
        if (e.code === 'KeyZ') playerState.isDiving = true;
    });
    document.addEventListener('keyup', (e) => {
        if (e.code === 'KeyW') playerState.moveForward = false;
        if (e.code === 'KeyS') playerState.moveBackward = false;
        if (e.code === 'KeyA') playerState.moveLeft = false;
        if (e.code === 'KeyD') playerState.moveRight = false;
        if (e.code === 'ShiftLeft') playerState.isSprinting = false;
    });

    // UI Bindings
    const bind = (id, on, off) => {
        const btn = document.getElementById(id);
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); on(); });
        btn.addEventListener('mousedown', (e) => { e.preventDefault(); on(); });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); if(off) off(); });
        btn.addEventListener('mouseup', (e) => { e.preventDefault(); if(off) off(); });
    };
    bind('up-btn', () => playerState.moveForward = true, () => playerState.moveForward = false);
    bind('down-btn', () => playerState.moveBackward = true, () => playerState.moveBackward = false);
    bind('left-btn', () => playerState.moveLeft = true, () => playerState.moveLeft = false);
    bind('right-btn', () => playerState.moveRight = true, () => playerState.moveRight = false);
}

export function updateMovement(delta) {
    if(playerState.isDiving) {
        playerState.diveTimer += delta;
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.5, delta * 10);
        // Dive forward impulse
        camera.translateZ(-15 * delta); 
        if(playerState.diveTimer > 1.0) { // Get back up
            playerState.isDiving = false; playerState.diveTimer = 0;
        }
    } else if (playerState.isSliding) {
        playerState.slideTimer += delta;
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.8, delta * 10);
        if(playerState.slideTimer > 0.8) { // Slide ends
            playerState.isSliding = false; playerState.slideTimer = 0;
        }
    } else {
        // Idle/Walk/Run height
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, playerState.baseHeight, delta * 10);
    }

    // Movement Physics
    const speed = playerState.isSliding ? 60.0 : (playerState.isSprinting ? 50.0 : 30.0);
    playerState.velocity.x -= playerState.velocity.x * 10.0 * delta;
    playerState.velocity.z -= playerState.velocity.z * 10.0 * delta;

    playerState.direction.z = Number(playerState.moveForward) - Number(playerState.moveBackward);
    playerState.direction.x = Number(playerState.moveRight) - Number(playerState.moveLeft);
    playerState.direction.normalize();

    if (playerState.moveForward || playerState.moveBackward) playerState.velocity.z -= playerState.direction.z * speed * delta;
    if (playerState.moveLeft || playerState.moveRight) playerState.velocity.x -= playerState.direction.x * speed * delta;

    camera.translateX(-playerState.velocity.x * delta);
    camera.translateZ(playerState.velocity.z * delta);
}
