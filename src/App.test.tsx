import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, describe, beforeEach } from 'vitest';
import App from './App';

describe('App Canvas', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders initial containers', () => {
    render(<App />);
    // Initial state has 2 containers
    const containers = screen.getAllByText(/Click to edit.../i);
    expect(containers.length).toBeGreaterThanOrEqual(2);
  });

  test('adds a new container on double click', () => {
    render(<App />);
    const initialContainers = screen.getAllByText(/Click to edit.../i).length;

    // Find the canvas - it's the one with the background grid style
    // We'll just find it by role if possible, or use a container
    const canvas = document.querySelector('div[style*="radial-gradient"]');
    if (!canvas) throw new Error('Canvas not found');

    fireEvent.doubleClick(canvas, {
      clientX: 500,
      clientY: 500,
    });

    const finalContainers = screen.getAllByText(/Click to edit.../i).length;
    expect(finalContainers).toBe(initialContainers + 1);
  });

  test('renders toolbar with task list button when focused', async () => {
    render(<App />);
    const editor = document.querySelector('.tiptap');
    if (!editor) throw new Error('Editor not found');

    fireEvent.focus(editor);

    // Check for toolbar buttons - use findBy to allow for state update
    expect(await screen.findByText('B')).toBeDefined();
    expect(await screen.findByText('Task')).toBeDefined();
  });

  test('adds a new container from header button', () => {
    render(<App />);
    const initialContainers = screen.getAllByText(/Click to edit.../i).length;
    fireEvent.click(screen.getByRole('button', { name: /create note/i }));
    const finalContainers = screen.getAllByText(/Click to edit.../i).length;
    expect(finalContainers).toBe(initialContainers + 1);
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
    fireEvent.change(screen.getByRole('textbox', { name: /search notes/i }), { target: { value: 'meeting' } });

    expect(screen.getAllByLabelText(/note title/i)).toHaveLength(1);
    expect(screen.getByDisplayValue('Meeting Notes')).toBeDefined();
  });
});
