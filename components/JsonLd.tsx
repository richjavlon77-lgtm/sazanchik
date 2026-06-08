/**
 * Server component — injects JSON-LD structured data into <head> via script tag.
 * Renders nothing visible.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // structured data — JSON.stringify is safe here, no user input
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
