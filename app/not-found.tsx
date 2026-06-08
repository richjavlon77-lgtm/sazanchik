import Link from "next/link";
import { SazanFish } from "@/components/icons/SazanFish";
import { OrnamentDivider } from "@/components/Ornament";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(212,178,106,0.10), transparent 60%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Fish swimming away into the gold horizon */}
        <div className="relative mb-6 h-24 w-64 overflow-hidden">
          <SazanFish className="absolute left-0 top-1/2 h-12 w-auto -translate-y-1/2 text-gold fish-swim-away" />
        </div>

        <div className="mb-2 text-[10px] uppercase tracking-[0.5em] text-gold/80">
          404 · Не туда заплыли
        </div>
        <h1 className="font-heading text-5xl md:text-6xl">
          <span className="italic text-gold">С</span>траница уплыла
        </h1>

        <OrnamentDivider className="mt-6 mb-6" />

        <p className="mb-8 max-w-md text-sm leading-relaxed text-muted-foreground">
          Этой страницы нет в меню. Возможно, ссылка устарела, или рыбка перешла
          в другой пруд. Возвращайтесь к главному.
        </p>

        <Link
          href="/"
          className="rounded-full border border-gold/40 px-6 py-2 text-xs uppercase tracking-[0.3em] text-gold transition-colors hover:bg-gold hover:text-primary-foreground"
        >
          К меню
        </Link>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .fish-swim-away {
              animation: swimAway 4s ease-in-out infinite;
            }
            @keyframes swimAway {
              0% { transform: translateX(0) translateY(-50%) scaleX(1); opacity: 0.9; }
              45% { transform: translateX(200px) translateY(-50%) scaleX(1); opacity: 0.3; }
              50% { transform: translateX(200px) translateY(-50%) scaleX(-1); opacity: 0.3; }
              95% { transform: translateX(0) translateY(-50%) scaleX(-1); opacity: 0.9; }
              100% { transform: translateX(0) translateY(-50%) scaleX(1); opacity: 0.9; }
            }
          `,
        }}
      />
    </div>
  );
}
