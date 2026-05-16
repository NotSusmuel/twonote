import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { FontFamily } from '@tiptap/extension-font-family';
import { Toolbar } from './Toolbar';
import './TextContainer.css';

interface TextContainerProps {
  id: string;
  x: number;
  y: number;
  onPositionChange: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
}

export const TextContainer: React.FC<TextContainerProps> = ({
  id,
  x,
  y,
  onPositionChange,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextStyle,
      Color,
      Highlight,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      FontFamily,
    ],
    content: '<p>Click to edit...</p>',
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  });

  /**
   * Custom dragging logic using Pointer Events for better precision and cross-platform support.
   * This allows us to capture the pointer and track movement relative to the drag handle.
   */
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag from the handle
    if ((e.target as HTMLElement).classList.contains('drag-handle')) {
      setIsDragging(true);

      const canvas = (e.currentTarget as HTMLElement).parentElement;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left + canvas.scrollLeft;
        const canvasY = e.clientY - rect.top + canvas.scrollTop;

        setDragOffset({
          x: canvasX - x,
          y: canvasY - y,
        });
      }
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      const canvas = (e.currentTarget as HTMLElement).parentElement;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left + canvas.scrollLeft;
        const canvasY = e.clientY - rect.top + canvas.scrollTop;

        onPositionChange(id, canvasX - dragOffset.x, canvasY - dragOffset.y);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      className={`text-container ${isFocused ? 'focused' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: x,
        top: y,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="drag-handle" aria-label="Drag handle">
        <span style={{ marginLeft: 'var(--space-1)' }}>:::</span>
        <button
          className="delete-button"
          onClick={() => onDelete(id)}
          aria-label="Delete container"
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking delete
        >
          &times;
        </button>
      </div>
      {isFocused && <Toolbar editor={editor} />}
      <div style={{ padding: 'var(--space-2)' }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
