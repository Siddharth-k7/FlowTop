'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@flowtop/ui';

interface ShareButtonsProps {
  title: string;
  url: string;
  excerpt?: string;
  className?: string;
}

export function ShareButtons({
  title,
  url,
  excerpt = '',
  className = '',
}: ShareButtonsProps) {
  const [canWebShare, setCanWebShare] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanWebShare(true);
    }
  }, []);

  const handleNativeShare = async () => {
    if (!canWebShare) return;
    try {
      await navigator.share({
        title,
        text: excerpt || title,
        url,
      });
    } catch (err) {
      // User cancellation or failure in Web Share is silent
      if ((err as Error).name !== 'AbortError') {
        console.warn('[ShareButtons] Web Share failed:', err);
      }
    }
  };

  const handleCopyLink = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 3000);
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 3000);
    } catch (err) {
      console.error('[ShareButtons] Clipboard copy failed:', err);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const socialLinks = [
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      label: 'Share on WhatsApp',
    },
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      label: 'Share on X',
    },
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      label: 'Share on LinkedIn',
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      label: 'Share on Facebook',
    },
  ];

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 py-space-6 border-y border-border ${className}`}>
      <div className="flex items-center gap-space-2 text-small text-fg-muted font-medium">
        <span>Share article:</span>
      </div>

      <div className="flex flex-wrap items-center gap-space-2">
        {canWebShare && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleNativeShare}
            aria-label="Share via system share menu"
          >
            <svg className="w-4 h-4 mr-space-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share</span>
          </Button>
        )}

        {socialLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${link.name}: ${link.label}`}
            className="inline-flex items-center justify-center min-h-[44px] px-space-3 py-space-2 text-small font-medium text-fg hover:text-primary bg-surface border border-border hover:border-primary/40 rounded-sm focus-ring transition-colors duration-fast"
          >
            <span>{link.name}</span>
          </a>
        ))}

        <div className="relative inline-flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            aria-label="Copy link to clipboard"
          >
            <svg className="w-4 h-4 mr-space-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className={copyStatus === 'error' ? 'text-error' : ''}>
              {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'error' ? 'Failed to copy' : 'Copy link'}
            </span>
          </Button>

          {/* Feedback announcement */}
          <span className="sr-only" role="status" aria-live="polite">
            {copyStatus === 'copied' && 'Article link copied to clipboard'}
            {copyStatus === 'error' && 'Failed to copy article link to clipboard'}
          </span>
        </div>
      </div>
    </div>
  );
}
