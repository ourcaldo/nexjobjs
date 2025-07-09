import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link, 
  Image,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  EyeOff
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter your content...",
  className = ""
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastCursorPosition, setLastCursorPosition] = useState<number>(0);

  // Initialize editor content only once when component mounts
  useEffect(() => {
    if (editorRef.current && !isInitialized && !isPreviewMode) {
      // Set initial content
      editorRef.current.innerHTML = value || '';
      setIsInitialized(true);
      
      // Focus at the end of content if there's content
      if (value) {
        setTimeout(() => {
          if (editorRef.current) {
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(editorRef.current);
            range.collapse(false); // Collapse to end
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        }, 100);
      }
    }
  }, [value, isInitialized, isPreviewMode]);

  // Save and restore cursor position
  const saveCursorPosition = useCallback(() => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editorRef.current);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      setLastCursorPosition(preCaretRange.toString().length);
    }
  }, []);

  const restoreCursorPosition = useCallback((position: number) => {
    if (!editorRef.current) return;
    
    setTimeout(() => {
      if (!editorRef.current) return;
      
      const walker = document.createTreeWalker(
        editorRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let currentPosition = 0;
      let node;
      
      while (node = walker.nextNode()) {
        const textLength = node.textContent?.length || 0;
        if (currentPosition + textLength >= position) {
          const range = document.createRange();
          const selection = window.getSelection();
          const offset = position - currentPosition;
          
          range.setStart(node, Math.min(offset, textLength));
          range.collapse(true);
          
          selection?.removeAllRanges();
          selection?.addRange(range);
          break;
        }
        currentPosition += textLength;
      }
    }, 10);
  }, []);

  // Handle content change with cursor position preservation
  const handleContentChange = useCallback(() => {
    if (!editorRef.current) return;
    
    saveCursorPosition();
    const newContent = editorRef.current.innerHTML;
    onChange(newContent);
  }, [onChange, saveCursorPosition]);

  // Handle text selection
  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection) {
      setSelectedText(selection.toString());
    }
  }, []);

  // Execute formatting command with cursor position preservation
  const execCommand = useCallback((command: string, value?: string) => {
    if (!editorRef.current) return;
    
    saveCursorPosition();
    document.execCommand(command, false, value);
    
    const newContent = editorRef.current.innerHTML;
    onChange(newContent);
    
    // Restore cursor position after a short delay
    setTimeout(() => {
      restoreCursorPosition(lastCursorPosition);
      editorRef.current?.focus();
    }, 10);
  }, [onChange, saveCursorPosition, restoreCursorPosition, lastCursorPosition]);

  // Insert HTML at cursor with position preservation
  const insertHTML = useCallback((html: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    saveCursorPosition();
    
    document.execCommand('insertHTML', false, html);
    
    const newContent = editorRef.current.innerHTML;
    onChange(newContent);
    
    setTimeout(() => {
      editorRef.current?.focus();
    }, 10);
  }, [onChange, saveCursorPosition]);

  // Format as heading
  const formatHeading = useCallback((level: number) => {
    execCommand('formatBlock', `h${level}`);
  }, [execCommand]);

  // Insert link
  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  // Insert image
  const insertImage = useCallback(() => {
    const url = prompt('Enter image URL:');
    if (url) {
      insertHTML(`<img src="${url}" alt="Image" style="max-width: 100%; height: auto; margin: 10px 0;" />`);
    }
  }, [insertHTML]);

  // Insert code block
  const insertCodeBlock = useCallback(() => {
    insertHTML('<pre style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 10px 0; overflow-x: auto;"><code>// Your code here</code></pre>');
  }, [insertHTML]);

  // Insert blockquote
  const insertBlockquote = useCallback(() => {
    execCommand('formatBlock', 'blockquote');
  }, [execCommand]);

  // Handle key events to prevent cursor jumping
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Save cursor position on any key press
    saveCursorPosition();
    
    // Handle specific key combinations
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
      }
    }
  }, [execCommand, saveCursorPosition]);

  // Handle paste events
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    saveCursorPosition();
    
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      onChange(newContent);
    }
  }, [onChange, saveCursorPosition]);

  // Toggle preview mode
  const togglePreview = useCallback(() => {
    setIsPreviewMode(!isPreviewMode);
  }, [isPreviewMode]);

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-3 flex flex-wrap gap-2">
        {/* Heading Dropdown */}
        <div className="relative">
          <select
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'p') {
                execCommand('formatBlock', 'p');
              } else {
                formatHeading(parseInt(value));
              }
            }}
            className="px-3 py-1 border border-gray-300 rounded text-sm bg-white"
            disabled={isPreviewMode}
          >
            <option value="p">Paragraph</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="4">Heading 4</option>
            <option value="5">Heading 5</option>
            <option value="6">Heading 6</option>
          </select>
        </div>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bold"
          disabled={isPreviewMode}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Italic"
          disabled={isPreviewMode}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Underline"
          disabled={isPreviewMode}
        >
          <Underline className="h-4 w-4" />
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Alignment */}
        <button
          type="button"
          onClick={() => execCommand('justifyLeft')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Align Left"
          disabled={isPreviewMode}
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyCenter')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Align Center"
          disabled={isPreviewMode}
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyRight')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Align Right"
          disabled={isPreviewMode}
        >
          <AlignRight className="h-4 w-4" />
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Lists */}
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bullet List"
          disabled={isPreviewMode}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Numbered List"
          disabled={isPreviewMode}
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Special Elements */}
        <button
          type="button"
          onClick={insertBlockquote}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Quote"
          disabled={isPreviewMode}
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={insertCodeBlock}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Code Block"
          disabled={isPreviewMode}
        >
          <Code className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={insertLink}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Insert Link"
          disabled={isPreviewMode}
        >
          <Link className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={insertImage}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Insert Image"
          disabled={isPreviewMode}
        >
          <Image className="h-4 w-4" />
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Preview Toggle */}
        <button
          type="button"
          onClick={togglePreview}
          className={`p-2 rounded transition-colors ${
            isPreviewMode 
              ? 'bg-primary-100 text-primary-700 hover:bg-primary-200' 
              : 'hover:bg-gray-200'
          }`}
          title={isPreviewMode ? "Edit Mode" : "Preview Mode"}
        >
          {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {/* Editor Content */}
      <div className="relative">
        {isPreviewMode ? (
          /* Preview Mode */
          <div className="p-4 min-h-[400px] bg-white">
            <div 
              className="prose prose-lg max-w-none rich-text-content"
              dangerouslySetInnerHTML={{ __html: value }}
            />
          </div>
        ) : (
          /* Visual Editor */
          <div
            ref={editorRef}
            contentEditable
            onInput={handleContentChange}
            onMouseUp={handleSelection}
            onKeyUp={handleSelection}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="p-4 min-h-[400px] bg-white focus:outline-none rich-text-editor"
            style={{ 
              minHeight: '400px',
              lineHeight: '1.6'
            }}
            suppressContentEditableWarning={true}
            data-placeholder={placeholder}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-xs text-gray-600">
        {isPreviewMode ? 'Preview Mode' : 'Visual Editor'} | 
        Characters: {value.replace(/<[^>]*>/g, '').length}
      </div>

      {/* Custom Styles for Rich Text Editor */}
      <style jsx>{`
        .rich-text-editor h1 {
          font-size: 2.25rem;
          font-weight: 700;
          line-height: 1.2;
          margin: 1rem 0;
          color: #1f2937;
        }
        
        .rich-text-editor h2 {
          font-size: 1.875rem;
          font-weight: 600;
          line-height: 1.3;
          margin: 0.875rem 0;
          color: #1f2937;
        }
        
        .rich-text-editor h3 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 0.75rem 0;
          color: #1f2937;
        }
        
        .rich-text-editor h4 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 0.625rem 0;
          color: #1f2937;
        }
        
        .rich-text-editor h5 {
          font-size: 1.125rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 0.5rem 0;
          color: #1f2937;
        }
        
        .rich-text-editor h6 {
          font-size: 1rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 0.5rem 0;
          color: #1f2937;
        }
        
        .rich-text-editor p {
          font-size: 1rem;
          line-height: 1.6;
          margin: 0.5rem 0;
          color: #374151;
        }
        
        .rich-text-editor ul, .rich-text-editor ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        
        .rich-text-editor li {
          margin: 0.25rem 0;
          line-height: 1.6;
        }
        
        .rich-text-editor blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .rich-text-editor pre {
          background: #f3f4f6;
          padding: 1rem;
          border-radius: 0.375rem;
          margin: 1rem 0;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
        }
        
        .rich-text-editor code {
          background: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
        }
        
        .rich-text-editor a {
          color: #2563eb;
          text-decoration: underline;
        }
        
        .rich-text-editor a:hover {
          color: #1d4ed8;
        }
        
        .rich-text-editor img {
          max-width: 100%;
          height: auto;
          margin: 0.5rem 0;
          border-radius: 0.375rem;
        }
        
        .rich-text-editor strong, .rich-text-editor b {
          font-weight: 600;
        }
        
        .rich-text-editor em, .rich-text-editor i {
          font-style: italic;
        }
        
        .rich-text-editor u {
          text-decoration: underline;
        }
        
        .rich-text-editor[data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
        }
        
        /* Content styles for preview */
        .rich-text-content h1 {
          font-size: 2.25rem;
          font-weight: 700;
          line-height: 1.2;
          margin: 1rem 0;
          color: #1f2937;
        }
        
        .rich-text-content h2 {
          font-size: 1.875rem;
          font-weight: 600;
          line-height: 1.3;
          margin: 0.875rem 0;
          color: #1f2937;
        }
        
        .rich-text-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 0.75rem 0;
          color: #1f2937;
        }
        
        .rich-text-content h4 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 0.625rem 0;
          color: #1f2937;
        }
        
        .rich-text-content h5 {
          font-size: 1.125rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 0.5rem 0;
          color: #1f2937;
        }
        
        .rich-text-content h6 {
          font-size: 1rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 0.5rem 0;
          color: #1f2937;
        }
        
        .rich-text-content p {
          font-size: 1rem;
          line-height: 1.6;
          margin: 0.5rem 0;
          color: #374151;
        }
        
        .rich-text-content ul, .rich-text-content ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        
        .rich-text-content li {
          margin: 0.25rem 0;
          line-height: 1.6;
        }
        
        .rich-text-content blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .rich-text-content pre {
          background: #f3f4f6;
          padding: 1rem;
          border-radius: 0.375rem;
          margin: 1rem 0;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
        }
        
        .rich-text-content code {
          background: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
        }
        
        .rich-text-content a {
          color: #2563eb;
          text-decoration: underline;
        }
        
        .rich-text-content a:hover {
          color: #1d4ed8;
        }
        
        .rich-text-content img {
          max-width: 100%;
          height: auto;
          margin: 0.5rem 0;
          border-radius: 0.375rem;
        }
        
        .rich-text-content strong, .rich-text-content b {
          font-weight: 600;
        }
        
        .rich-text-content em, .rich-text-content i {
          font-style: italic;
        }
        
        .rich-text-content u {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;