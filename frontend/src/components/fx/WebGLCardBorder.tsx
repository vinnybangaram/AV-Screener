import { useEffect, useRef } from "react";

/**
 * WebGL-powered animated gradient border for cards.
 * Renders a subtle, cursor-reactive emerald glow stroke around the wrapped element.
 * Falls back gracefully if WebGL is unavailable.
 */
interface Props {
  children: React.ReactNode;
  className?: string;
  /** Color in hex like "#10b981" */
  color?: string;
  /** Border radius in px to match the card */
  radius?: number;
  intensity?: number;
}

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_res;
uniform vec3 u_color;
uniform float u_radius;
uniform float u_intensity;

float roundedBox(vec2 p, vec2 b, float r){
  vec2 q = abs(p) - b + vec2(r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main(){
  vec2 px = v_uv * u_res;
  vec2 c  = u_res * 0.5;
  vec2 half_ = u_res * 0.5 - 2.0;
  float d = roundedBox(px - c, half_, u_radius);

  // Stroke (thin band along edge)
  float stroke = smoothstep(1.5, 0.0, abs(d));

  // Animated angular sweep
  vec2 rel = px - c;
  float ang = atan(rel.y, rel.x);
  float sweep = 0.5 + 0.5 * sin(ang * 2.0 + u_time * 0.8);

  // Cursor proximity boost
  float md = length(px - u_mouse) / max(u_res.x, u_res.y);
  float cursor = smoothstep(0.55, 0.0, md);

  float glow = smoothstep(14.0, 0.0, abs(d)) * (0.18 + 0.55 * cursor);

  vec3 col = u_color * (sweep * 0.85 + 0.35);
  float a  = clamp(stroke * (0.55 + 0.6 * cursor) + glow * 0.55, 0.0, 1.0) * u_intensity;
  gl_FragColor = vec4(col, a);
}`;

function hexToRgb(hex: string): [number, number, number] {
  const n = hex.replace("#", "");
  const r = parseInt(n.substring(0, 2), 16) / 255;
  const g = parseInt(n.substring(2, 4), 16) / 255;
  const b = parseInt(n.substring(4, 6), 16) / 255;
  return [r, g, b];
}

export function WebGLCardBorder({
  children,
  className = "",
  color = "#10b981",
  radius = 16,
  intensity = 1,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<[number, number]>([-9999, -9999]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true });
    if (!gl) return; // graceful no-op

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uColor = gl.getUniformLocation(prog, "u_color");
    const uRadius = gl.getUniformLocation(prog, "u_radius");
    const uIntensity = gl.getUniformLocation(prog, "u_intensity");

    const [r, g, b] = hexToRgb(color);
    gl.uniform3f(uColor, r, g, b);
    gl.uniform1f(uRadius, radius);
    gl.uniform1f(uIntensity, intensity);

    let raf = 0;
    const t0 = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = wrap.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const handleMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      mouseRef.current = [
        (e.clientX - rect.left) * dpr,
        (rect.height - (e.clientY - rect.top)) * dpr,
      ];
    };
    const handleLeave = () => { mouseRef.current = [-9999, -9999]; };
    wrap.addEventListener("mousemove", handleMove);
    wrap.addEventListener("mouseleave", handleLeave);

    const tick = () => {
      gl.uniform1f(uTime, (performance.now() - t0) / 1000);
      gl.uniform2f(uMouse, mouseRef.current[0], mouseRef.current[1]);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener("mousemove", handleMove);
      wrap.removeEventListener("mouseleave", handleLeave);
    };
  }, [color, radius, intensity]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ borderRadius: radius }}
      />
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
