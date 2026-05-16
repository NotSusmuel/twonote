import { useState, useEffect, useMemo, useCallback } from 'react';
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

interface PageData {
  id: string;
  title: string;
  containers: ContainerData[];
}

interface SectionData {
  id: string;
  name: string;
  pages: PageData[];
}

interface NotebookData {
  id: string;
  name: string;
  sections: SectionData[];
}

interface SyncPayload {
  notebooks: NotebookData[];
  synced_at: string;
}

const STORAGE_KEY = 'onenote-evolution-notebooks-data';
const DEFAULT_NOTE_TITLE = 'Untitled note';
const DEFAULT_NOTE_CONTENT = '<p>Click to edit...</p>';

const createDefaultContainers = (): ContainerData[] => [
  { id: '1', x: 100, y: 100, title: 'Quick Notes', content: DEFAULT_NOTE_CONTENT },
  { id: '2', x: 400, y: 150, title: 'Tasks', content: DEFAULT_NOTE_CONTENT },
];

const createDefaultNotebooks = (): NotebookData[] => [
  {
    id: 'notebook-default',
    name: 'My Notebook',
    sections: [
      {
        id: 'section-general',
        name: 'General',
        pages: [{ id: 'page-welcome', title: 'Welcome', containers: createDefaultContainers() }],
      },
      {
        id: 'section-projects',
        name: 'Projects',
        pages: [{ id: 'page-ideas', title: 'Ideas', containers: [] }],
      },
    ],
  },
];

const normalizeContainer = (candidate: unknown, index: number): ContainerData | null => {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const parsed = candidate as Partial<ContainerData>;
  if (typeof parsed.id !== 'string' || typeof parsed.x !== 'number' || typeof parsed.y !== 'number') {
    return null;
  }

  return {
    id: parsed.id || `restored-${index}`,
    x: parsed.x,
    y: parsed.y,
    title:
      typeof parsed.title === 'string' && parsed.title.trim().length > 0
        ? parsed.title
        : `${DEFAULT_NOTE_TITLE} ${index + 1}`,
    content:
      typeof parsed.content === 'string' && parsed.content.trim().length > 0
        ? parsed.content
        : DEFAULT_NOTE_CONTENT,
  };
};

const loadNotebooks = (): NotebookData[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return createDefaultNotebooks();
    }

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      return createDefaultNotebooks();
    }

    if (parsed.every((item) => item && typeof item === 'object' && 'x' in item && 'y' in item)) {
      const legacyContainers = parsed
        .map((container, index) => normalizeContainer(container, index))
        .filter((container): container is ContainerData => container !== null);

      return [
        {
          id: 'notebook-legacy',
          name: 'Imported Notebook',
          sections: [
            {
              id: 'section-legacy',
              name: 'Imported Section',
              pages: [
                {
                  id: 'page-legacy',
                  title: 'Imported Page',
                  containers: legacyContainers.length > 0 ? legacyContainers : createDefaultContainers(),
                },
              ],
            },
          ],
        },
      ];
    }

    const notebooks = parsed
      .map((notebook, notebookIndex) => {
        if (!notebook || typeof notebook !== 'object') {
          return null;
        }
        const candidateNotebook = notebook as Partial<NotebookData>;
        if (typeof candidateNotebook.id !== 'string' || typeof candidateNotebook.name !== 'string') {
          return null;
        }

        const sections = Array.isArray(candidateNotebook.sections)
          ? candidateNotebook.sections
              .map((section, sectionIndex) => {
                if (!section || typeof section !== 'object') {
                  return null;
                }
                const candidateSection = section as Partial<SectionData>;
                if (typeof candidateSection.id !== 'string' || typeof candidateSection.name !== 'string') {
                  return null;
                }

                const pages = Array.isArray(candidateSection.pages)
                  ? candidateSection.pages
                      .map((page, pageIndex) => {
                        if (!page || typeof page !== 'object') {
                          return null;
                        }
                        const candidatePage = page as Partial<PageData>;
                        if (typeof candidatePage.id !== 'string' || typeof candidatePage.title !== 'string') {
                          return null;
                        }

                        const containers = Array.isArray(candidatePage.containers)
                          ? candidatePage.containers
                              .map((container, containerIndex) => normalizeContainer(container, containerIndex))
                              .filter((container): container is ContainerData => container !== null)
                          : [];

                        return {
                          id: candidatePage.id,
                          title: candidatePage.title,
                          containers,
                        } satisfies PageData;
                      })
                      .filter((page): page is PageData => page !== null)
                  : [];

                return {
                  id: candidateSection.id,
                  name: candidateSection.name,
                  pages: pages.length > 0 ? pages : [{ id: `page-fallback-${sectionIndex}`, title: 'Untitled Page', containers: [] }],
                } satisfies SectionData;
              })
              .filter((section): section is SectionData => section !== null)
          : [];

        return {
          id: candidateNotebook.id || `notebook-${notebookIndex}`,
          name: candidateNotebook.name || `Notebook ${notebookIndex + 1}`,
          sections:
            sections.length > 0
              ? sections
              : [{ id: `section-fallback-${notebookIndex}`, name: 'General', pages: [{ id: `page-fallback-${notebookIndex}`, title: 'Untitled Page', containers: [] }] }],
        } satisfies NotebookData;
      })
      .filter((notebook): notebook is NotebookData => notebook !== null);

    return notebooks.length > 0 ? notebooks : createDefaultNotebooks();
  } catch {
    return createDefaultNotebooks();
  }
};

const getNextContainerPosition = (count: number) => ({
  x: 120 + (count % 3) * 180,
  y: 100 + (count % 4) * 70,
});

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

const isTauriRuntime = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const invokeTauri = async <T,>(command: string, args?: Record<string, unknown>): Promise<T | null> => {
  if (!isTauriRuntime()) {
    return null;
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, args);
};

function App() {
  const [notebooks, setNotebooks] = useState<NotebookData[]>(() => {
    const loaded = loadNotebooks();
    return loaded;
  });
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [deletedStack, setDeletedStack] = useState<Array<{ pageId: string; container: ContainerData }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncState, setSyncState] = useState<{ isSyncing: boolean; message: string }>({
    isSyncing: false,
    message: 'Sync ready',
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notebooks));
  }, [notebooks]);

  useEffect(() => {
    void (async () => {
      const status = await invokeTauri<{ is_syncing: boolean; last_sync_at?: string }>('get_sync_status');
      if (status) {
        setSyncState({
          isSyncing: status.is_syncing,
          message: status.last_sync_at ? `Last sync: ${status.last_sync_at}` : 'Sync ready',
        });
      }
    })();
  }, []);

  const selectedNotebook = useMemo(
    () => notebooks.find((notebook) => notebook.id === selectedNotebookId) ?? notebooks[0] ?? null,
    [notebooks, selectedNotebookId],
  );
  const selectedSection = useMemo(
    () => selectedNotebook?.sections.find((section) => section.id === selectedSectionId) ?? selectedNotebook?.sections[0] ?? null,
    [selectedNotebook, selectedSectionId],
  );
  const selectedPage = useMemo(
    () => selectedSection?.pages.find((page) => page.id === selectedPageId) ?? selectedSection?.pages[0] ?? null,
    [selectedSection, selectedPageId],
  );

  useEffect(() => {
    if (!selectedNotebookId && notebooks[0]) {
      setSelectedNotebookId(notebooks[0].id);
    }
  }, [notebooks, selectedNotebookId]);

  useEffect(() => {
    if (!selectedSectionId && notebooks[0]?.sections[0]) {
      setSelectedSectionId(notebooks[0].sections[0].id);
    }
  }, [notebooks, selectedSectionId]);

  useEffect(() => {
    if (!selectedPageId && notebooks[0]?.sections[0]?.pages[0]) {
      setSelectedPageId(notebooks[0].sections[0].pages[0].id);
    }
  }, [notebooks, selectedPageId]);

  useEffect(() => {
    if (!selectedNotebook && notebooks[0]) {
      setSelectedNotebookId(notebooks[0].id);
    }
  }, [notebooks, selectedNotebook]);

  useEffect(() => {
    if (!selectedSection && selectedNotebook?.sections[0]) {
      setSelectedSectionId(selectedNotebook.sections[0].id);
    }
  }, [selectedNotebook, selectedSection]);

  useEffect(() => {
    if (!selectedPage && selectedSection?.pages[0]) {
      setSelectedPageId(selectedSection.pages[0].id);
    }
  }, [selectedSection, selectedPage]);

  const updateCurrentPage = useCallback(
    (updater: (page: PageData) => PageData) => {
      if (!selectedNotebook || !selectedSection || !selectedPage) {
        return;
      }
      setNotebooks((prev) =>
        prev.map((notebook) =>
          notebook.id !== selectedNotebook.id
            ? notebook
            : {
                ...notebook,
                sections: notebook.sections.map((section) =>
                  section.id !== selectedSection.id
                    ? section
                    : {
                        ...section,
                        pages: section.pages.map((page) => (page.id === selectedPage.id ? updater(page) : page)),
                      },
                ),
              },
        ),
      );
    },
    [selectedNotebook, selectedPage, selectedSection],
  );

  const handlePositionChange = useCallback(
    (id: string, x: number, y: number) => {
      updateCurrentPage((page) => ({
        ...page,
        containers: page.containers.map((container) => (container.id === id ? { ...container, x, y } : container)),
      }));
    },
    [updateCurrentPage],
  );

  const handleUpdateContainer = useCallback(
    (id: string, updates: Partial<Pick<ContainerData, 'title' | 'content'>>) => {
      updateCurrentPage((page) => ({
        ...page,
        containers: page.containers.map((container) => (container.id === id ? { ...container, ...updates } : container)),
      }));
    },
    [updateCurrentPage],
  );

  const handleCreateContainer = useCallback(
    (x: number, y: number, template?: Pick<ContainerData, 'title' | 'content'>) => {
      if (!selectedPage) {
        return;
      }
      const newContainer: ContainerData = {
        id: createId('note'),
        x,
        y,
        title: template?.title || `${DEFAULT_NOTE_TITLE} ${(selectedPage.containers.length || 0) + 1}`,
        content: template?.content || DEFAULT_NOTE_CONTENT,
      };
      updateCurrentPage((page) => ({ ...page, containers: [...page.containers, newContainer] }));
      setSelectedContainerId(newContainer.id);
    },
    [selectedPage, updateCurrentPage],
  );

  const handleAddContainer = () => {
    const position = getNextContainerPosition(selectedPage?.containers.length ?? 0);
    handleCreateContainer(position.x, position.y);
  };

  const handleDeleteContainer = useCallback(
    (id: string) => {
      if (!selectedPage) {
        return;
      }
      updateCurrentPage((page) => {
        const toDelete = page.containers.find((container) => container.id === id);
        if (toDelete) {
          setDeletedStack((stack) => [...stack, { pageId: page.id, container: toDelete }]);
        }
        return {
          ...page,
          containers: page.containers.filter((container) => container.id !== id),
        };
      });
      setSelectedContainerId((selected) => (selected === id ? null : selected));
    },
    [selectedPage, updateCurrentPage],
  );

  const handleUndoDelete = useCallback(() => {
    setDeletedStack((stack) => {
      if (stack.length === 0) {
        return stack;
      }
      const restored = stack[stack.length - 1];
      setNotebooks((prev) =>
        prev.map((notebook) => ({
          ...notebook,
          sections: notebook.sections.map((section) => ({
            ...section,
            pages: section.pages.map((page) =>
              page.id === restored.pageId ? { ...page, containers: [...page.containers, restored.container] } : page,
            ),
          })),
        })),
      );
      setSelectedContainerId(restored.container.id);
      return stack.slice(0, -1);
    });
  }, []);

  const handleDuplicateSelected = useCallback(() => {
    if (!selectedContainerId || !selectedPage) {
      return;
    }
    const selected = selectedPage.containers.find((container) => container.id === selectedContainerId);
    if (!selected) {
      return;
    }
    handleCreateContainer(selected.x + 40, selected.y + 40, {
      title: `${selected.title} (Copy)`,
      content: selected.content,
    });
  }, [selectedPage, handleCreateContainer, selectedContainerId]);

  const filteredContainers = (selectedPage?.containers ?? []).filter((container) => {
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

  const handleCreatePage = useCallback(() => {
    if (!selectedNotebook || !selectedSection) {
      return;
    }
    const newPage: PageData = {
      id: createId('page'),
      title: `Page ${(selectedSection.pages.length || 0) + 1}`,
      containers: [],
    };

    setNotebooks((prev) =>
      prev.map((notebook) =>
        notebook.id !== selectedNotebook.id
          ? notebook
          : {
              ...notebook,
              sections: notebook.sections.map((section) =>
                section.id === selectedSection.id ? { ...section, pages: [...section.pages, newPage] } : section,
              ),
            },
      ),
    );
    setSelectedPageId(newPage.id);
    setSelectedContainerId(null);
  }, [selectedNotebook, selectedSection]);

  const handleSync = useCallback(async () => {
    setSyncState({ isSyncing: true, message: 'Syncing OneNote notebooks…' });
    try {
      const result = await invokeTauri<SyncPayload>('sync_notebooks', { notebooks });
      if (result?.notebooks) {
        setNotebooks(result.notebooks);
      }
      setSyncState({
        isSyncing: false,
        message: result?.synced_at ? `Last sync: ${result.synced_at}` : 'Sync ready (web preview)',
      });
    } catch {
      setSyncState({ isSyncing: false, message: 'Sync failed' });
    }
  }, [notebooks]);

  const currentContainerCount = selectedPage?.containers.length ?? 0;

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
        <div className="header-title-wrap">
          <div className="app-title">TwoNote · OneNote Compatibility Mode</div>
          <div className="app-subtitle" aria-live="polite">
            {selectedPage?.title ?? 'No page selected'} · {currentContainerCount} note{currentContainerCount === 1 ? '' : 's'}
          </div>
        </div>
        <div className="header-actions">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search current page"
            placeholder="Search current page..."
            className="search-input"
          />
          <button type="button" className="header-button" onClick={handleCreatePage} aria-label="Add page">
            Add page
          </button>
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
          <button type="button" className="header-button sync-button" onClick={() => void handleSync()} disabled={syncState.isSyncing}>
            {syncState.isSyncing ? 'Syncing…' : 'Sync OneNote'}
          </button>
        </div>
      </header>
      <div className="sync-status" aria-live="polite">
        {syncState.message}
      </div>
      <main className="workspace-shell">
        <aside className="notebook-sidebar" aria-label="Notebooks">
          <div className="sidebar-title">Notebooks</div>
          {notebooks.map((notebook) => (
            <button
              key={notebook.id}
              type="button"
              className={`sidebar-item ${selectedNotebook?.id === notebook.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedNotebookId(notebook.id);
                setSelectedSectionId(notebook.sections[0]?.id ?? null);
                setSelectedPageId(notebook.sections[0]?.pages[0]?.id ?? null);
                setSelectedContainerId(null);
              }}
            >
              {notebook.name}
            </button>
          ))}
        </aside>
        <section className="workspace-main">
          <div className="section-tabs" role="tablist" aria-label="Sections">
            {(selectedNotebook?.sections ?? []).map((section) => (
              <button
                key={section.id}
                type="button"
                className={`section-tab ${selectedSection?.id === section.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedSectionId(section.id);
                  setSelectedPageId(section.pages[0]?.id ?? null);
                  setSelectedContainerId(null);
                }}
              >
                {section.name}
              </button>
            ))}
          </div>
          <div className="page-and-canvas">
            <aside className="page-sidebar" aria-label="Pages">
              <div className="sidebar-title">Pages</div>
              {(selectedSection?.pages ?? []).map((page) => (
                <button
                  key={page.id}
                  type="button"
                  className={`sidebar-item ${selectedPage?.id === page.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedPageId(page.id);
                    setSelectedContainerId(null);
                  }}
                >
                  {page.title}
                </button>
              ))}
            </aside>
            <div className="canvas-panel">
              <Canvas onDoubleClick={handleCreateContainer} onCanvasClick={handleCanvasClick}>
                {filteredContainers.length === 0 && (
                  <div className="empty-state" role="status">
                    <h2>Page is empty</h2>
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
            </div>
          </div>
          <footer className="app-footer">
            OneNote-style layout active. Double-click page canvas to create notes. Use Sync OneNote to synchronize notebooks.
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;
