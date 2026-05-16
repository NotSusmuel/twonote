import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, describe, beforeEach } from 'vitest';
import App from './App';

describe('App Canvas', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('renders initial containers', () => {
    render(<App />);
    // Initial state has 2 containers
    const containers = screen.getAllByText(/Click to edit.../i);
    expect(containers.length).toBeGreaterThanOrEqual(2);
  });

  test('renders saved note content from local storage', () => {
    window.localStorage.setItem(
      'onenote-evolution-prototype-data',
      JSON.stringify([{ id: 'saved-note', x: 80, y: 120, content: '<p>Saved note</p>' }]),
    );

    render(<App />);

    expect(screen.getByText('Saved note')).toBeInTheDocument();
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

  test('adds a new container from the header button', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Add note' }));

    expect(screen.getByText('3 notes on this canvas')).toBeInTheDocument();
  });

  test('falls back to defaults when local storage is invalid', () => {
    window.localStorage.setItem('onenote-evolution-prototype-data', 'not-json');

    render(<App />);

    expect(screen.getAllByText(/Click to edit.../i)).toHaveLength(2);
  });

  test('shows an empty state and lets the user create a new note', () => {
    render(<App />);

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete container' });
    deleteButtons.forEach((button) => fireEvent.click(button));

    expect(screen.getByText('Canvas is empty')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Create your first note' }));

    expect(screen.getByText('1 note on this canvas')).toBeInTheDocument();
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
});
