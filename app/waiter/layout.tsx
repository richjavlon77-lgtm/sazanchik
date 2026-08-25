export const metadata = {
  title: "Официант · Сазанчик",
  robots: { index: false, follow: false },
};

import { StaffChat } from "@/components/staff/StaffChat";

export default function WaiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
      <StaffChat />
    </div>
  );
}
