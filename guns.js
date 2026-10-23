import * as THREE from 'three';

let gunMesh, muzzleFlash, slideMesh;
let ammo = 7;
const maxAmmo = 7;
let canShoot = true;
let recoilKick = 0;
let slideOffset = 0;

export function setupGun(camera) {
    gunMesh = new THREE.Group();
    
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.9 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 });

    // Slide (Top part)
    slideMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.4), metalMat);
    slideMesh.position.set(0, 0, -0.2);
    
    // Frame (Lower part)
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.35), darkMetal);
    frame.position.set(0, -0.07, -0.15);
    
    // Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.22, 0.1), gripMat);
    grip.position.set(0, -0.2, 0.05);
    grip.rotation.x = -Math.PI / 8;

    // Trigger Guard
    const triggerGuard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.12), metalMat);
    triggerGuard.position.set(0, -0.12, -0.05);

    // Sights
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.02), darkMetal);
    sight.position.set(0, 0.05, -0.35);

    // Muzzle Flash (Hidden by default)
    muzzleFlash = new THREE.PointLight(0xffaa00, 0, 3);
    muzzleFlash.position.set(0, 0, -0.45);
    const flashMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 4, 4), 
        new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.8 })
    );
    flashMesh.position.copy(muzzleFlash.position);
    flashMesh.visible = false;
    muzzleFlash.userData.mesh = flashMesh;
    
    gunMesh.add(slideMesh, frame, grip, triggerGuard, sight, muzzleFlash, flashMesh);
    
    // Position on screen (Bottom right)
    gunMesh.position.set(0.25, -0.25, -0.5);
    camera.add(gunMesh);
    
    return gunMesh;
}

export function shootGun() {
    if (!canShoot || ammo <= 0) return;
    
    ammo--;
    document.getElementById('ammo').innerText = ammo;
    canShoot = false;
    
    // Visuals
    recoilKick = 0.08;
    slideOffset = 0.06; // Slide pulls back
    muzzleFlash.intensity = 3;
    muzzleFlash.userData.mesh.visible = true;
    
    setTimeout(() => {
        muzzleFlash.intensity = 0;
        muzzleFlash.userData.mesh.visible = false;
        canShoot = true;
    }, 200); // Fire rate

    if (ammo <= 0) setTimeout(reload, 400);
}

function reload() {
    // Animate reload (tilt down)
    setTimeout(() => {
        ammo = maxAmmo;
        document.getElementById('ammo').innerText = ammo;
    }, 1200); 
}

export function updateGun(delta) {
    // Recoil
    if (recoilKick > 0) {
        gunMesh.position.z += recoilKick;
        gunMesh.rotation.x = recoilKick * 1.5;
        recoilKick -= delta * 3;
    } else {
        gunMesh.position.z = THREE.MathUtils.lerp(gunMesh.position.z, -0.5, delta * 15);
        gunMesh.rotation.x = THREE.MathUtils.lerp(gunMesh.rotation.x, 0, delta * 15);
    }

    // Slide return
    if (slideOffset > 0) {
        slideMesh.position.z += slideOffset * delta * 10;
        slideOffset -= delta * 3;
    } else {
        slideMesh.position.z = THREE.MathUtils.lerp(slideMesh.position.z, -0.2, delta * 20);
    }
    
    // Idle Sway
    const time = Date.now() * 0.002;
    gunMesh.position.x = 0.25 + Math.sin(time) * 0.005;
    gunMesh.position.y = -0.25 + Math.cos(time * 0.5) * 0.005;
}
