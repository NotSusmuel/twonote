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
      <select
        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        value={editor.getAttributes('textStyle').fontFamily || ''}
      >
        <option value="Arial">Arial</option>
        <option value="Inter">Inter</option>
        <option value="Courier New">Courier New</option>
      </select>
      <input
        type="color"
        onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
        value={editor.getAttributes('textStyle').color || '#000000'}
      />
      <button
        className="toolbar-button"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        style={{ backgroundColor: editor.isActive('highlight') ? 'yellow' : 'transparent' }}
      >
        H
      </button>
      <button className="toolbar-button" onClick={() => editor.chain().focus().setTextAlign('left').run()}>L</button>
      <button className="toolbar-button" onClick={() => editor.chain().focus().setTextAlign('center').run()}>C</button>
      <button className="toolbar-button" onClick={() => editor.chain().focus().setTextAlign('right').run()}>R</button>
      <button className="toolbar-button" onClick={() => editor.chain().focus().setTextAlign('justify').run()}>J</button>
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
