import React from 'react';

export interface ProductDescriptionProps {
  fullDescription?: string | null;
  shortDescription?: string | null;
}

/**
 * Safely parses HTML or plain text into clean paragraphs without dangerouslySetInnerHTML.
 *
 * Rule: If HTML, do NOT use dangerouslySetInnerHTML until Dev B confirms server-side sanitisation.
 * Render it as escaped text paragraphs.
 */
function toSafeParagraphs(content: string): string[] {
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(content);

  if (isHtml) {
    // Strip HTML tags and convert paragraph/break markers into clean line breaks
    const textOnly = content
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      // Decode common HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    return textOnly
      .split('\n\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  // Plain text: split into paragraphs by double newlines or single newlines
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export function ProductDescription({ fullDescription, shortDescription }: ProductDescriptionProps) {
  const descriptionContent = fullDescription || shortDescription;
  if (!descriptionContent || !descriptionContent.trim()) {
    return null;
  }

  const paragraphs = toSafeParagraphs(descriptionContent);
  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="description-heading"
      className="mt-space-8 pt-space-8 border-t border-border"
    >
      <h2
        id="description-heading"
        className="font-display font-light text-headline tracking-tight text-fg mb-space-4"
      >
        Product Details
      </h2>

      <div className="max-w-measure text-body text-fg leading-relaxed">
        {paragraphs.map((p, idx) => (
          <p key={idx} className="mb-space-4 last:mb-0">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
