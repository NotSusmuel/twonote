import React from 'react';

interface CanvasProps {
  children: React.ReactNode;
  onDoubleClick: (x: number, y: number) => void;
  onCanvasClick: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({ children, onDoubleClick, onCanvasClick }) => {
  /**
   * OneNote-style interaction: Double click on the canvas background to create a new text container.
   * We filter the target to ensure we only trigger on the canvas itself, not its children.
   */
  const handleDoubleClick = (e: React.MouseEvent) => {
    // Only trigger if clicking directly on the canvas background
    if (e.target === e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
      const y = e.clientY - rect.top + e.currentTarget.scrollTop;
      onDoubleClick(x, y);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCanvasClick();
    }
  };

  return (
    <div 
      style={{ 
        width: '100vw', 
        height: 'calc(100vh - 40px)', // Account for header height
        position: 'relative', 
        overflow: 'auto', 
        backgroundColor: '#fbfbfb',
        backgroundImage: 'radial-gradient(#e5e5e5 1px, transparent 1px)',
        backgroundSize: '20px 20px', // OneNote-style grid
        backgroundAttachment: 'local', // Ensure grid scrolls with content
      }}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
    >
      {/* Container to ensure background grid expands with content */}
      <div style={{ position: 'absolute', top: 0, left: 0, minWidth: '100%', minHeight: '100%', pointerEvents: 'none' }} />
      {children}
    </div>
  );
};
