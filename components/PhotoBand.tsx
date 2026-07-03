import { Reveal } from "@/components/Reveal";

/** Cinematic Khiva photo strip placed between menu sections — ambiance you
 *  pass through while scrolling. Self-contained dark zone, so it reads in both
 *  light and dark themes (unlike a faint full-page backdrop). */
export function PhotoBand({ src, caption }: { src: string; caption?: string }) {
  return (
    <Reveal className="my-10 md:my-12">
      <figure className="relative overflow-hidden rounded-3xl shadow-xl shadow-black/25 ring-1 ring-gold/15">
        <div
          className="aspect-[2/1] bg-cover bg-center transition-transform duration-[1.2s] ease-out hover:scale-[1.03] md:aspect-[5/2]"
          style={{ backgroundImage: `url(${src})` }}
        />
        {/* depth + legibility */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(10,8,5,0.6) 0%, transparent 45%)",
          }}
        />
        {caption && (
          <figcaption className="absolute bottom-3 left-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-white/85">
            <span className="h-px w-5 bg-gold/70" />
            {caption}
          </figcaption>
        )}
      </figure>
    </Reveal>
  );
}
