import Editor, { Monaco } from '@monaco-editor/react';
import { useRef, useEffect } from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  currentLine: number;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, currentLine }) => {
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    
    // Set editor options
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      automaticLayout: true,
      lineHeight: 24,
    });

    // Add custom CSS for line highlighting
    monaco.editor.defineTheme('eventLoopTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
      },
    });

    // Correctly set the theme using monaco.editor.setTheme
    monaco.editor.setTheme('eventLoopTheme');
  };

  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      
      // Remove previous decorations
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      
      // Add new decoration for current line
      if (currentLine >= 0) {
        decorationsRef.current = editor.deltaDecorations([], [
          {
            range: {
              startLineNumber: currentLine + 1,
              startColumn: 1,
              endLineNumber: currentLine + 1,
              endColumn: 1,
            },
            options: {
              isWholeLine: true,
              className: 'currentLineDecoration',
              linesDecorationsClassName: 'currentLineDecorationGutter',
            },
          },
        ]);
      }
    }
  }, [currentLine]);

  return (
    <>
      <style>
        {`
          .currentLineDecoration {
            background: rgba(97, 218, 251, 0.1);
            border-left: 2px solid #61dafb;
          }
          .currentLineDecorationGutter {
            background: #61dafb;
            width: 2px !important;
            margin-left: 3px;
          }
        `}
      </style>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        theme="vs-dark"
        value={code}
        onChange={(value) => onChange(value || '')}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          automaticLayout: true,
          lineHeight: 24,
        }}
      />
    </>
  );
};

export default CodeEditor;