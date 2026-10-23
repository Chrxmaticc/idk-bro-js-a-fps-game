import * as THREE from 'three';

let hostageGroup;
let hostageModel;
let isGrabbed = false;
let cameraRef;

export function setupHostage(scene, camera) {
    cameraRef = camera;
    
    hostageGroup = new THREE.Group();
    hostageModel = new THREE.Group();
    
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.6 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.9 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.25), shirtMat);
    torso.position.y = 1.0;
    
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 0.25), skinMat);
    head.position.y = 1.5;
    
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.15), shirtMat);
    leftArm.position.set(-0.35, 1.0, 0);
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.15), shirtMat);
    rightArm.position.set(0.35, 1.0, 0);

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), pantsMat);
    leftLeg.position.set(-0.15, 0.4, 0);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), pantsMat);
    rightLeg.position.set(0.15, 0.4, 0);

    hostageModel.add(torso, head, leftArm, rightArm, leftLeg, rightLeg);
    hostageGroup.add(hostageModel);
    
    hostageGroup.position.set(0, 0, -4); 
    scene.add(hostageGroup);
}

export function toggleGrab() {
    const distance = cameraRef.getWorldPosition(new THREE.Vector3()).distanceTo(hostageGroup.position);
    
    if (!isGrabbed && distance < 4) {
        isGrabbed = true;
        // Shift model UP so its center aligns with the group's center
        hostageModel.position.y = -1.0; 
        // Rotate horizontally 
        hostageModel.rotation.set(0, 0, Math.PI / 2); 
    } else if (isGrabbed) {
        isGrabbed = false;
        hostageModel.rotation.set(0, 0, 0); 
        hostageModel.position.set(0, 0, 0); 
        hostageGroup.position.y = 0;
        
        const dir = new THREE.Vector3();
        cameraRef.getWorldDirection(dir);
        hostageGroup.position.add(dir.multiplyScalar(1.5)); 
    }
}

export function updateHostage(delta) {
    if (isGrabbed) {
        // Position in front of the camera
        const targetPos = new THREE.Vector3(0.3, -0.3, -1.2); 
        targetPos.applyMatrix4(cameraRef.matrixWorld);
        
        hostageGroup.position.lerp(targetPos, delta * 10);
        hostageGroup.quaternion.slerp(cameraRef.quaternion, delta * 10);
        
        // Struggle animation
        const time = Date.now() * 0.005;
        hostageModel.rotation.x = Math.sin(time) * 0.1;
    } else {
        const time = Date.now() * 0.002;
        hostageGroup.position.y = Math.sin(time) * 0.02;
    }
}
