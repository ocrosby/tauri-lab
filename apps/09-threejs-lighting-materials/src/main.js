import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// --- renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

// --- scene + camera ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1116);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(3, 2.5, 4);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0.5, 0);

// --- meshes ---
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.75, 64, 64),
  new THREE.MeshStandardMaterial({
    color: 0xd0d3d8,
    metalness: 0.6,
    roughness: 0.25,
  }),
);
sphere.position.y = 0.75;
sphere.castShadow = true;
scene.add(sphere);

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: 0x2c313a, roughness: 0.9 }),
);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

// --- lights ---
scene.add(new THREE.AmbientLight(0xffffff, 0.15));

const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(3, 4, 2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -3;
sun.shadow.camera.right = 3;
sun.shadow.camera.top = 3;
sun.shadow.camera.bottom = -3;
scene.add(sun);

const bulb = new THREE.PointLight(0xff7050, 5, 6, 2);
bulb.position.set(1.5, 1.5, 1.5);
bulb.castShadow = true;
bulb.shadow.mapSize.set(1024, 1024);
scene.add(bulb);

// --- render loop ---
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  bulb.position.x = Math.cos(t) * 1.8;
  bulb.position.z = Math.sin(t) * 1.8;
  sphere.rotation.y = t * 0.3;
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
