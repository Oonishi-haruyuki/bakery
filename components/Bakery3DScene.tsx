// Fix: Removed unnecessary or problematic type reference that was causing a build error
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { Text, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { BreadType } from '../types';
import { RECIPES } from '../constants';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends ThreeElements {}
  }
}

interface CustomerProps {
  id: number;
  breadType: BreadType;
  onLeave: (id: number) => void;
}

const Customer: React.FC<CustomerProps> = ({ id, breadType, onLeave }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [state, setState] = useState<'entering' | 'buying' | 'leaving'>('entering');
  const [timer, setTimer] = useState(0);
  
  const color = useRef(new THREE.Color().setHSL(Math.random(), 0.7, 0.6));

  useFrame((rootState, delta) => {
    if (!groupRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const bounce = Math.sin(time * 15) * 0.1;

    if (state === 'entering') {
      groupRef.current.position.x += delta * 3;
      groupRef.current.position.y = bounce;
      if (groupRef.current.position.x >= -1.5) {
        setState('buying');
        setTimer(0);
      }
    } else if (state === 'buying') {
      setTimer(prev => prev + delta);
      groupRef.current.position.y = 0;
      if (timer > 1.0) {
        setState('leaving');
      }
    } else if (state === 'leaving') {
      groupRef.current.position.x += delta * 3;
      groupRef.current.position.y = bounce;
      if (groupRef.current.position.x > 5) {
        onLeave(id);
      }
    }
  });

  const recipe = RECIPES[breadType];

  return (
    <group ref={groupRef} position={[-6, 0, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.6, 4, 8]} />
        <meshStandardMaterial color={color.current} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#ffdec7" />
      </mesh>
      {(state === 'buying' || state === 'leaving') && (
        <group position={[0, 2.2, 0]}>
          <Text fontSize={0.3} color="#5c4033" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="white">
            {recipe.name.substring(0, 4)}..
          </Text>
        </group>
      )}
    </group>
  );
};

const StaffMember: React.FC<{ position: [number, number, number], index: number }> = ({ position, index }) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);

  const apronColors = ['#4b5563', '#1e40af', '#166534', '#991b1b', '#854d0e', '#3730a3'];
  const skinColors = ['#ffdec7', '#e5c298', '#8d5524', '#c68642', '#f1c27d'];
  const hairColors = ['#27272a', '#44403c', '#78350f', '#fbbf24', '#d4d4d8'];
  
  const apronColor = apronColors[index % apronColors.length];
  const skinColor = skinColors[index % skinColors.length];
  const hairColor = hairColors[index % hairColors.length];

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      groupRef.current.position.y = Math.sin(time * 2 + index) * 0.05;
      
      // Simple arm swing animation
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = Math.sin(time * 3 + index) * 0.2;
        rightArmRef.current.rotation.x = Math.cos(time * 3 + index) * 0.2;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Staff Body (Apron/Uniform) */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.5, 4, 8]} />
        <meshStandardMaterial color={apronColor} />
      </mesh>
      
      {/* Arms */}
      <mesh ref={leftArmRef} position={[-0.35, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.3, 4, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.35, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.3, 4, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* Staff Head */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.23, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hairColor} />
      </mesh>
      
      {/* Staff Hat (Baker style) */}
      <group position={[0, 1.4, 0]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.18, 0.15, 0.15, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.05, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
};

const BreadMesh: React.FC<{ type: BreadType }> = ({ type }) => {
  const color = useMemo(() => {
    switch(type) {
      case BreadType.SHOKUPAN: return '#fdf5e6'; // Old Lace (Wheat-like)
      case BreadType.ANPAN: return '#863e1d'; // Bean color
      case BreadType.CREAMPAN: return '#fffacd'; // Cream yellow
      case BreadType.SHIOPAN: return '#faf0e6'; // Pale
      case BreadType.MELONPAN: return '#90ee90'; // Light green
      case BreadType.CURRYPAN: return '#a0522d'; // Fried brown
      case BreadType.CORNET: return '#d2691e'; // Chocolate/Brown
      case BreadType.BAGUETTE: return '#cd853f'; // Crust brown
      case BreadType.BAGEL: return '#deb887'; // Baked beige
      case BreadType.EPI: return '#cd853f';
      case BreadType.CROISSANT: return '#daa520'; // Golden brown
      case BreadType.CINNAMON: return '#8b4513';
      case BreadType.FOCACCIA: return '#f5deb3'; // Light wheat
      case BreadType.PRETZEL: return '#6b4226'; // Dark crust
      case BreadType.DANISH: return '#ffd700'; // Butter gold
      case BreadType.BRIOCHE: return '#ffd700';
      case BreadType.RYE: return '#555555'; // Dark grey
      case BreadType.SOURDOUGH: return '#f5f5dc'; // Beige
      case BreadType.PANETTONE: return '#cd853f';
      case BreadType.SANDWICH: return '#ffffff'; // White bread
      case BreadType.TUNAPAN: return '#deb887';
      case BreadType.MEATPIE: return '#cd853f';
      default: return '#deb887';
    }
  }, [type]);

  const geometry = useMemo(() => {
    switch(type) {
      case BreadType.SHOKUPAN:
      case BreadType.FOCACCIA:
      case BreadType.SANDWICH:
      case BreadType.DANISH:
        return <boxGeometry args={[0.3, 0.25, 0.3]} />;
      case BreadType.BAGUETTE:
      case BreadType.EPI:
      case BreadType.CURRYPAN:
      case BreadType.SHIOPAN:
      case BreadType.CORNET:
        return <capsuleGeometry args={[0.08, 0.4, 4, 8]} />;
      case BreadType.BAGEL:
      case BreadType.CROISSANT:
      case BreadType.PRETZEL:
      case BreadType.CINNAMON:
        return <torusGeometry args={[0.12, 0.06, 8, 16]} />;
      case BreadType.PANETTONE:
        return <cylinderGeometry args={[0.15, 0.15, 0.3, 16]} />;
      default:
        return <sphereGeometry args={[0.15, 16, 16]} />;
    }
  }, [type]);

  const rotation: [number, number, number] = (type === BreadType.BAGUETTE || type === BreadType.EPI || type === BreadType.CURRYPAN || type === BreadType.SHIOPAN || type === BreadType.CORNET) ? [0, 0, Math.PI / 2] : 
                                               (type === BreadType.BAGEL || type === BreadType.CROISSANT || type === BreadType.PRETZEL || type === BreadType.CINNAMON) ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  const yOffset = (type === BreadType.BAGUETTE || type === BreadType.EPI || type === BreadType.CURRYPAN || type === BreadType.SHIOPAN || type === BreadType.CORNET) ? 0.1 : 0.15;

  return (
    <mesh castShadow receiveShadow rotation={rotation} position={[0, yOffset, 0]}>
      {geometry}
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
};

const EatInFurniture: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.6, 0.6, 0.05, 16]} />
      <meshStandardMaterial color="#5d4037" />
    </mesh>
    <mesh position={[0, 0.22, 0]} castShadow>
      <cylinderGeometry args={[0.05, 0.1, 0.45, 8]} />
      <meshStandardMaterial color="#3e2723" />
    </mesh>
    {[0, Math.PI].map((rot, i) => (
      <group key={i} rotation={[0, rot, 0]} position={[0, 0, 0]}>
        <group position={[0, 0, 0.8]}>
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.4, 0.05, 0.4]} />
            <meshStandardMaterial color="#795548" />
          </mesh>
          <mesh position={[0, 0.12, 0]} castShadow>
            <boxGeometry args={[0.35, 0.25, 0.35]} />
            <meshStandardMaterial color="#4e342e" />
          </mesh>
          <mesh position={[0, 0.5, 0.18]} castShadow>
            <boxGeometry args={[0.4, 0.4, 0.05]} />
            <meshStandardMaterial color="#795548" />
          </mesh>
        </group>
      </group>
    ))}
  </group>
);

interface SceneProps {
  lastSale: { id: number; bread: BreadType; timestamp: number } | null;
  inventory?: Record<BreadType, number>;
  eatInLevel?: number;
  staffCount?: number;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
}

const Bakery3DScene: React.FC<SceneProps> = ({ 
  lastSale, 
  inventory, 
  eatInLevel = 0,
  staffCount = 0,
  cameraPosition = [0, 5, 8],
  cameraFov = 45
}) => {
  const [customers, setCustomers] = useState<{ id: number; bread: BreadType }[]>([]);

  useEffect(() => {
    if (lastSale) {
      setCustomers(prev => [...prev, { id: lastSale.id, bread: lastSale.bread }]);
    }
  }, [lastSale]);

  const handleLeave = (id: number) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const availableBreads = useMemo(() => {
    if (!inventory) return [];
    return (Object.entries(inventory) as [string, number][])
      .filter(([, count]) => count > 0)
      .map(([type]) => type as BreadType);
  }, [inventory]);

  const counterBreads = availableBreads.slice(0, 4);
  const shelfBreads = availableBreads.slice(4, 12);

  const eatInSets = Math.min(4, Math.floor(eatInLevel / 5));

  // Safety check for Canvas which might be undefined if @react-three/fiber failed to load
  if (!Canvas) {
    return (
      <div className="w-full h-full bg-stone-100 flex items-center justify-center border-2 border-stone-200 rounded-xl">
        <p className="text-stone-400 font-bold">3D Scene Unavailable</p>
      </div>
    );
  }

  return (
    <Canvas shadows camera={{ position: cameraPosition, fov: cameraFov }}>
      <color attach="background" args={['#1a1a1a']} />
      <ambientLight intensity={0.5} color="#fff7ed" />
      <directionalLight position={[5, 10, 5]} intensity={1.0} castShadow />
      
      {/* Staff Area */}
      {Array.from({ length: staffCount }).map((_, i) => (
        <StaffMember key={i} index={i} position={[(i - (staffCount - 1) / 2) * 1.2, 0, -0.2]} />
      ))}

      {/* Furniture */}
      <group position={[0, 0, 1]}>
        <mesh position={[0, 0.6, 0]} receiveShadow><boxGeometry args={[4.5, 0.1, 1.2]} /><meshStandardMaterial color="#8b5a2b" /></mesh>
        <mesh position={[0, 0.3, 0]} receiveShadow><boxGeometry args={[4.3, 0.6, 1.0]} /><meshStandardMaterial color="#a0522d" /></mesh>
        {counterBreads.map((b, i) => (
          <group key={b} position={[(i - 1.5) * 1.0, 0.65, 0.1]}>
            <BreadMesh type={b} />
          </group>
        ))}
      </group>

      {/* Shelves */}
      <group position={[0, 0, -2]}>
        <mesh position={[0, 1.5, 0]} castShadow><boxGeometry args={[5, 3, 0.5]} /><meshStandardMaterial color="#d2b48c" /></mesh>
        {shelfBreads.map((b, i) => (
          <group key={b} position={[((i % 4) - 1.5) * 1.2, Math.floor(i / 4) + 1.1, 0.3]}><BreadMesh type={b} /></group>
        ))}
      </group>

      {/* Eat-in Area */}
      {eatInSets > 0 && (
        <group position={[0, 0, 5]}>
          {Array.from({ length: eatInSets }).map((_, i) => (
            <EatInFurniture key={i} position={[(i % 2 === 0 ? -2.5 : 2.5), 0, Math.floor(i / 2) * 2]} />
          ))}
        </group>
      )}

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#fef3c7" /></mesh>
      {customers.map(c => <Customer key={c.id} id={c.id} breadType={c.bread} onLeave={handleLeave} />)}
      <ContactShadows opacity={0.4} scale={20} blur={2} far={4.5} />
    </Canvas>
  );
};

export default Bakery3DScene;
