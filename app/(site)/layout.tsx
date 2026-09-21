import Link from "next/link";
import { ChefHat, Plus } from "@/components/Icons";
import SignOutButton from "@/components/SignOutButton";
import SiteNav from "@/components/SiteNav";
import { gateEnabled } from "@/lib/auth";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <div className="wrap site-header-inner">
          <Link href="/" className="brand">
            <div className="brand-mark">
              <ChefHat size={21} />
            </div>
            <div className="brand-text">
              <div className="brand-title">Robinson&rsquo;s Recipes</div>
              <div className="brand-sub">Kitchen logbook</div>
            </div>
          </Link>
          <Link href="/new" className="btn btn-primary header-cta" aria-label="Add recipe">
            <Plus />
            <span>Add recipe</span>
          </Link>
          {gateEnabled() && <SignOutButton />}
        </div>
        <div className="wrap">
          <SiteNav />
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer">Made at home by Cam &amp; Alexia</footer>
    </>
  );
}
