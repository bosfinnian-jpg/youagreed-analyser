'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  Text,
  Center,
  Float,
  MeshReflectorMaterial,
  Sparkles,
  Stars
} from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';
import { Physics, useBox, useSphere, usePlane } from '@react-three/cannon';

// ============================================
// VEHICLE CONTROLLER (SIMPLIFIED)
// ============================================
interface VehicleProps {
  position?: [number, number, number];
  onPositionUpdate?: (pos: [number, number, number]) => void;
}

function Vehicle({ position = [0, 1, 0], onPositionUpdate }: VehicleProps) {
  const [speed, setSpeed] = useState(0);
  const [steer, setSteer] = useState(0);
  
  // Vehicle body
  const [ref, api] = useBox<THREE.Mesh>(() => ({
    mass: 100,
    position,
    args: [2, 1, 4],
    allowSleep: false,
    linearDamping: 0.4,
    angularDamping: 0.4,
  }));

  // Subscribe to position for camera follow
  useEffect(() => {
    if (!api.position) return;
    const unsubscribe = api.position.subscribe((pos) => {
      if (onPositionUpdate) {
        onPositionUpdate(pos as [number, number, number]);
      }
    });
    return unsubscribe;
  }, [api, onPositionUpdate]);

  // Controls
  function Vehicle({ position = [0, 1, 0], onPositionUpdate }: VehicleProps) {
    const [speed, setSpeed] = useState(0);
    const [steer, setSteer] = useState(0);
    
    // Vehicle body - CHANGED: useBox now returns a Group, not a Mesh
    const [ref, api] = useBox<THREE.Group>(() => ({
      mass: 100,
      position,
      args: [2, 1, 4],
      allowSleep: false,
      linearDamping: 0.4,
      angularDamping: 0.4,
    }));
  
    // Subscribe to position for camera follow
    useEffect(() => {
      if (!api.position) return;
      const unsubscribe = api.position.subscribe((pos) => {
        if (onPositionUpdate) {
          onPositionUpdate(pos as [number, number, number]);
        }
      });
      return unsubscribe;
    }, [api, onPositionUpdate]);
  
   // Controls - Direct state updates
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    console.log('Key down:', key);
    
    if (key === 'w' || key === 'arrowup') setSpeed(5);
    if (key === 's' || key === 'arrowdown') setSpeed(-3);
    if (key === 'a' || key === 'arrowleft') setSteer(1);
    if (key === 'd' || key === 'arrowright') setSteer(-1);
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    console.log('Key up:', key);
    
    if (key === 'w' || key === 'arrowup' || key === 's' || key === 'arrowdown') setSpeed(0);
    if (key === 'a' || key === 'arrowleft' || key === 'd' || key === 'arrowright') setSteer(0);
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}, []);
  
    // Apply forces
  useFrame(() => {
    if (!ref.current || !api) return;
    
    // Get current rotation
    const rotation = ref.current.rotation.y;
    
    // Apply movement force in the direction the car is facing
    if (speed !== 0) {
      const force = new THREE.Vector3(
        Math.sin(rotation) * speed * 20,
        0,
        Math.cos(rotation) * speed * 20
      );
      api.applyForce(force.toArray(), [0, 0, 0]);
    }
    
    // Apply rotation
    if (steer !== 0 && Math.abs(speed) > 0.1) {
      api.angularVelocity.set(0, steer * speed * 0.5, 0);
    }
  }); // <-- This closes useFrame

  return (  // <-- Make sure this is here!
    <group ref={ref}>
      {/* Car body */}
      <mesh castShadow>
        <boxGeometry args={[2, 1, 4]} />
        <meshStandardMaterial color="#e94560" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Wheels (visual only) */}
      <mesh position={[-0.8, -0.3, 1.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.8, -0.3, 1.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-0.8, -0.3, -1.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.8, -0.3, -1.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  ); // <-- This closes return
} // <-- This closes Vehicle function
// Apply forces
useFrame(() => {
  if (!ref.current || !api) {
    console.log('No ref or api');
    return;
  }
  
  console.log('Speed:', speed, 'Steer:', steer);
  
  // Get current rotation
  const rotation = ref.current.rotation.y;
  
  // Apply movement force in the direction the car is facing
  if (speed !== 0) {
    const force = new THREE.Vector3(
      Math.sin(rotation) * speed * 20,
      0,
      Math.cos(rotation) * speed * 20
    );
    console.log('Applying force:', force);
    api.applyForce(force.toArray(), [0, 0, 0]);
  }
  
  // Apply rotation
  if (steer !== 0 && Math.abs(speed) > 0.1) {
    api.applyTorque([0, steer * speed * 2, 0]);
  }
});

  return (
    <group>
      {/* Car body */}
      <mesh ref={ref} castShadow>
        <boxGeometry args={[2, 1, 4]} />
        <meshStandardMaterial color="#e94560" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Wheels (visual only) */}
      <mesh position={[-0.8, -0.3, 1.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.8, -0.3, 1.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-0.8, -0.3, -1.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.8, -0.3, -1.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}

// ============================================
// BRAIN INSTALLATION
// ============================================
interface BrainData {
  id: string;
  position: [number, number, number];
  name: string;
  messagesCount: number;
  dataPoints: string[];
  carbonFootprint: number;
  privacyScore: number;
  platform: 'Meta' | 'OpenAI' | 'Google' | 'Anthropic';
  color: string;
  excerpts: string[];
}

const brainData: BrainData[] = [
  {
    id: 'subject-001',
    position: [-20, 3, -15],
    name: 'Sarah M.',
    messagesCount: 12847,
    dataPoints: ['Medical history', 'Family relationships', 'Work stress', 'Financial worries'],
    carbonFootprint: 64.2,
    privacyScore: 9.2,
    platform: 'Meta',
    color: '#1877f2',
    excerpts: [
      'I haven\'t told anyone about my diagnosis yet...',
      'My mother would be devastated if she knew...',
      'The debt is crushing me, I don\'t know what to do...'
    ]
  },
  {
    id: 'subject-002',
    position: [25, 3, -10],
    name: 'David K.',
    messagesCount: 8934,
    dataPoints: ['Legal issues', 'Relationship problems', 'Mental health', 'Location data'],
    carbonFootprint: 44.7,
    privacyScore: 8.7,
    platform: 'OpenAI',
    color: '#74aa9c',
    excerpts: [
      'The divorce lawyer says I might lose custody...',
      'I\'ve been having these thoughts again, the dark ones...',
      'I work at [REDACTED] and live at [REDACTED]...'
    ]
  },
  {
    id: 'subject-003',
    position: [-15, 3, 25],
    name: 'Emma L.',
    messagesCount: 15632,
    dataPoints: ['Political views', 'Sexual orientation', 'Health conditions', 'Shopping habits'],
    carbonFootprint: 78.2,
    privacyScore: 9.8,
    platform: 'Google',
    color: '#4285f4',
    excerpts: [
      'I\'ve never told my parents about my girlfriend...',
      'The medication isn\'t working anymore...',
      'I spend too much, it\'s becoming a problem...'
    ]
  },
  {
    id: 'subject-004',
    position: [30, 3, 30],
    name: 'Marcus T.',
    messagesCount: 6234,
    dataPoints: ['Career anxieties', 'Educational background', 'Social network', 'Daily routines'],
    carbonFootprint: 31.2,
    privacyScore: 7.3,
    platform: 'Anthropic',
    color: '#d4a574',
    excerpts: [
      'I lied on my resume about my degree...',
      'I wake up at 5:30am every day for my commute to [REDACTED]...',
      'My boss doesn\'t know I\'m looking for other jobs...'
    ]
  },
  {
    id: 'subject-005',
    position: [0, 3, -30],
    name: 'Lisa W.',
    messagesCount: 21456,
    dataPoints: ['Childhood trauma', 'Addiction recovery', 'Family secrets', 'Income details'],
    carbonFootprint: 107.3,
    privacyScore: 9.9,
    platform: 'Meta',
    color: '#1877f2',
    excerpts: [
      'What happened when I was 7 still haunts me...',
      'Day 47 clean, but the cravings are unbearable...',
      'I make $[REDACTED] but feel worthless...'
    ]
  }
];

interface BrainInstallationProps {
  data: BrainData;
  vehiclePosition: [number, number, number];
  onApproach: (data: BrainData | null) => void;
}

function BrainInstallation({ 
  data, 
  vehiclePosition,
  onApproach 
}: BrainInstallationProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isNear, setIsNear] = useState(false);
  const [excerptIndex, setExcerptIndex] = useState(0);
  
  // Physics body for collision
  const [ref] = useSphere<THREE.Mesh>(() => ({
    type: 'Static',
    position: data.position,
    args: [3],
  }));

  // Rotation and proximity check
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle rotation
      meshRef.current.rotation.y += 0.005;
      
      // Pulsing effect
      const pulse = Math.sin(state.clock.elapsedTime * 2 + data.position[0]) * 0.1 + 1;
      meshRef.current.scale.setScalar(pulse * 2);
      
      // Check distance to vehicle
      const distance = Math.sqrt(
        Math.pow(vehiclePosition[0] - data.position[0], 2) +
        Math.pow(vehiclePosition[2] - data.position[2], 2)
      );
      
      if (distance < 10) {
        if (!isNear) {
          setIsNear(true);
          onApproach(data);
        }
      } else {
        if (isNear) {
          setIsNear(false);
          onApproach(null);
        }
      }
    }
  });

  // Cycle through excerpts
  useEffect(() => {
    if (isNear) {
      const interval = setInterval(() => {
        setExcerptIndex((prev) => (prev + 1) % data.excerpts.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isNear, data.excerpts.length]);

  return (
    <group position={data.position}>
      {/* Invisible collision sphere */}
      <mesh ref={ref} visible={false}>
        <sphereGeometry args={[3]} />
      </mesh>
      
      {/* Visual brain */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <icosahedronGeometry args={[2, 3]} />
        <meshStandardMaterial
          color={data.color}
          metalness={0.3}
          roughness={0.2}
          emissive={data.color}
          emissiveIntensity={isNear ? 0.5 : 0.2}
          wireframe={false}
        />
      </mesh>
      
      {/* Neural sparkles */}
      <Sparkles
        count={100}
        scale={6}
        size={3}
        speed={0.5}
        color={data.color}
        opacity={isNear ? 0.8 : 0.3}
      />
      
      {/* Platform ring */}
      <mesh position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 3.5, 32]} />
        <meshStandardMaterial 
          color={data.color} 
          emissive={data.color}
          emissiveIntensity={0.2}
          opacity={0.5} 
          transparent 
        />
      </mesh>
      
      {/* Info display when near */}
      {isNear && (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <group position={[0, 5, 0]}>
            <Center>
              <Text
                fontSize={0.5}
                color="white"
                anchorX="center"
                anchorY="middle"
                font="/fonts/Inter-Bold.woff"
              >
                {data.name}
              </Text>
            </Center>
            <Center position={[0, -0.7, 0]}>
              <Text
                fontSize={0.25}
                color="#999"
                anchorX="center"
                anchorY="middle"
              >
                {`${data.messagesCount.toLocaleString()} messages`}
              </Text>
            </Center>
            <Center position={[0, -1.2, 0]}>
              <Text
                fontSize={0.2}
                color="#666"
                anchorX="center"
                anchorY="middle"
              >
                {`${data.carbonFootprint} kg CO₂`}
              </Text>
            </Center>
            <Center position={[0, -2, 0]}>
              <Text
                fontSize={0.18}
                color="#e94560"
                anchorX="center"
                anchorY="middle"
                maxWidth={8}
                textAlign="center"
                font="/fonts/Inter-Regular.woff"
              >
                {data.excerpts[excerptIndex]}
              </Text>
            </Center>
          </group>
        </Float>
      )}
    </group>
  );
}

// ============================================
// GROUND
// ============================================
function Ground() {
  const [ref] = usePlane<THREE.Mesh>(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    type: 'Static',
  }));

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <MeshReflectorMaterial
        blur={[300, 30]}
        resolution={2048}
        mixBlur={1}
        mixStrength={180}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#0a0a0a"
        metalness={0.8}
      />
    </mesh>
  );
}

// ============================================
// CAMERA CONTROLLER
// ============================================
interface CameraControllerProps {
  vehiclePosition: [number, number, number];
}

function CameraController({ vehiclePosition }: CameraControllerProps) {
  const { camera } = useThree();
  
  useFrame(() => {
    // Smooth camera follow
    const idealPosition = new THREE.Vector3(
      vehiclePosition[0],
      vehiclePosition[1] + 15,
      vehiclePosition[2] + 20
    );
    
    camera.position.lerp(idealPosition, 0.05);
    
    const lookAtPoint = new THREE.Vector3(
      vehiclePosition[0],
      vehiclePosition[1],
      vehiclePosition[2]
    );
    
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(10).add(camera.position);
    
    currentLookAt.lerp(lookAtPoint, 0.05);
    camera.lookAt(currentLookAt);
  });
  
  return null;
}

// ============================================
// INFO PANEL
// ============================================
interface InfoPanelProps {
  brainData: BrainData | null;
}

function InfoPanel({ brainData }: InfoPanelProps) {
  if (!brainData) return null;

  return (
    <div className="fixed top-4 right-4 w-96 bg-black/95 backdrop-blur-xl border border-white/10 rounded-lg p-6 text-white">
      <h2 className="text-2xl font-light mb-4">{brainData.name}</h2>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-white/60">Platform:</span>
          <span style={{ color: brainData.color }} className="font-medium">
            {brainData.platform}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Messages analyzed:</span>
          <span>{brainData.messagesCount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Carbon footprint:</span>
          <span className="text-orange-400">{brainData.carbonFootprint} kg CO₂</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Privacy exposure:</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-red-400"
                style={{ width: `${brainData.privacyScore * 10}%` }}
              />
            </div>
            <span className="text-red-400">{brainData.privacyScore}/10</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-white/60 mb-2">Data collected:</p>
          <div className="flex flex-wrap gap-2">
            {brainData.dataPoints.map((point, i) => (
              <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs">
                {point}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-white/40 italic leading-relaxed">
            {'"We may use your conversations to improve our services and train our models. '}
            {'This data may be retained indefinitely and shared with third parties."'}
          </p>
          <p className="text-xs text-white/20 mt-2">
            — Terms of Service, Section 19
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN EXHIBITION COMPONENT
// ============================================
export default function Exhibition() {
  const [currentBrain, setCurrentBrain] = useState<BrainData | null>(null);
  const [vehiclePosition, setVehiclePosition] = useState<[number, number, number]>([0, 1, 0]);
  const router = useRouter();

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg p-4 text-white max-w-md">
        <h1 className="text-2xl font-light mb-2 text-white/90">
          Exhibition: <span className="text-red-400">Data Harvest</span>
        </h1>
        <p className="text-sm text-white/60 mb-3 leading-relaxed">
          Each brain contains thousands of AI conversations. 
          <span className="text-white/80"> Drive between the minds to explore what they agreed to share.</span>
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-0.5 bg-white/10 rounded">↑/W</kbd>
            <span>Forward</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-0.5 bg-white/10 rounded">↓/S</kbd>
            <span>Reverse</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-0.5 bg-white/10 rounded">←/A</kbd>
            <span>Turn Left</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-0.5 bg-white/10 rounded">→/D</kbd>
            <span>Turn Right</span>
          </div>
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={() => router.push('/')}
        className="absolute bottom-4 left-4 z-10 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded text-white hover:bg-white/20 transition-all duration-200 text-sm"
      >
        ← Exit Exhibition
      </button>

      {/* Stats */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg px-6 py-2 text-white">
        <div className="flex items-center gap-8 text-xs">
          <div>
            <span className="text-white/40">Total Messages:</span>{' '}
            <span className="text-white/80 font-mono">
              {brainData.reduce((acc, b) => acc + b.messagesCount, 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-white/40">Total CO₂:</span>{' '}
            <span className="text-orange-400 font-mono">
              {brainData.reduce((acc, b) => acc + b.carbonFootprint, 0).toFixed(1)} kg
            </span>
          </div>
          <div>
            <span className="text-white/40">Subjects:</span>{' '}
            <span className="text-red-400 font-mono">{brainData.length}</span>
          </div>
        </div>
      </div>

      {/* Info panel */}
      <InfoPanel brainData={currentBrain} />

      {/* 3D Scene */}
      <Canvas
        shadows
        camera={{ position: [0, 15, 20], fov: 50 }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 20, 100]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.2} />
        <directionalLight
          position={[20, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={100}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        
        {/* Colored accent lights */}
        <pointLight position={[-20, 10, -20]} intensity={0.5} color="#569AFF" />
        <pointLight position={[20, 10, 20]} intensity={0.5} color="#e94560" />
        <pointLight position={[0, 10, 0]} intensity={0.3} color="#d4a574" />
        
        {/* Physics world */}
        <Physics gravity={[0, -9.81, 0]}>
          <Ground />
          <Vehicle position={[0, 1, 0]} onPositionUpdate={setVehiclePosition} />
          
          {/* Brain installations */}
          {brainData.map((brain) => (
            <BrainInstallation
              key={brain.id}
              data={brain}
              vehiclePosition={vehiclePosition}
              onApproach={setCurrentBrain}
            />
          ))}
          
          {/* Invisible boundary walls */}
          <mesh position={[0, 5, -50]}>
            <boxGeometry args={[200, 20, 1]} />
            <meshBasicMaterial visible={false} />
          </mesh>
          <mesh position={[0, 5, 50]}>
            <boxGeometry args={[200, 20, 1]} />
            <meshBasicMaterial visible={false} />
          </mesh>
          <mesh position={[-50, 5, 0]}>
            <boxGeometry args={[1, 20, 200]} />
            <meshBasicMaterial visible={false} />
          </mesh>
          <mesh position={[50, 5, 0]}>
            <boxGeometry args={[1, 20, 200]} />
            <meshBasicMaterial visible={false} />
          </mesh>
        </Physics>
        
        {/* Atmospheric particles */}
        <Stars 
          radius={100} 
          depth={50} 
          count={5000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={1} 
        />
        
        <Sparkles 
          count={200} 
          scale={[100, 20, 100]} 
          size={2} 
          speed={0.1} 
          color="#ffffff" 
          opacity={0.1} 
        />
        
        {/* Camera controller */}
        <CameraController vehiclePosition={vehiclePosition} />
      </Canvas>

      {/* Quote overlay */}
      <div className="absolute bottom-4 right-4 max-w-md text-right text-white/30 text-xs italic">
        {'"Your content may be used to train our AI systems and shared with partners '}
        {'for product improvement." — Every Terms of Service'}
      </div>
    </div>
  );
}