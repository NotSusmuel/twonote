import { useState, useEffect } from "react";
import { Canvas } from "./components/Canvas";
import { TextContainer } from "./components/TextContainer";
import "./App.css";

interface ContainerData {
  id: string;
  x: number;
  y: number;
}

const STORAGE_KEY = 'onenote-evolution-prototype-data';

function App() {
  const [containers, setContainers] = useState<ContainerData[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [
      { id: '1', x: 100, y: 100 },
      { id: '2', x: 400, y: 150 },
    ];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(containers));
  }, [containers]);

  const handlePositionChange = (id: string, x: number, y: number) => {
    setContainers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, x, y } : c))
    );
  };

  const handleCreateContainer = (x: number, y: number) => {
    const newContainer: ContainerData = {
      id: Date.now().toString(),
      x,
      y,
    };
    setContainers((prev) => [...prev, newContainer]);
  };

  const handleDeleteContainer = (id: string) => {
    setContainers((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCanvasClick = () => {
    // Potentially used for global de-selection if needed
  };

  return (
    <div className="app-container">
      <header style={{
        height: '40px',
        backgroundColor: '#7719aa', // OneNote Purple
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        fontWeight: 'bold',
        fontSize: '14px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000,
        position: 'relative'
      }}>
        OneNote Evolution - Canvas Prototype
      </header>
      <Canvas 
        onDoubleClick={handleCreateContainer}
        onCanvasClick={handleCanvasClick}
      >
        {containers.map((c) => (
          <TextContainer
            key={c.id}
            id={c.id}
            x={c.x}
            y={c.y}
            onPositionChange={handlePositionChange}
            onDelete={handleDeleteContainer}
          />
        ))}
      </Canvas>
      <footer style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        fontSize: '10px',
        color: '#888',
        pointerEvents: 'none'
      }}>
        Double-click canvas to create. Drag handle to move.
      </footer>
    </div>
  );
}

export default App;
