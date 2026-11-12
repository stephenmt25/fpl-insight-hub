import { lazy, Suspense } from "react";

// three.js is ~145 kB gzipped; load it after the first paint.
const load = () => import("./scenes");
const LazyBackdrop = lazy(() => load().then((m) => ({ default: m.Backdrop })));
const LazyHero = lazy(() => load().then((m) => ({ default: m.HeroScene })));
const LazyBall = lazy(() => load().then((m) => ({ default: m.BallScene })));

export const Backdrop = () => <Suspense fallback={null}><LazyBackdrop /></Suspense>;
export const HeroScene = ({ className }: { className?: string }) => <Suspense fallback={null}><LazyHero className={className} /></Suspense>;
export const BallScene = ({ className }: { className?: string }) => (
  <Suspense fallback={<div className={className ?? "h-40 w-40"} />}><LazyBall className={className} /></Suspense>
);
