import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TextContainer } from '../components/TextContainer';

vi.mock('@tiptap/react', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    useEditor: vi.fn(() => ({
      isFocused: false,
      on: vi.fn(),
      off: vi.fn(),
      destroy: vi.fn(),
    })),
    EditorContent: () => <div data-testid="editor-content" />,
  };
});

describe('TextContainer', () => {
  const mockProps = {
    id: '1',
    x: 100,
    y: 100,
    title: 'My Note',
    content: '<p>Click to edit...</p>',
    onPositionChange: vi.fn(),
    onContentChange: vi.fn(),
    onDelete: vi.fn(),
    onSelect: vi.fn(),
    isSelected: false,
    onTitleChange: vi.fn(),
  };

  it('renders correctly at the given position', () => {
    const { container } = render(<TextContainer {...mockProps} />);
    const textContainer = container.firstChild as HTMLElement;
    expect(textContainer.style.left).toBe('100px');
    expect(textContainer.style.top).toBe('100px');
  });

  it('calls onDelete when the delete button is clicked', () => {
    render(<TextContainer {...mockProps} />);
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);
    expect(mockProps.onDelete).toHaveBeenCalledWith('1');
  });

  it('calls onTitleChange when note title changes', () => {
    render(<TextContainer {...mockProps} />);
    const titleInput = screen.getByRole('textbox', { name: /note title/i });
    fireEvent.change(titleInput, { target: { value: 'Renamed Note' } });
    expect(mockProps.onTitleChange).toHaveBeenCalledWith('1', 'Renamed Note');
  });
});
