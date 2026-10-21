'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function CopyButton({
  text,
  onCopy,
}: {
  text: string;
  onCopy: (success: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = async () => {
    let success = false;
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch (e) {
        // fallback
        const el = textareaRef.current;
        if (el) {
          el.select();
          document.execCommand('copy');
          success = true;
        }
      }
    } else {
      const el = textareaRef.current;
      if (el) {
        el.select();
        document.execCommand('copy');
        success = true;
      }
    }
    setCopied(success);
    onCopy(success);
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <div>
      <textarea
        ref={textareaRef}
        readOnly
        value={text}
        className="hidden"
      />
      <button
        onClick={handleCopy}
        className="gold-bg text-surface-50 py-2 rounded-xl font-sm hover:opacity-90 transition-opacity"
        disabled={copied}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}