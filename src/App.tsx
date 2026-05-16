import { useState, useEffect, useCallback } from 'react';
import { Canvas } from './components/Canvas';
import { TextContainer } from './components/TextContainer';
import './styles/variables.css';
import './App.css';

interface ContainerData {
  id: string;
  x: number;
  y: number;
}

const STORAGE_KEY = 'onenote-evolution-prototype-data';
const INITIAL_CONTAINERS: ContainerData[] = [
  { id: '1', x: 100, y: 100 },
  { id: '2', x: 400, y: 150 },
];

function App() {
  const [containers, setContainers] = useState<ContainerData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as ContainerData[]) : INITIAL_CONTAINERS;
    } catch {
      return INITIAL_CONTAINERS;
    }
  });
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [deletedStack, setDeletedStack] = useState<ContainerData[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(containers));
  }, [containers]);

  const handlePositionChange = (id: string, x: number, y: number) => {
    setContainers((prev) => prev.map((c) => (c.id === id ? { ...c, x, y } : c)));
  };

  const handleCreateContainer = useCallback((x: number, y: number) => {
    const newContainer: ContainerData = {
      id: Date.now().toString(),
      x,
      y,
    };
    setContainers((prev) => [...prev, newContainer]);
    setSelectedContainerId(newContainer.id);
  }, []);

  const handleDeleteContainer = useCallback((id: string) => {
    setContainers((prev) => {
      const toDelete = prev.find((c) => c.id === id);
      if (toDelete) {
        setDeletedStack((stack) => [...stack, toDelete]);
      }
      return prev.filter((c) => c.id !== id);
    });
    setSelectedContainerId((selected) => (selected === id ? null : selected));
  }, []);

  const handleUndoDelete = useCallback(() => {
    setDeletedStack((stack) => {
      if (stack.length === 0) {
        return stack;
      }
      const restored = stack[stack.length - 1];
      setContainers((prev) => [...prev, restored]);
      setSelectedContainerId(restored.id);
      return stack.slice(0, -1);
    });
  }, []);

  const handleCanvasClick = () => {
    setSelectedContainerId(null);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.isContentEditable ||
        target?.closest('.tiptap') !== null ||
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT';

      if (isTyping) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        handleUndoDelete();
        return;
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedContainerId) {
        event.preventDefault();
        handleDeleteContainer(selectedContainerId);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDeleteContainer, handleUndoDelete, selectedContainerId]);

  const handleQuickCreate = () => {
    handleCreateContainer(200, 200);
  };

  return (
    <div className="app-container">
      <header
        style={{
          height: '40px',
          backgroundColor: 'var(--color-bg-header)',
          color: 'var(--color-text-on-primary)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-4)',
          fontWeight: 'bold',
          fontSize: '14px',
          boxShadow: 'var(--shadow-md)',
          zIndex: 1000,
          position: 'relative',
          justifyContent: 'space-between',
        }}
      >
        <span>OneNote Evolution - Canvas Prototype</span>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button onClick={handleQuickCreate} aria-label="Create note">
            New note
          </button>
          <button onClick={handleUndoDelete} aria-label="Undo delete" disabled={deletedStack.length === 0}>
            Undo delete
          </button>
        </div>
      </header>
      <Canvas onDoubleClick={handleCreateContainer} onCanvasClick={handleCanvasClick}>
        {containers.map((c) => (
          <TextContainer
            key={c.id}
            id={c.id}
            x={c.x}
            y={c.y}
            onPositionChange={handlePositionChange}
            onDelete={handleDeleteContainer}
            onSelect={setSelectedContainerId}
            isSelected={selectedContainerId === c.id}
          />
        ))}
      </Canvas>
      <footer
        style={{
          position: 'fixed',
          bottom: 'var(--space-2)',
          right: 'var(--space-2)',
          fontSize: '10px',
          color: 'var(--color-text-secondary)',
          pointerEvents: 'none',
        }}
      >
        Double-click canvas to create. Delete selected note with Del/Backspace. Undo with Ctrl/Cmd+Z.
      </footer>
    </div>
  );
}

export default App;
