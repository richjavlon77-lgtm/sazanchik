export const metadata = {
  title: "Официант · Сазанчик",
  robots: { index: false, follow: false },
};

export default function WaiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
