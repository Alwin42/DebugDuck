import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Cloud, Search, Plus, Minus, RotateCcw, Play, Pause } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Crumb {
  id: string;
  x: number;
  y: number;
  type: 'sugar' | 'protein' | 'fat' | 'mystery';
  name: string;
}

interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'furniture' | 'danger' | 'liquid';
  name: string;
}

interface Ant {
  x: number;
  y: number;
  angle: number;
  path: Point[];
  currentTarget: number;
  isMoving: boolean;
}

const GRID_SIZE = 40;
const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;

const initialCrumbs: Crumb[] = [
  { id: '1', x: 150, y: 400, type: 'sugar', name: 'Fallen Dorito Crater' },
  { id: '2', x: 600, y: 200, type: 'protein', name: 'Cheese Crumb Valley' },
  { id: '3', x: 300, y: 500, type: 'mystery', name: 'Mysterious Sticky Spot' },
  { id: '4', x: 700, y: 450, type: 'fat', name: 'Butter Mountain' },
];

const initialObstacles: Obstacle[] = [
  { id: '1', x: 200, y: 100, width: 100, height: 60, type: 'furniture', name: 'Sofa Leg of Doom' },
  { id: '2', x: 500, y: 300, width: 80, height: 40, type: 'danger', name: 'Giant Slipper Hazard' },
  { id: '3', x: 100, y: 250, width: 60, height: 60, type: 'furniture', name: 'Table Leg Canyon' },
  { id: '4', x: 650, y: 100, width: 90, height: 30, type: 'liquid', name: 'Water Spill Lake' },
];

const weatherConditions = [
  { condition: 'Optimal', humidity: 85, temp: 72, description: 'Perfect for pheromone trails!' },
  { condition: 'Dry', humidity: 45, temp: 78, description: 'Trails fading quickly. Stay hydrated!' },
  { condition: 'Humid', humidity: 95, temp: 68, description: 'Slippery surfaces. Extra grip recommended.' },
  { condition: 'Cleaning Alert', humidity: 70, temp: 75, description: '⚠️ DANGER: Broom sweep detected nearby!' },
];

function App() {
  const [crumbs, setCrumbs] = useState<Crumb[]>(initialCrumbs);
  const [obstacles, setObstacles] = useState<Obstacle[]>(initialObstacles);
  const [ant, setAnt] = useState<Ant>({
    x: 50,
    y: 50,
    angle: 0,
    path: [],
    currentTarget: 0,
    isMoving: false
  });
  const [selectedCrumb, setSelectedCrumb] = useState<string | null>(null);
  const [weather] = useState(weatherConditions[0]);
  const [zoom, setZoom] = useState(1);
  const [isPlacing, setIsPlacing] = useState<'crumb' | 'obstacle' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [transitMode, setTransitMode] = useState<'walk' | 'climb' | 'hitchhike'>('walk');
  
  const mapRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // A* Pathfinding Algorithm
  const findPath = useCallback((start: Point, end: Point): Point[] => {
    const grid: number[][] = [];
    const rows = Math.ceil(MAP_HEIGHT / 10);
    const cols = Math.ceil(MAP_WIDTH / 10);
    
    // Initialize grid
    for (let i = 0; i < rows; i++) {
      grid[i] = new Array(cols).fill(0);
    }
    
    // Mark obstacles
    obstacles.forEach(obstacle => {
      for (let y = Math.floor(obstacle.y / 10); y < Math.floor((obstacle.y + obstacle.height) / 10); y++) {
        for (let x = Math.floor(obstacle.x / 10); x < Math.floor((obstacle.x + obstacle.width) / 10); x++) {
          if (y >= 0 && y < rows && x >= 0 && x < cols) {
            grid[y][x] = 1;
          }
        }
      }
    });

    // Simple pathfinding (for demo purposes, using a simplified version)
    const path: Point[] = [start];
    let current = { ...start };
    
    while (Math.abs(current.x - end.x) > 10 || Math.abs(current.y - end.y) > 10) {
      const dx = end.x - current.x;
      const dy = end.y - current.y;
      
      const stepX = dx > 0 ? 10 : dx < 0 ? -10 : 0;
      const stepY = dy > 0 ? 10 : dy < 0 ? -10 : 0;
      
      let next = { x: current.x + stepX, y: current.y + stepY };
      
      // Check for obstacles and try alternative routes
      const gridX = Math.floor(next.x / 10);
      const gridY = Math.floor(next.y / 10);
      
      if (gridY >= 0 && gridY < rows && gridX >= 0 && gridX < cols && grid[gridY][gridX] === 1) {
        // Try going around obstacle
        if (Math.abs(dx) > Math.abs(dy)) {
          next = { x: current.x, y: current.y + (dy > 0 ? 20 : -20) };
        } else {
          next = { x: current.x + (dx > 0 ? 20 : -20), y: current.y };
        }
      }
      
      current = next;
      path.push({ ...current });
      
      // Prevent infinite loops
      if (path.length > 100) break;
    }
    
    path.push(end);
    return path;
  }, [obstacles]);

  const moveAnt = useCallback(() => {
    setAnt(prev => {
      if (!prev.isMoving || prev.path.length === 0) return prev;
      
      const target = prev.path[prev.currentTarget];
      if (!target) return { ...prev, isMoving: false };
      
      const dx = target.x - prev.x;
      const dy = target.y - prev.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 2) {
        const nextTarget = prev.currentTarget + 1;
        if (nextTarget >= prev.path.length) {
          return { ...prev, isMoving: false, currentTarget: 0 };
        }
        return { ...prev, currentTarget: nextTarget };
      }
      
      const speed = transitMode === 'hitchhike' ? 4 : transitMode === 'climb' ? 1.5 : 2;
      const angle = Math.atan2(dy, dx);
      
      return {
        ...prev,
        x: prev.x + (dx / distance) * speed,
        y: prev.y + (dy / distance) * speed,
        angle: angle
      };
    });
  }, [transitMode]);

  useEffect(() => {
    const animate = () => {
      moveAnt();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    if (ant.isMoving) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [ant.isMoving, moveAnt]);

  const navigateToDestination = (destination: Point) => {
    const path = findPath({ x: ant.x, y: ant.y }, destination);
    setAnt(prev => ({
      ...prev,
      path,
      currentTarget: 0,
      isMoving: true
    }));
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    if (isPlacing === 'crumb') {
      const newCrumb: Crumb = {
        id: Date.now().toString(),
        x,
        y,
        type: 'mystery',
        name: `Mystery Morsel ${crumbs.length + 1}`
      };
      setCrumbs(prev => [...prev, newCrumb]);
      setIsPlacing(null);
    } else if (isPlacing === 'obstacle') {
      const newObstacle: Obstacle = {
        id: Date.now().toString(),
        x,
        y,
        width: 60,
        height: 40,
        type: 'furniture',
        name: `New Obstacle ${obstacles.length + 1}`
      };
      setObstacles(prev => [...prev, newObstacle]);
      setIsPlacing(null);
    } else {
      navigateToDestination({ x, y });
    }
  };

  const getCrumbColor = (type: string) => {
    switch (type) {
      case 'sugar': return 'bg-yellow-400';
      case 'protein': return 'bg-red-400';
      case 'fat': return 'bg-orange-400';
      default: return 'bg-purple-400';
    }
  };

  const getObstacleColor = (type: string) => {
    switch (type) {
      case 'furniture': return 'bg-amber-700';
      case 'danger': return 'bg-red-600';
      case 'liquid': return 'bg-blue-400';
      default: return 'bg-gray-600';
    }
  };

  const filteredCrumbs = crumbs.filter(crumb => 
    crumb.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRouteTime = () => {
    const baseTime = ant.path.length * 0.1;
    const modifier = transitMode === 'hitchhike' ? 0.5 : transitMode === 'climb' ? 2 : 1;
    return (baseTime * modifier).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-amber-400">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-amber-800">AntMaps</h1>
                <p className="text-sm text-amber-600">Micro-navigation for the tiniest explorers</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for crumbs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3 space-y-6">
            {/* Weather Card */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Cloud className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-800">Ant Weather</h3>
              </div>
              <div className="space-y-2">
                <div className="text-lg font-bold text-blue-600">{weather.condition}</div>
                <div className="text-sm text-gray-600">
                  Humidity: {weather.humidity}%<br />
                  Temperature: {weather.temp}°F
                </div>
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  {weather.description}
                </p>
              </div>
            </div>

            {/* Transit Modes */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Transit Mode</h3>
              <div className="space-y-2">
                {[
                  { mode: 'walk', label: 'Walking', emoji: '🚶‍♂️', speed: 'Normal' },
                  { mode: 'climb', label: 'Wall Climbing', emoji: '🧗‍♂️', speed: 'Slow' },
                  { mode: 'hitchhike', label: 'Pet Hitchhike', emoji: '🐕', speed: 'Fast' }
                ].map(({ mode, label, emoji, speed }) => (
                  <button
                    key={mode}
                    onClick={() => setTransitMode(mode as any)}
                    className={`w-full p-2 rounded-lg text-left transition-colors ${
                      transitMode === mode
                        ? 'bg-amber-100 border-2 border-amber-400'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{emoji} {label}</span>
                      <span className="text-xs text-gray-500">{speed}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Map Controls</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setIsPlacing(isPlacing === 'crumb' ? null : 'crumb')}
                  className={`w-full p-2 rounded-lg font-medium transition-colors ${
                    isPlacing === 'crumb'
                      ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  🍞 Place Crumb
                </button>
                <button
                  onClick={() => setIsPlacing(isPlacing === 'obstacle' ? null : 'obstacle')}
                  className={`w-full p-2 rounded-lg font-medium transition-colors ${
                    isPlacing === 'obstacle'
                      ? 'bg-red-100 text-red-800 border-2 border-red-400'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  🚧 Place Obstacle
                </button>
                <button
                  onClick={() => setAnt(prev => ({ ...prev, isMoving: !prev.isMoving }))}
                  className="w-full p-2 rounded-lg font-medium bg-green-100 hover:bg-green-200 text-green-800 flex items-center justify-center space-x-2"
                >
                  {ant.isMoving ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{ant.isMoving ? 'Pause' : 'Start'} Ant</span>
                </button>
              </div>
            </div>

            {/* Destination List */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Food Locations</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredCrumbs.map(crumb => (
                  <button
                    key={crumb.id}
                    onClick={() => navigateToDestination({ x: crumb.x, y: crumb.y })}
                    className="w-full p-2 rounded-lg text-left hover:bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getCrumbColor(crumb.type)}`}></div>
                      <div>
                        <div className="font-medium text-sm">{crumb.name}</div>
                        <div className="text-xs text-gray-500">{crumb.type}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Map */}
          <div className="col-span-9">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Map Header */}
              <div className="bg-amber-500 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Navigation className="w-5 h-5" />
                    <div>
                      <div className="font-semibold">Living Room Explorer</div>
                      <div className="text-sm opacity-90">
                        {ant.isMoving ? `ETA: ${getRouteTime()}s via ${transitMode}` : 'Click to navigate'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                      className="p-2 bg-amber-600 hover:bg-amber-700 rounded"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
                    <button
                      onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                      className="p-2 bg-amber-600 hover:bg-amber-700 rounded"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setZoom(1)}
                      className="p-2 bg-amber-600 hover:bg-amber-700 rounded"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Map Container */}
              <div className="relative overflow-hidden" style={{ height: '600px' }}>
                <div
                  ref={mapRef}
                  onClick={handleMapClick}
                  className="relative bg-gradient-to-br from-amber-50 to-orange-50 cursor-crosshair transition-transform duration-200"
                  style={{
                    width: MAP_WIDTH,
                    height: MAP_HEIGHT,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left'
                  }}
                >
                  {/* Grid Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    {Array.from({ length: Math.ceil(MAP_WIDTH / GRID_SIZE) }).map((_, i) => (
                      <div
                        key={`v-${i}`}
                        className="absolute top-0 bottom-0 w-px bg-gray-400"
                        style={{ left: i * GRID_SIZE }}
                      />
                    ))}
                    {Array.from({ length: Math.ceil(MAP_HEIGHT / GRID_SIZE) }).map((_, i) => (
                      <div
                        key={`h-${i}`}
                        className="absolute left-0 right-0 h-px bg-gray-400"
                        style={{ top: i * GRID_SIZE }}
                      />
                    ))}
                  </div>

                  {/* Obstacles */}
                  {obstacles.map(obstacle => (
                    <div
                      key={obstacle.id}
                      className={`absolute ${getObstacleColor(obstacle.type)} rounded-lg shadow-md border-2 border-gray-700 opacity-80`}
                      style={{
                        left: obstacle.x,
                        top: obstacle.y,
                        width: obstacle.width,
                        height: obstacle.height
                      }}
                      title={obstacle.name}
                    >
                      <div className="p-1 text-xs text-white font-bold text-center truncate">
                        {obstacle.name}
                      </div>
                    </div>
                  ))}

                  {/* Crumbs */}
                  {crumbs.map(crumb => (
                    <div
                      key={crumb.id}
                      className={`absolute w-6 h-6 ${getCrumbColor(crumb.type)} rounded-full shadow-lg border-2 border-white cursor-pointer transform hover:scale-110 transition-transform`}
                      style={{
                        left: crumb.x - 12,
                        top: crumb.y - 12
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToDestination({ x: crumb.x, y: crumb.y });
                      }}
                      title={crumb.name}
                    />
                  ))}

                  {/* Ant Path */}
                  {ant.path.length > 1 && (
                    <svg className="absolute inset-0 pointer-events-none">
                      <polyline
                        points={ant.path.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        className="animate-pulse"
                      />
                    </svg>
                  )}

                  {/* Ant */}
                  <div
                    className="absolute w-8 h-8 transition-all duration-100"
                    style={{
                      left: ant.x - 16,
                      top: ant.y - 16,
                      transform: `rotate(${ant.angle}rad)`
                    }}
                  >
                    <div className="w-full h-full bg-black rounded-full flex items-center justify-center shadow-lg border-2 border-amber-400">
                      <span className="text-xs">🐜</span>
                    </div>
                  </div>

                  {/* Click Instructions */}
                  {isPlacing && (
                    <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg">
                      <p className="text-sm font-medium text-gray-800">
                        {isPlacing === 'crumb' ? '🍞 Click to place a crumb' : '🚧 Click to place an obstacle'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;