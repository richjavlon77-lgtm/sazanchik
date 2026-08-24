import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getSession } from "@/lib/session";
import { signTable } from "@/lib/table-sign";
import { tableAlias, vipName } from "@/lib/tables";
import { FishMark } from "@/components/print/marks";
import "./qr.css";

export const metadata = {
  title: "Сазанчик CITY — QR-карточки столов",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Карточек на листе A4: 2×2 */
const PER_SHEET = 4;

export default async function QRPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ count?: string }>;
}) {
  // QR подписаны секретным ключом — страница только для менеджера
  const session = await getSession();
  if (!session || session.role !== "manager") redirect("/admin");

  const params = await searchParams;
  const count = Math.max(1, Math.min(100, Number(params.count) || 35));

  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://sazanchik.vercel.app";

  const cards = await Promise.all(
    Array.from({ length: count }, async (_, i) => {
      const num = i + 1;
      const url = `${base}/?t=${encodeURIComponent(signTable(String(num)))}`;
      const qr = await QRCode.toDataURL(url, {
        width: 640,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#101613", light: "#f7f2e8" },
      });
      const alias = tableAlias(num);
      return {
        num,
        qr,
        // «STREET 15» → STREET / 15, «VIP 1» → VIP / 1 (+имя кабины)
        word: alias ? alias.replace(/\s+\d+$/, "") : "Стол",
        digit: alias ? (alias.match(/(\d+)$/)?.[1] ?? String(num)) : String(num),
        cabin: vipName(num),
      };
    })
  );

  const sheets: (typeof cards)[] = [];
  for (let i = 0; i < cards.length; i += PER_SHEET) {
    sheets.push(cards.slice(i, i + PER_SHEET));
  }

  return (
    <div className="qr-root">
      {sheets.map((sheet, si) => (
        <div key={si} className="qr-sheet">
          {sheet.map((c) => (
            <div key={c.num} className="qr-cell">
              {/* Метки реза — по трим-линии 90×125 мм */}
              <span className="crop tl" aria-hidden />
              <span className="crop tr" aria-hidden />
              <span className="crop bl" aria-hidden />
              <span className="crop br" aria-hidden />

              {/* Карточка с вылетами 2 мм под обрез */}
              <div className="qr-card">
                <div className="qr-frame">
                  <FishMark className="qr-fish" />

                  <div className="qr-panel">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.qr} alt={`QR — ${c.word} ${c.digit}`} />
                  </div>

                  <div className="qr-menu-word">Menu</div>

                  {c.cabin && <div className="qr-cabin">{c.cabin}</div>}
                  <div className="qr-table">
                    <span className="qr-word">{c.word}</span>
                    <span className="qr-digit">{c.digit}</span>
                  </div>

                  <div className="qr-hint">
                    Наведите камеру · Kamerani qarating
                  </div>

                  {/* Реклама доставки — только текстом, QR на карточке один */}
                  <div className="qr-delivery">
                    <div className="qr-delivery-title">🚚 Доставка на дом</div>
                    <div className="qr-delivery-handle">
                      Telegram · @Sazanchik_city_bot
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
