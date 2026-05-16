import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Toolbar } from './Toolbar';

interface TextContainerProps {
  id: string;
  x: number;
  y: number;
  onPositionChange: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
}

export const TextContainer: React.FC<TextContainerProps> = ({ id, x, y, onPositionChange, onDelete }) => {
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
      style={{
        position: 'absolute',
        left: x,
        top: y,
        border: isFocused ? '1px solid #4a90e2' : '1px solid #ccc',
        backgroundColor: 'white',
        minWidth: '200px',
        boxShadow: isFocused ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
        zIndex: isFocused || isDragging ? 100 : 1,
        display: 'flex',
        flexDirection: 'column',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div 
        className="drag-handle"
        style={{
          height: '20px',
          backgroundColor: '#f5f5f5',
          cursor: 'move',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 5px',
          fontSize: '12px',
          color: '#888',
          userSelect: 'none'
        }}
      >
        <span>:::</span>
        <button 
          onClick={() => onDelete(id)}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: '0 4px',
            color: '#ccc'
          }}
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking delete
        >
          &times;
        </button>
      </div>
      {isFocused && <Toolbar editor={editor} />}
      <div style={{ padding: '8px' }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
