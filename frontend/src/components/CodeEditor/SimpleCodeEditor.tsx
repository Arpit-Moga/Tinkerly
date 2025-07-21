import React, { useState, useEffect } from 'react';
import { FileText, Folder, FolderOpen } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
}

export const SimpleCodeEditor: React.FC = () => {
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
          className={`flex items-center space-x-2 px-2 py-1 cursor-pointer hover:bg-gray-700 ${
            selectedFile === node.path ? 'bg-purple-600 text-white' : 'text-gray-300'
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

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedFile) {
      updateFile(selectedFile, e.target.value);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="font-semibold text-white">Code Editor</h3>
        <p className="text-sm text-gray-400 mt-1">
          {Object.keys(generatedFiles).length} files generated
        </p>
      </div>

      {Object.keys(generatedFiles).length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No files generated yet</p>
            <p className="text-sm mt-1 text-gray-500">Start a conversation to generate code</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex">
          {/* File Tree */}
          <div className="w-1/3 border-r border-gray-700 overflow-y-auto bg-gray-800">
            <div className="p-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Files
              </h4>
              {renderFileTree(fileTree)}
            </div>
          </div>

          {/* Simple Text Editor */}
          <div className="flex-1 bg-gray-900">
            {selectedFile ? (
              <div className="h-full flex flex-col">
                <div className="px-4 py-2 border-b border-gray-700 bg-gray-800">
                  <span className="text-sm font-medium text-gray-300">
                    {selectedFile}
                  </span>
                </div>
                <div className="flex-1">
                  <textarea
                    value={generatedFiles[selectedFile] || ''}
                    onChange={handleTextareaChange}
                    className="w-full h-full p-4 font-mono text-sm border-0 resize-none focus:outline-none focus:ring-0 bg-gray-900 text-gray-100"
                    style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
                    spellCheck={false}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
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