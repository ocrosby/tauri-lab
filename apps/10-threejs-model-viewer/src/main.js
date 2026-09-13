import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const { open } = window.__TAURI__.dialog;
const { readFile } = window.__TAURI__.fs;

const infoEl = document.getElementById("info");

// --- renderer / scene / camera / controls ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1d24);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.01,
  1000,
);
camera.position.set(2, 1.5, 2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// --- lights (so glTF materials look right without HDR env) ---
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(4, 6, 4);
scene.add(sun);

// --- placeholder cube so the scene isn't empty on launch ---
let currentModel = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 0.5, 0.5),
  new THREE.MeshStandardMaterial({ color: 0x4a90e2, wireframe: true }),
);
scene.add(currentModel);

const loader = new GLTFLoader();

document.getElementById("open").addEventListener("click", async () => {
  try {
    const path = await open({
      multiple: false,
      filters: [{ name: "glTF", extensions: ["glb", "gltf"] }],
    });
    if (!path) return;

    infoEl.textContent = "loading…";
    const bytes = await readFile(path);
    const gltf = await loader.parseAsync(bytes.buffer, "");

    scene.remove(currentModel);
    currentModel = gltf.scene;
    scene.add(currentModel);

    frameObject(currentModel);

    const triangles = countTriangles(currentModel);
    const filename = path.split(/[\\/]/).pop();
    infoEl.textContent = `${filename} · ${triangles.toLocaleString()} triangles`;
  } catch (err) {
    infoEl.textContent = `error: ${err}`;
  }
});

function frameObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const distance = maxDim / (2 * Math.tan((Math.PI * camera.fov) / 360));

  camera.position.copy(center).add(new THREE.Vector3(0, maxDim * 0.3, distance * 1.6));
  controls.target.copy(center);
  camera.near = Math.max(distance / 100, 0.001);
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  controls.update();
}

function countTriangles(root) {
  let n = 0;
  root.traverse((obj) => {
    if (obj.isMesh && obj.geometry) {
      const g = obj.geometry;
      n += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
    }
  });
  return Math.round(n);
}

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
