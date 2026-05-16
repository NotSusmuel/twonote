import { useState, useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { TextContainer } from './components/TextContainer';
import './styles/variables.css';
import './App.css';

interface ContainerData {
  id: string;
  x: number;
  y: number;
  content: string;
}

const STORAGE_KEY = 'onenote-evolution-prototype-data';
const DEFAULT_NOTE_CONTENT = '<p>Click to edit...</p>';

const createDefaultContainers = (): ContainerData[] => [
  { id: '1', x: 100, y: 100, content: DEFAULT_NOTE_CONTENT },
  { id: '2', x: 400, y: 150, content: DEFAULT_NOTE_CONTENT },
];

const isValidContainer = (value: unknown): value is ContainerData => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ContainerData>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.x === 'number' &&
    typeof candidate.y === 'number' &&
    typeof candidate.content === 'string'
  );
};

const loadContainers = (): ContainerData[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return createDefaultContainers();
    }

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return createDefaultContainers();
    }

    const hydrated = parsed
      .map((container) => {
        if (!container || typeof container !== 'object') {
          return null;
        }

        const candidate = container as Partial<ContainerData>;

        if (
          typeof candidate.id !== 'string' ||
          typeof candidate.x !== 'number' ||
          typeof candidate.y !== 'number'
        ) {
          return null;
        }

        return {
          id: candidate.id,
          x: candidate.x,
          y: candidate.y,
          content:
            typeof candidate.content === 'string' && candidate.content.trim().length > 0
              ? candidate.content
              : DEFAULT_NOTE_CONTENT,
        };
      })
      .filter(isValidContainer);

    return hydrated.length > 0 ? hydrated : createDefaultContainers();
  } catch {
    return createDefaultContainers();
  }
};

const getNextContainerPosition = (count: number) => ({
  x: 120 + (count % 3) * 180,
  y: 100 + (count % 4) * 70,
});

function App() {
  const [containers, setContainers] = useState<ContainerData[]>(loadContainers);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(containers));
  }, [containers]);

  const handlePositionChange = (id: string, x: number, y: number) => {
    setContainers((prev) => prev.map((c) => (c.id === id ? { ...c, x, y } : c)));
  };

  const handleContentChange = (id: string, content: string) => {
    setContainers((prev) => prev.map((c) => (c.id === id ? { ...c, content } : c)));
  };

  const handleCreateContainer = (x: number, y: number) => {
    const newContainer: ContainerData = {
      id: Date.now().toString(),
      x,
      y,
      content: DEFAULT_NOTE_CONTENT,
    };
    setContainers((prev) => [...prev, newContainer]);
  };

  const handleAddContainer = () => {
    const position = getNextContainerPosition(containers.length);
    handleCreateContainer(position.x, position.y);
  };

  const handleDeleteContainer = (id: string) => {
    setContainers((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCanvasClick = () => {
    // Potentially used for global de-selection if needed
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <div className="app-title">OneNote Evolution - Canvas Prototype</div>
          <div className="app-subtitle" aria-live="polite">
            {containers.length} note{containers.length === 1 ? '' : 's'} on this canvas
          </div>
        </div>
        <button type="button" className="header-button" onClick={handleAddContainer}>
          Add note
        </button>
      </header>
      <Canvas onDoubleClick={handleCreateContainer} onCanvasClick={handleCanvasClick}>
        {containers.length === 0 && (
          <div className="empty-state" role="status">
            <h2>Canvas is empty</h2>
            <p>Create a note to start capturing ideas.</p>
            <button type="button" className="header-button" onClick={handleAddContainer}>
              Create your first note
            </button>
          </div>
        )}
        {containers.map((c) => (
          <TextContainer
            key={c.id}
            id={c.id}
            x={c.x}
            y={c.y}
            content={c.content}
            onPositionChange={handlePositionChange}
            onContentChange={handleContentChange}
            onDelete={handleDeleteContainer}
          />
        ))}
      </Canvas>
      <footer className="app-footer">
        Double-click canvas to create. Drag handle to move.
      </footer>
    </div>
  );
}

export default App;
