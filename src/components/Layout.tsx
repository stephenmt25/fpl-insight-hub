import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BottomNav } from "./navigation/BottomNav";

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-20 md:pb-0 py-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}
