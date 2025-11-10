import React from 'react';

interface CodeDiffViewerProps {
  diff: string;
}

const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({ diff }) => {
  const lines = diff.split('\n');

  const getLineClass = (line: string) => {
    if (line.startsWith('+')) {
      return 'bg-green-500/20 text-green-300';
    }
    if (line.startsWith('-')) {
      return 'bg-red-500/20 text-red-300';
    }
    if (line.startsWith('@@')) {
        return 'text-cyan-400';
    }
    return 'text-gray-400';
  };

  return (
    <pre className="bg-dark-primary p-4 rounded-lg overflow-x-auto text-sm font-mono">
      <code>
        {lines.map((line, index) => (
          <div key={index} className={`flex ${getLineClass(line)}`}>
            <span className="w-8 text-right pr-4 opacity-50 select-none">{index + 1}</span>
            <span className="flex-1 whitespace-pre-wrap">{line}</span>
          </div>
        ))}
      </code>
    </pre>
  );
};

export default CodeDiffViewer;
