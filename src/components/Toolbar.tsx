import React from 'react';
import { Editor } from '@tiptap/react';
import './Toolbar.css';

interface ToolbarProps {
  editor: Editor | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="toolbar">
      <button
        className={`toolbar-button ${editor.isActive('bold') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        aria-label="Toggle Bold"
      >
        B
      </button>
      <button
        className={`toolbar-button ${editor.isActive('italic') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        aria-label="Toggle Italic"
      >
        I
      </button>
      <button
        className={`toolbar-button ${editor.isActive('strike') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        aria-label="Toggle Strikethrough"
      >
        S
      </button>
      <button
        className={`toolbar-button ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        aria-label="Toggle Heading 1"
      >
        H1
      </button>
      <button
        className={`toolbar-button ${editor.isActive('bulletList') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Toggle Bullet List"
      >
        UL
      </button>
      <button
        className={`toolbar-button ${editor.isActive('taskList') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        aria-label="Toggle Task List"
      >
        Task
      </button>
    </div>
  );
};
