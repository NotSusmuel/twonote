import { useState, useEffect, useCallback } from 'react';
import { Canvas } from './components/Canvas';
import { TextContainer } from './components/TextContainer';
import './styles/variables.css';
import './App.css';

interface ContainerData {
  id: string;
  x: number;
  y: number;
  title: string;
  content: string;
}

const STORAGE_KEY = 'onenote-evolution-prototype-data';
const INITIAL_CONTAINERS: ContainerData[] = [
  { id: '1', x: 100, y: 100, title: 'Quick Notes', content: '<p>Click to edit...</p>' },
  { id: '2', x: 400, y: 150, title: 'Tasks', content: '<p>Click to edit...</p>' },
];

const normalizeContainer = (container: Partial<ContainerData>, fallbackId: string): ContainerData => ({
  id: container.id ?? fallbackId,
  x: typeof container.x === 'number' ? container.x : 100,
  y: typeof container.y === 'number' ? container.y : 100,
  title: typeof container.title === 'string' ? container.title : 'Untitled note',
  content: typeof container.content === 'string' ? container.content : '<p>Click to edit...</p>',
});

function App() {
  const [containers, setContainers] = useState<ContainerData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return INITIAL_CONTAINERS;
      }
      const parsed = JSON.parse(saved) as Partial<ContainerData>[];
      if (!Array.isArray(parsed)) {
        return INITIAL_CONTAINERS;
      }
      return parsed.map((container, index) => normalizeContainer(container, `restored-${index}`));
    } catch {
      return INITIAL_CONTAINERS;
    }
  });
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [deletedStack, setDeletedStack] = useState<ContainerData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(containers));
  }, [containers]);

  const handlePositionChange = (id: string, x: number, y: number) => {
    setContainers((prev) => prev.map((c) => (c.id === id ? { ...c, x, y } : c)));
  };

  const handleCreateContainer = useCallback(
    (x: number, y: number, template?: Pick<ContainerData, 'title' | 'content'>) => {
      const timestamp = Date.now();
      const defaultTitle = `Untitled note ${containers.length + 1}`;
      const newContainer: ContainerData = {
        id: timestamp.toString(),
        x,
        y,
        title: template?.title || defaultTitle,
        content: template?.content || '<p>Click to edit...</p>',
      };
      setContainers((prev) => [...prev, newContainer]);
      setSelectedContainerId(newContainer.id);
    },
    [containers.length]
  );

  const handleDuplicateSelected = useCallback(() => {
    if (!selectedContainerId) {
      return;
    }
    const selected = containers.find((c) => c.id === selectedContainerId);
    if (!selected) {
      return;
    }
    handleCreateContainer(selected.x + 40, selected.y + 40, {
      title: `${selected.title} (Copy)`,
      content: selected.content,
    });
  }, [containers, handleCreateContainer, selectedContainerId]);

  const handleUpdateContainer = useCallback(
    (id: string, updates: Partial<Pick<ContainerData, 'title' | 'content'>>) => {
      setContainers((prev) => prev.map((container) => (container.id === id ? { ...container, ...updates } : container)));
    },
    []
  );

  const filteredContainers = containers.filter((container) => {
    if (!searchQuery.trim()) {
      return true;
    }
    const query = searchQuery.toLowerCase();
    const plainText = container.content.replace(/<[^>]+>/g, ' ');
    return container.title.toLowerCase().includes(query) || plainText.toLowerCase().includes(query);
  });

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
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search notes"
            placeholder="Search notes..."
          />
          <button onClick={handleQuickCreate} aria-label="Create note">
            New note
          </button>
          <button onClick={handleDuplicateSelected} aria-label="Duplicate selected note" disabled={!selectedContainerId}>
            Duplicate
          </button>
          <button onClick={handleUndoDelete} aria-label="Undo delete" disabled={deletedStack.length === 0}>
            Undo delete
          </button>
        </div>
      </header>
      <Canvas onDoubleClick={handleCreateContainer} onCanvasClick={handleCanvasClick}>
        {filteredContainers.map((c) => (
          <TextContainer
            key={c.id}
            id={c.id}
            x={c.x}
            y={c.y}
            title={c.title}
            content={c.content}
            onPositionChange={handlePositionChange}
            onDelete={handleDeleteContainer}
            onSelect={setSelectedContainerId}
            isSelected={selectedContainerId === c.id}
            onTitleChange={(id, title) => handleUpdateContainer(id, { title })}
            onContentChange={(id, content) => handleUpdateContainer(id, { content })}
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
        Double-click canvas to create. Search notes by title/content. Delete selected note with Del/Backspace.
      </footer>
    </div>
  );
}

export default App;
