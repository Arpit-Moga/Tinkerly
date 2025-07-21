import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FileText, Folder, FolderOpen } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
}

export const CodeEditor: React.FC = () => {
  const { generatedFiles, selectedFile, setSelectedFile, updateFile } = useAppStore();
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    const tree = buildFileTree(Object.keys(generatedFiles));
    setFileTree(tree);
    
    // Auto-select first file if none selected
    if (!selectedFile && Object.keys(generatedFiles).length > 0) {
      const firstFile = Object.keys(generatedFiles)[0];
      setSelectedFile(firstFile);
    }
  }, [generatedFiles, selectedFile, setSelectedFile]);

  const buildFileTree = (filePaths: string[]): FileTreeNode[] => {
    const tree: FileTreeNode[] = [];
    const pathMap = new Map<string, FileTreeNode>();

    filePaths.forEach(path => {
      const parts = path.split('/');
      let currentPath = '';

      parts.forEach((part, index) => {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!pathMap.has(currentPath)) {
          const node: FileTreeNode = {
            name: part,
            path: currentPath,
            type: index === parts.length - 1 ? 'file' : 'folder',
            children: []
          };

          pathMap.set(currentPath, node);

          if (parentPath) {
            const parent = pathMap.get(parentPath);
            if (parent) {
              parent.children!.push(node);
            }
          } else {
            tree.push(node);
          }
        }
      });
    });

    return tree;
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (nodes: FileTreeNode[], depth = 0): React.ReactNode => {
    return nodes.map(node => (
      <div key={node.path}>
        <div
          className={`flex items-center space-x-2 px-2 py-1 cursor-pointer hover:bg-gray-100 ${
            selectedFile === node.path ? 'bg-primary-50 text-primary-700' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'file') {
              setSelectedFile(node.path);
            } else {
              toggleFolder(node.path);
            }
          }}
        >
          {node.type === 'folder' ? (
            expandedFolders.has(node.path) ? (
              <FolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 text-blue-500" />
            )
          ) : (
            <FileText className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm">{node.name}</span>
        </div>
        {node.type === 'folder' && expandedFolders.has(node.path) && node.children && (
          <div>{renderFileTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  const handleEditorChange = (value: string | undefined) => {
    if (selectedFile && value !== undefined) {
      updateFile(selectedFile, value);
    }
  };

  const getFileLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'vue':
        return 'vue';
      case 'svelte':
        return 'svelte';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Code Editor</h3>
        <p className="text-sm text-gray-600 mt-1">
          {Object.keys(generatedFiles).length} files generated
        </p>
      </div>

      {Object.keys(generatedFiles).length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No files generated yet</p>
            <p className="text-sm mt-1">Start a conversation to generate code</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex">
          {/* File Tree */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            <div className="p-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Files
              </h4>
              {renderFileTree(fileTree)}
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1">
            {selectedFile ? (
              <div className="h-full flex flex-col">
                <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedFile}
                  </span>
                </div>
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language={getFileLanguage(selectedFile)}
                    value={generatedFiles[selectedFile] || ''}
                    onChange={handleEditorChange}
                    theme="vs-light"
                    onMount={(editor, monaco) => {
                      // Configure Monaco Editor after mount
                      try {
                        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                          target: monaco.languages.typescript.ScriptTarget.Latest,
                          allowNonTsExtensions: true,
                          moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                          module: monaco.languages.typescript.ModuleKind.CommonJS,
                          noEmit: true,
                          esModuleInterop: true,
                          jsx: monaco.languages.typescript.JsxEmit.React,
                          reactNamespace: 'React',
                          allowJs: true,
                          typeRoots: ['node_modules/@types']
                        });

                        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                          noSemanticValidation: false,
                          noSyntaxValidation: false,
                        });
                      } catch (error) {
                        console.warn('Monaco TypeScript configuration failed:', error);
                      }
                    }}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      insertSpaces: true,
                      wordWrap: 'on',
                      formatOnPaste: true,
                      formatOnType: true,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a file to edit</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};