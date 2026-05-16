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
const DEFAULT_NOTE_TITLE = 'Untitled note';
const DEFAULT_NOTE_CONTENT = '<p>Click to edit...</p>';

const createDefaultContainers = (): ContainerData[] => [
  { id: '1', x: 100, y: 100, title: 'Quick Notes', content: DEFAULT_NOTE_CONTENT },
  { id: '2', x: 400, y: 150, title: 'Tasks', content: DEFAULT_NOTE_CONTENT },
];

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
      .map((container, index) => {
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
          id: candidate.id || `restored-${index}`,
          x: candidate.x,
          y: candidate.y,
          title:
            typeof candidate.title === 'string' && candidate.title.trim().length > 0
              ? candidate.title
              : `${DEFAULT_NOTE_TITLE} ${index + 1}`,
          content:
            typeof candidate.content === 'string' && candidate.content.trim().length > 0
              ? candidate.content
              : DEFAULT_NOTE_CONTENT,
        } satisfies ContainerData;
      })
      .filter((container): container is ContainerData => container !== null);

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
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [deletedStack, setDeletedStack] = useState<ContainerData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(containers));
  }, [containers]);

  const handlePositionChange = (id: string, x: number, y: number) => {
    setContainers((prev) => prev.map((c) => (c.id === id ? { ...c, x, y } : c)));
  };

  const handleUpdateContainer = useCallback((id: string, updates: Partial<Pick<ContainerData, 'title' | 'content'>>) => {
    setContainers((prev) => prev.map((container) => (container.id === id ? { ...container, ...updates } : container)));
  }, []);

  const handleCreateContainer = useCallback(
    (x: number, y: number, template?: Pick<ContainerData, 'title' | 'content'>) => {
      const timestamp = Date.now();
      const newContainer: ContainerData = {
        id: timestamp.toString(),
        x,
        y,
        title: template?.title || `${DEFAULT_NOTE_TITLE} ${containers.length + 1}`,
        content: template?.content || DEFAULT_NOTE_CONTENT,
      };
      setContainers((prev) => [...prev, newContainer]);
      setSelectedContainerId(newContainer.id);
    },
    [containers.length]
  );

  const handleAddContainer = () => {
    const position = getNextContainerPosition(containers.length);
    handleCreateContainer(position.x, position.y);
  };

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

  const filteredContainers = containers.filter((container) => {
    if (!searchQuery.trim()) {
      return true;
    }
    const query = searchQuery.toLowerCase();
    const plainText = container.content.replace(/<[^>]+>/g, ' ');
    return container.title.toLowerCase().includes(query) || plainText.toLowerCase().includes(query);
  });

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

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <div className="app-title">OneNote Evolution - Canvas Prototype</div>
          <div className="app-subtitle" aria-live="polite">
            {containers.length} note{containers.length === 1 ? '' : 's'} on this canvas
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search notes"
            placeholder="Search notes..."
          />
          <button type="button" className="header-button" onClick={handleAddContainer}>
            Add note
          </button>
          <button
            type="button"
            className="header-button"
            onClick={handleDuplicateSelected}
            aria-label="Duplicate selected note"
            disabled={!selectedContainerId}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="header-button"
            onClick={handleUndoDelete}
            aria-label="Undo delete"
            disabled={deletedStack.length === 0}
          >
            Undo delete
          </button>
        </div>
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
        {filteredContainers.map((c) => (
          <TextContainer
            key={c.id}
            id={c.id}
            x={c.x}
            y={c.y}
            title={c.title}
            content={c.content}
            onPositionChange={handlePositionChange}
            onContentChange={(id, content) => handleUpdateContainer(id, { content })}
            onDelete={handleDeleteContainer}
            onSelect={setSelectedContainerId}
            isSelected={selectedContainerId === c.id}
            onTitleChange={(id, title) => handleUpdateContainer(id, { title })}
          />
        ))}
      </Canvas>
      <footer className="app-footer">
        Double-click canvas to create. Search notes by title/content. Delete selected note with Del/Backspace.
      </footer>
    </div>
  );
}

export default App;
