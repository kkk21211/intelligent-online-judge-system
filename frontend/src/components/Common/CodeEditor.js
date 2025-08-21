import React, { useRef, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { Card, Select, Button, Space, message } from 'antd';
import { PlayCircleOutlined, SaveOutlined, FullscreenOutlined } from '@ant-design/icons';

const { Option } = Select;

const CodeEditor = ({
  value,
  onChange,
  language = 'python',
  onLanguageChange,
  onRun,
  onSave,
  height = '400px',
  readOnly = false,
  showToolbar = true,
  theme = 'vs-dark'
}) => {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // 设置编辑器选项
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
      lineNumbers: 'on',
      glyphMargin: true,
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3
    });

    // 添加快捷键
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        onSave();
        message.success('代码已保存');
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRun) {
        onRun();
      }
    });
  };

  const handleFullscreen = () => {
    if (editorRef.current) {
      const editorElement = editorRef.current.getDomNode();
      if (editorElement.requestFullscreen) {
        editorElement.requestFullscreen();
      }
    }
  };

  const getLanguageDisplayName = (lang) => {
    const languageMap = {
      'python': 'Python',
      'cpp': 'C++',
      'c': 'C',
      'java': 'Java',
      'javascript': 'JavaScript',
      'typescript': 'TypeScript'
    };
    return languageMap[lang] || lang;
  };

  const getMonacoLanguage = (lang) => {
    const monacoLanguageMap = {
      'cpp': 'cpp',
      'c': 'c',
      'python': 'python',
      'java': 'java',
      'javascript': 'javascript',
      'typescript': 'typescript'
    };
    return monacoLanguageMap[lang] || 'plaintext';
  };

  return (
    <Card 
      className="code-editor-container"
      bodyStyle={{ padding: 0 }}
      title={
        showToolbar && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <span>代码编辑器</span>
              {onLanguageChange && (
                <Select
                  value={language}
                  onChange={onLanguageChange}
                  style={{ width: 120 }}
                  size="small"
                >
                  <Option value="python">Python</Option>
                  <Option value="cpp">C++</Option>
                  <Option value="c">C</Option>
                  <Option value="java">Java</Option>
                </Select>
              )}
            </Space>
            <Space>
              {onSave && (
                <Button
                  type="text"
                  icon={<SaveOutlined />}
                  onClick={onSave}
                  size="small"
                  title="保存 (Ctrl+S)"
                >
                  保存
                </Button>
              )}
              {onRun && (
                <Button
                  type="text"
                  icon={<PlayCircleOutlined />}
                  onClick={onRun}
                  size="small"
                  title="运行 (Ctrl+Enter)"
                >
                  运行
                </Button>
              )}
              <Button
                type="text"
                icon={<FullscreenOutlined />}
                onClick={handleFullscreen}
                size="small"
                title="全屏"
              />
            </Space>
          </div>
        )
      }
    >
      <Editor
        height={height}
        language={getMonacoLanguage(language)}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme={theme}
        options={{
          readOnly,
          selectOnLineNumbers: true,
          roundedSelection: false,
          cursorStyle: 'line',
          automaticLayout: true,
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto'
          }
        }}
      />
    </Card>
  );
};

export default CodeEditor;