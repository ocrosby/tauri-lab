// Edit me and save — the window updates live.
// Uniforms available:
//   u_time       — seconds since load
//   u_resolution — canvas pixel size

precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;

varying vec2 v_uv;

void main() {
  vec2 p = v_uv * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;

  float r = length(p);
  float a = atan(p.y, p.x);

  // hot-reload demo: edit these numbers and save — the window updates live
  vec3 col = 0.5 + 0.5 * cos(
    u_time * 2.0 + a * 8.0 + r * 3.0 + vec3(2.0, 4.0, 0.0)
  );

  col *= smoothstep(1.4, 0.1, r);
  gl_FragColor = vec4(col, 1.0);
}
