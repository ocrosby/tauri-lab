import * as THREE from "three";

const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

const VERT = `
  varying vec2 v_uv;
  void main() {
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// --- renderer / scene / ortho camera for full-screen quad ---
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const uniforms = {
  u_time: { value: 0 },
  u_resolution: {
    value: new THREE.Vector2(window.innerWidth, window.innerHeight),
  },
};

const material = new THREE.ShaderMaterial({
  vertexShader: VERT,
  fragmentShader: await invoke("get_shader"),
  uniforms,
});

const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
scene.add(quad);

// --- hot-reload ---
const reloadEl = document.getElementById("reload");
await listen("shader-changed", (event) => {
  material.fragmentShader = event.payload;
  material.needsUpdate = true;
  reloadEl.textContent = new Date().toLocaleTimeString();
});

// --- render loop ---
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  uniforms.u_time.value = clock.getElapsedTime();
  renderer.render(scene, camera);
});

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
});
