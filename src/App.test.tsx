import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, describe, beforeEach } from 'vitest';
import App from './App';

describe('App Canvas', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('renders OneNote-style notebook, section, and page navigation', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'My Notebook' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'General' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Welcome' })).toBeInTheDocument();
    expect(screen.getAllByText(/Click to edit.../i).length).toBeGreaterThanOrEqual(2);
  });

  test('imports legacy flat note storage into notebook structure', () => {
    window.localStorage.setItem(
      'onenote-evolution-notebooks-data',
      JSON.stringify([{ id: 'saved-note', x: 80, y: 120, content: '<p>Saved note</p>' }]),
    );

    render(<App />);
    expect(screen.getByRole('button', { name: 'Imported Notebook' })).toBeInTheDocument();
    expect(screen.getByText('Saved note')).toBeInTheDocument();
  });

  test('adds a new container on double click', () => {
    render(<App />);
    const initialContainers = screen.getAllByText(/Click to edit.../i).length;

    const canvas = document.querySelector('div[style*="radial-gradient"]');
    if (!canvas) throw new Error('Canvas not found');

    fireEvent.doubleClick(canvas, { clientX: 500, clientY: 500 });
    expect(screen.getAllByText(/Click to edit.../i).length).toBe(initialContainers + 1);
  });

  test('adds a page from the header button', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Add page' }));
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
  });

  test('falls back to defaults when local storage is invalid', () => {
    window.localStorage.setItem('onenote-evolution-notebooks-data', 'not-json');
    render(<App />);
    expect(screen.getAllByText(/Click to edit.../i)).toHaveLength(2);
  });

  test('shows an empty state and lets the user create a new note', () => {
    render(<App />);
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete container' });
    deleteButtons.forEach((button) => fireEvent.click(button));

    expect(screen.getByText('Page is empty')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create your first note' }));
    expect(screen.getAllByLabelText(/note title/i)).toHaveLength(1);
  });

  test('renders toolbar with task list button when focused', async () => {
    render(<App />);
    const editor = document.querySelector('.tiptap');
    if (!editor) throw new Error('Editor not found');
    fireEvent.focus(editor);

    expect(await screen.findByText('B')).toBeDefined();
    expect(await screen.findByText('Task')).toBeDefined();
  });

  test('can undo a delete action from header button', () => {
    render(<App />);
    const initialContainers = screen.getAllByText(/Click to edit.../i).length;
    fireEvent.click(screen.getAllByRole('button', { name: /delete container/i })[0]);
    expect(screen.getAllByText(/Click to edit.../i).length).toBe(initialContainers - 1);
    fireEvent.click(screen.getByRole('button', { name: /undo delete/i }));
    expect(screen.getAllByText(/Click to edit.../i).length).toBe(initialContainers);
  });

  test('duplicates the selected note from header button', () => {
    render(<App />);
    const initialNotes = screen.getAllByLabelText(/note title/i).length;
    const firstContainer = document.querySelector('.text-container');
    if (!firstContainer) throw new Error('Container not found');

    fireEvent.pointerDown(firstContainer);
    fireEvent.click(screen.getByRole('button', { name: /duplicate selected note/i }));

    expect(screen.getAllByLabelText(/note title/i).length).toBe(initialNotes + 1);
  });

  test('filters notes with search input', () => {
    render(<App />);
    const titles = screen.getAllByLabelText(/note title/i);

    fireEvent.change(titles[0], { target: { value: 'Meeting Notes' } });
    fireEvent.change(titles[1], { target: { value: 'Shopping' } });
    fireEvent.change(screen.getByRole('textbox', { name: /search current page/i }), {
      target: { value: 'meeting' },
    });

    expect(screen.getAllByLabelText(/note title/i)).toHaveLength(1);
    expect(screen.getByDisplayValue('Meeting Notes')).toBeDefined();
  });

  test('supports sync action in web preview mode', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /sync onenote/i }));
    expect(await screen.findByText('Sync ready (web preview)')).toBeInTheDocument();
  });

  test('supports OneNote-like page content editing', () => {
    render(<App />);
    const pageEditor = screen.getByRole('textbox', { name: /page content/i });
    fireEvent.change(pageEditor, { target: { value: 'Meeting agenda\n- Decisions\n- Action items' } });
    expect(pageEditor).toHaveValue('Meeting agenda\n- Decisions\n- Action items');
  });

  test('toggles dark mode', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /toggle dark mode/i }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
