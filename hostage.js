import * as THREE from 'three';

let hostageGroup;
let hostageModel;
let isGrabbed = false;
let cameraRef;

export function setupHostage(scene, camera) {
    cameraRef = camera;
    
    // The group handles positioning
    hostageGroup = new THREE.Group();
    
    // The model handles orientation
    hostageModel = new THREE.Group();
    
    // --- REALISTIC-ISH BODY MODEL ---
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.6 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.9 }); // Dark blue shirt
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }); // Black pants

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.25), shirtMat);
    torso.position.y = 0.3;
    
    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 0.25), skinMat);
    head.position.y = 0.85;
    
    // Arms (Hanging down)
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.15), shirtMat);
    leftArm.position.set(-0.35, 0.25, 0);
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.15), shirtMat);
    rightArm.position.set(0.35, 0.25, 0);

    // Legs
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), pantsMat);
    leftLeg.position.set(-0.15, -0.4, 0);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), pantsMat);
    rightLeg.position.set(0.15, -0.4, 0);

    hostageModel.add(torso, head, leftArm, rightArm, leftLeg, rightLeg);
    hostageGroup.add(hostageModel);
    
    // Spawn in world
    hostageGroup.position.set(0, 0, -4); 
    scene.add(hostageGroup);
}

export function toggleGrab() {
    const distance = cameraRef.position.distanceTo(hostageGroup.position);
    
    if (!isGrabbed && distance < 4) {
        isGrabbed = true;
        // Rotate the MODEL 90 degrees so he becomes horizontal (Body Shield)
        // -Math.PI / 2 makes him face left, parallel to the camera
        hostageModel.rotation.set(0, 0, Math.PI / 2); 
        hostageModel.position.set(0, 0, 0);
    } else if (isGrabbed) {
        isGrabbed = false;
        // Drop him
        hostageModel.rotation.set(0, 0, 0); 
        hostageGroup.position.y = 0;
        const dir = new THREE.Vector3();
        cameraRef.getWorldDirection(dir);
        hostageGroup.position.add(dir.multiplyScalar(1.5)); // Drop forward
    }
}

export function updateHostage(delta) {
    if (isGrabbed) {
        // Calculate position in front of the camera
        const targetPos = new THREE.Vector3(0.3, -0.1, -1.2); // Lower right (body shield)
        targetPos.applyMatrix4(cameraRef.matrixWorld);
        
        // Lerp position for smooth grab
        hostageGroup.position.lerp(targetPos, delta * 10);
        
        // Match camera rotation (Group)
        hostageGroup.quaternion.slerp(cameraRef.quaternion, delta * 10);
        
        // Struggle animation
        const time = Date.now() * 0.005;
        hostageModel.rotation.x = Math.sin(time) * 0.1;
    } else {
        // Idle standing breathing
        const time = Date.now() * 0.002;
        hostageGroup.position.y = Math.sin(time) * 0.02;
    }
}
