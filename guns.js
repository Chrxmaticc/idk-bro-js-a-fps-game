import * as THREE from 'three';

let gunMesh, muzzleFlash;
let ammo = 7;
const maxAmmo = 7;
let canShoot = true;
let recoilKick = 0;

export function setupGun(camera) {
    gunMesh = new THREE.Group();
    
    // Gun Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.5), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    body.position.set(0.3, -0.3, -0.6);
    
    // Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.15), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    grip.position.set(0.3, -0.45, -0.4);
    grip.rotation.x = Math.PI / 8;

    // Muzzle Flash
    muzzleFlash = new THREE.PointLight(0xffaa00, 0, 5);
    muzzleFlash.position.set(0.3, -0.25, -0.9);
    
    gunMesh.add(body); gunMesh.add(grip); gunMesh.add(muzzleFlash);
    camera.add(gunMesh);
    
    return gunMesh;
}

export function shootGun() {
    if (!canShoot || ammo <= 0) return;
    
    ammo--;
    document.getElementById('ammo').innerText = ammo;
    canShoot = false;
    
    // Visuals
    recoilKick = 0.1;
    muzzleFlash.intensity = 2;
    
    setTimeout(() => {
        muzzleFlash.intensity = 0;
        canShoot = true;
    }, 300); // Fire rate

    if (ammo <= 0) setTimeout(reload, 500);
}

function reload() {
    setTimeout(() => {
        ammo = maxAmmo;
        document.getElementById('ammo').innerText = ammo;
    }, 1500); // Reload time
}

export function updateGun(delta) {
    // Recoil Animation
    if (recoilKick > 0) {
        gunMesh.position.z += recoilKick;
        gunMesh.rotation.x = recoilKick * 2;
        recoilKick -= delta * 2;
    } else {
        gunMesh.position.z = THREE.MathUtils.lerp(gunMesh.position.z, 0, delta * 10);
        gunMesh.rotation.x = THREE.MathUtils.lerp(gunMesh.rotation.x, 0, delta * 10);
    }
    
    // Idle Sway
    const time = Date.now() * 0.001;
    gunMesh.position.x = 0.3 + Math.sin(time) * 0.005;
    gunMesh.position.y = -0.3 + Math.cos(time * 0.5) * 0.005;
}
