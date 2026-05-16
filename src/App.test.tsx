import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import App from './App';

describe('App Canvas', () => {
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
});
