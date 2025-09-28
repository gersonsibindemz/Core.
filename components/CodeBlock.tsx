import React from 'react';
import CopyButton from './CopyButton';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'javascript' }) => {
  const cleanCode = code.trim();
  
  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden relative border border-slate-700">
      <div className="absolute top-3 right-3 z-10">
          <CopyButton textToCopy={cleanCode} />
      </div>
      <pre className="p-4 text-sm overflow-x-auto text-slate-300">
        <code className={`language-${language}`}>
            {cleanCode}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;
