import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const N = 100_000;

// --- renderer / scene / camera / controls ---
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1116);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  200,
);
camera.position.set(0, 0, 25);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// --- lights ---
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dir = new THREE.DirectionalLight(0xffffff, 2);
dir.position.set(5, 10, 7);
scene.add(dir);

// --- instanced mesh: 100_000 cubes, one draw call ---
const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
const mat = new THREE.MeshLambertMaterial();
const mesh = new THREE.InstancedMesh(geo, mat, N);
mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

const dummy = new THREE.Object3D();
const color = new THREE.Color();
const baseColors = new Float32Array(N * 3);

for (let i = 0; i < N; i++) {
  const radius = 6 + Math.pow(Math.random(), 0.5) * 6;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  dummy.position.set(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
  );
  dummy.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI,
  );
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);

  color.setHSL(i / N, 0.7, 0.5);
  mesh.setColorAt(i, color);
  baseColors[i * 3 + 0] = color.r;
  baseColors[i * 3 + 1] = color.g;
  baseColors[i * 3 + 2] = color.b;
}
mesh.instanceMatrix.needsUpdate = true;
mesh.instanceColor.needsUpdate = true;
scene.add(mesh);

// --- HUD ---
const countEl = document.getElementById("count");
const callsEl = document.getElementById("calls");
const fpsEl = document.getElementById("fps");
countEl.textContent = N.toLocaleString();

let lastFpsTick = performance.now();
let frames = 0;

renderer.setAnimationLoop(() => {
  mesh.rotation.y += 0.002;

  // Pulse every instance's color over time via a single attribute buffer swap.
  const t = performance.now() * 0.001;
  const pulse = 0.5 + 0.5 * Math.sin(t * 2);
  for (let i = 0; i < N; i += 1000) {
    color.setRGB(baseColors[i * 3] * pulse, baseColors[i * 3 + 1], baseColors[i * 3 + 2]);
    mesh.setColorAt(i, color);
  }
  mesh.instanceColor.needsUpdate = true;

  controls.update();
  renderer.render(scene, camera);

  frames += 1;
  const now = performance.now();
  if (now - lastFpsTick >= 500) {
    fpsEl.textContent = Math.round((frames * 1000) / (now - lastFpsTick));
    callsEl.textContent = renderer.info.render.calls;
    frames = 0;
    lastFpsTick = now;
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
