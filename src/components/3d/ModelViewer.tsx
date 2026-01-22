'use client'

import { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import {
  OrbitControls,
  PerspectiveCamera,
  useGLTF,
  Bounds,
  useBounds,
  Center,
} from '@react-three/drei'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { Mesh, Object3D } from 'three'

interface ModelViewerProps {
  url?: string
  file?: File | string // Can be File object or base64 data URL
  className?: string
  showControls?: boolean
}

function STLModel({ url }: { url: string }) {
  const meshRef = useRef<Mesh>(null)
  const bounds = useBounds()
  // useLoader needs a stable URL - blob URLs work fine
  const geometry = useLoader(STLLoader, url)

  useEffect(() => {
    if (geometry) {
      // Compute normals for better lighting
      geometry.computeVertexNormals()
      console.log('[STLModel] Loaded geometry with', geometry.attributes.position.count, 'vertices')

      // Fit model to viewport after geometry loads
      if (meshRef.current && bounds) {
        // Small delay to ensure mesh is rendered
        const mesh = meshRef.current
        setTimeout(() => {
          if (mesh) {
            bounds.refresh(mesh).clip().fit()
          }
        }, 100)
      }
    }
  }, [geometry, bounds])

  if (!geometry) {
    return null
  }

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color="#1D0DF3" metalness={0.3} roughness={0.4} />
    </mesh>
  )
}

function GLTFModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const bounds = useBounds()
  const sceneRef = useRef<Object3D>(null)

  useEffect(() => {
    if (sceneRef.current && bounds) {
      // Fit model to viewport after scene loads
      const sceneObj = sceneRef.current
      setTimeout(() => {
        if (sceneObj) {
          bounds.refresh(sceneObj).clip().fit()
        }
      }, 100)
    }
  }, [scene, bounds])

  return <primitive ref={sceneRef} object={scene} />
}

function Model({ url, file }: { url?: string; file?: File | string }) {
  // Extract filename from File object or data URL
  let fileName = ''
  if (file) {
    if (typeof file === 'string') {
      // Extract filename from data URL if present (data:...;name=filename.stl,...)
      // Otherwise use url or empty string
      fileName = url || ''
    } else {
      fileName = file.name
    }
  } else if (url) {
    fileName = url
  }

  const fileExtension = fileName.split('.').pop()?.toLowerCase()
  console.log('[ModelViewer] File extension:', fileExtension, 'for file:', fileName)

  // Model component only renders Three.js objects - no HTML elements
  if (fileExtension === 'stl' || fileExtension === '3mf') {
    return <STLModel url={url!} />
  } else if (fileExtension === 'gltf' || fileExtension === 'glb') {
    return <GLTFModel url={url!} />
  } else {
    // Default to STL for other formats
    console.log('[ModelViewer] Unknown extension, defaulting to STL')
    return <STLModel url={url!} />
  }
}

export default function ModelViewer({
  url,
  file,
  className = '',
  showControls = true,
}: ModelViewerProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)

    if (file) {
      try {
        // Check if file is a string (base64 data URL) or File object
        if (typeof file === 'string') {
          console.log('[ModelViewer] Using data URL directly')
          setObjectUrl(file)
          setLoading(false)
        } else {
          // File object - create blob URL
          const blobUrl = URL.createObjectURL(file)
          console.log('[ModelViewer] Created blob URL:', blobUrl, 'for file:', file.name)
          setObjectUrl(blobUrl)
          setLoading(false)
          return () => {
            console.log('[ModelViewer] Revoking blob URL:', blobUrl)
            URL.revokeObjectURL(blobUrl)
          }
        }
      } catch (err) {
        console.error('[ModelViewer] Error creating blob URL:', err)
        setError('Failed to load file')
        setLoading(false)
      }
    } else if (url) {
      console.log('[ModelViewer] Using URL:', url)
      setObjectUrl(url)
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [file, url])

  // Show error state outside Canvas
  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <p
          className="text-xs text-red-600 text-center"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          {error}
        </p>
      </div>
    )
  }

  // Show loading state outside Canvas
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D0DF3] mx-auto mb-2"></div>
          <p className="text-xs text-[#7C7C7C]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
            Preparing model...
          </p>
        </div>
      </div>
    )
  }

  // Show no model message outside Canvas
  if (!objectUrl) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <p
          className="text-xs text-[#7C7C7C] text-center"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          No model available
        </p>
      </div>
    )
  }

  // Only render Canvas when we have a valid URL
  return (
    <div className={`relative w-full h-full bg-[#F8F8F8] ${className}`}>
      <Canvas className="w-full h-full" gl={{ antialias: true, alpha: false }} dpr={[1, 2]}>
        <color attach="background" args={['#F8F8F8']} />
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} />
          <pointLight position={[0, 0, 10]} intensity={0.5} />
          <Bounds fit clip observe margin={1.5}>
            <Center>
              <Model url={objectUrl} file={file} />
            </Center>
          </Bounds>
          {showControls && (
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              enableRotate={true}
              autoRotate={false}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  )
}
