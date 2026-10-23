import * as THREE from 'three';

let hostageMesh;
let isGrabbed = false;
let cameraRef;

export function setupHostage(scene, camera) {
    cameraRef = camera;
    
    // Make a basic "human" shape out of boxes
    hostageMesh = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xccaa88 });
    const clothesMat = new THREE.MeshStandardMaterial({ color: 0x334455 });
    
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.3), clothesMat);
    torso.position.y = 1.0;
    
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), bodyMat);
    head.position.y = 1.6;
    
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.3), clothesMat);
    legs.position.y = 0.4;

    hostageMesh.add(torso); hostageMesh.add(head); hostageMesh.add(legs);
    hostageMesh.position.set(0, 0, -5); // Spawn in front of player
    scene.add(hostageMesh);
}

export function toggleGrab() {
    // 1. Calculate distance between player and hostage
    const distance = cameraRef.position.distanceTo(hostageMesh.position);
    
    if (!isGrabbed && distance < 4) {
        isGrabbed = true;
        // Play "grab" animation
        hostageMesh.rotation.x = -Math.PI / 2; // Tilt them sideways
    } else if (isGrabbed) {
        isGrabbed = false;
        // Release and drop
        hostageMesh.rotation.x = 0; 
        hostageMesh.position.y = 0;
        // Push them slightly forward so they drop
        const dir = new THREE.Vector3();
        cameraRef.getWorldDirection(dir);
        hostageMesh.position.add(dir.multiplyScalar(2));
    }
}

export function updateHostage(delta) {
    if (isGrabbed) {
        // Move hostage in front of camera
        const targetPos = new THREE.Vector3(0, -0.2, -1.5); // Relative to camera
        targetPos.applyMatrix4(cameraRef.matrixWorld);
        
        // Smoothly lerp them into position
        hostageMesh.position.lerp(targetPos, delta * 15);
        
        // Match camera rotation
        hostageMesh.quaternion.slerp(cameraRef.quaternion, delta * 15);
        
        // Make them struggle a bit
        const time = Date.now() * 0.01;
        hostageMesh.rotation.z = Math.sin(time) * 0.1;
    } else {
        // Idle breathing if not grabbed
        const time = Date.now() * 0.002;
        hostageMesh.position.y = Math.sin(time) * 0.05;
    }
}
