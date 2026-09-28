import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageTransitionProvider } from "@/components/layout/PageTransitionProvider";
import { MainChrome } from "@/components/layout/MainChrome";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { getSiteInfo } from "@/lib/get-site-info";
import { getActiveAlert } from "@/lib/get-active-alert";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [siteInfo, activeAlert] = await Promise.all([
    getSiteInfo(),
    getActiveAlert(),
  ]);

  return (
    <PageTransitionProvider>
      {/* Grain overlay — SVG noise texture, fixed, site-wide */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-50 mix-blend-overlay opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        }}
      />
      {activeAlert && <AlertBanner alert={activeAlert} />}
      <Header siteInfo={siteInfo} />
      <div className="flex flex-col min-h-screen">
        <MainChrome>{children}</MainChrome>
        <Footer siteInfo={siteInfo} />
      </div>
    </PageTransitionProvider>
  );
}
