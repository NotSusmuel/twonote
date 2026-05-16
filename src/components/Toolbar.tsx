import React from 'react';
import { Editor } from '@tiptap/react';

interface ToolbarProps {
  editor: Editor | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="toolbar" style={{
      display: 'flex',
      gap: '5px',
      padding: '5px',
      borderBottom: '1px solid #eee',
      backgroundColor: '#fafafa',
      marginBottom: '5px',
      flexWrap: 'wrap'
    }}>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        style={{ fontWeight: editor.isActive('bold') ? 'bold' : 'normal' }}
      >
        B
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        style={{ fontStyle: editor.isActive('italic') ? 'italic' : 'normal' }}
      >
        I
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        style={{ textDecoration: editor.isActive('strike') ? 'line-through' : 'none' }}
      >
        S
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        style={{ fontWeight: editor.isActive('heading', { level: 1 }) ? 'bold' : 'normal' }}
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        style={{ fontWeight: editor.isActive('bulletList') ? 'bold' : 'normal' }}
      >
        UL
      </button>
      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        style={{ fontWeight: editor.isActive('taskList') ? 'bold' : 'normal' }}
      >
        Task
      </button>
    </div>
  );
};
