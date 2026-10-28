import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { ORIGIN, STARS } from './model'

type Props = { radius: number; seedVersion: number }

export function Galaxy({ radius, seedVersion }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const radiusRef = useRef(radius)
  const renderRef = useRef<(() => void) | null>(null)
  const [fallback, setFallback] = useState(false)
  radiusRef.current = radius
  useEffect(() => { renderRef.current?.() }, [radius])

  useEffect(() => {
    const element = host.current
    if (!element) return
    let renderer: THREE.WebGLRenderer | undefined
    let observer: ResizeObserver | undefined
    let geometry: THREE.BufferGeometry | undefined
    let material: THREE.ShaderMaterial | undefined
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setClearColor(0x000000, 0)
      element.appendChild(renderer.domElement)
      const scene = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(-1.13, 1.13, 1.13, -1.13, 0.1, 10)
      camera.position.z = 2
      geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(STARS.length * 3)
      const reaches = new Float32Array(STARS.length)
      const sizes = new Float32Array(STARS.length)
      const hues = new Float32Array(STARS.length)
      STARS.forEach((star, i) => {
        positions[i * 3] = star.x
        positions[i * 3 + 1] = star.y
        reaches[i] = star.reach
        sizes[i] = star.size
        hues[i] = star.hue
      })
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('aReach', new THREE.BufferAttribute(reaches, 1))
      geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
      geometry.setAttribute('aHue', new THREE.BufferAttribute(hues, 1))
      material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uRadius: { value: radiusRef.current }, uPixels: { value: 1 } },
        vertexShader: `
          attribute float aReach; attribute float aSize; attribute float aHue;
          varying float vReach; varying float vHue;
          uniform float uPixels;
          void main() {
            vReach = aReach; vHue = aHue;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = max(1.5, aSize * uPixels * 3.4);
          }
        `,
        fragmentShader: `
          varying float vReach; varying float vHue;
          uniform float uRadius;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float glow = pow(max(0.0, 1.0 - d * 2.0), 2.0);
            float reached = 1.0 - step(uRadius, vReach);
            vec3 quiet = mix(vec3(0.50, 0.65, 0.93), vec3(0.92, 0.72, 0.90), vHue * 0.5);
            vec3 lit = mix(vec3(0.18, 0.86, 1.0), vec3(0.98, 0.85, 0.56), vHue * 0.4);
            gl_FragColor = vec4(mix(quiet, lit, reached), glow * mix(0.75, 1.0, reached));
          }
        `,
      })
      scene.add(new THREE.Points(geometry, material))
      const render = () => {
        if (material) material.uniforms.uRadius.value = radiusRef.current
        renderer?.render(scene, camera)
      }
      renderRef.current = render
      observer = new ResizeObserver(() => {
        const width = element.clientWidth
        const height = element.clientHeight
        renderer?.setSize(width, height, false)
        if (material) material.uniforms.uPixels.value = Math.min(width, height) / 620 * Math.min(window.devicePixelRatio || 1, 2)
        render()
      })
      observer.observe(element)
      render()
    } catch {
      setFallback(true)
    }
    return () => {
      renderRef.current = null
      observer?.disconnect()
      geometry?.dispose()
      material?.dispose()
      renderer?.dispose()
      if (renderer?.domElement.parentNode === element) element.removeChild(renderer.domElement)
    }
  }, [])

  const clipped = Math.min(radius, 1.5)
  return <div className="galaxy" ref={host} role="img" aria-label={`Top-down stylized Milky Way. Estimated reached star sample: ${Math.round(STARS.filter(s => s.reach <= radius).length / STARS.length * 100)} percent.`}>
    {fallback && <FallbackGalaxy radius={radius} />}
    <div className="galaxy-haze" />
    <div className="expansion-ring" style={{ left: `${50 + ORIGIN.x / 2.26 * 100}%`, top: `${50 - ORIGIN.y / 2.26 * 100}%`, width: `${clipped * 2 / 2.26 * 100}%`, aspectRatio: '1' }} />
    <div className="origin-dot" style={{ left: `${50 + ORIGIN.x / 2.26 * 100}%`, top: `${50 - ORIGIN.y / 2.26 * 100}%` }} title="Hypothetical origin" />
    <span className="galaxy-caption">A HYPOTHETICAL ORIGIN · NOT A MAP OF LIFE</span>
    <span className="galaxy-scale">≈ 100,000 LIGHT-YEARS ACROSS</span>
    <span className="sr-only">Simulation reset count {seedVersion}</span>
  </div>
}

function FallbackGalaxy({ radius }: { radius: number }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const draw = () => {
      const size = el.clientWidth
      const dpr = Math.min(devicePixelRatio || 1, 2)
      el.width = size * dpr
      el.height = size * dpr
      const ctx = el.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)
      for (const s of STARS) {
        ctx.fillStyle = s.reach <= radius ? 'rgba(103,225,255,.85)' : 'rgba(167,183,231,.42)'
        ctx.beginPath()
        ctx.arc(size * (0.5 + s.x / 2.26), size * (0.5 - s.y / 2.26), s.size * size / 750, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    const observer = new ResizeObserver(draw)
    observer.observe(el)
    draw()
    return () => observer.disconnect()
  }, [radius])
  return <canvas className="galaxy-fallback" ref={canvas} />
}
