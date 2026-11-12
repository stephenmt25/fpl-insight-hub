import { useEffect, useRef } from "react";
import * as THREE from "three";
import { BLOOD, mountStage } from "./stage";
import { createCrown, createDust, createFootball, createThornRing } from "./models";
import { setupStadium } from "./stadium";
import { cn } from "@/lib/utils";

function useStage(mount: (el: HTMLElement) => () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? mount(ref.current) : undefined), []); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}

/** Hero piece: crowned chrome football inside counter-rotating thorn rings. */
export function HeroScene({ className }: { className?: string }) {
  const ref = useStage((el) =>
    mountStage(el, {
      fov: 34,
      reflections: true,
      setup: ({ scene, camera, pointer }) => {
        camera.position.set(0, 0.3, 8.3);

        const rig = new THREE.Group();
        rig.scale.setScalar(0.86);
        scene.add(rig);

        const ball = createFootball(1.15);
        rig.add(ball);

        const crown = createCrown(0.5);
        crown.position.y = 1.52;
        rig.add(crown);

        const rings = [createThornRing(1.75, 28), createThornRing(2.15, 36), createThornRing(2.5, 44)];
        rings[0].rotation.x = Math.PI / 2.4;
        rings[1].rotation.set(Math.PI / 3, Math.PI / 5, 0);
        rings[2].rotation.set(-Math.PI / 2.6, -Math.PI / 6, 0);
        rings.forEach((r) => rig.add(r));

        const dust = createDust(260, [14, 9, 8], 0xd8dbe4, 0.035);
        scene.add(dust);

        scene.add(new THREE.AmbientLight(0x8890a8, 0.5));
        const key = new THREE.DirectionalLight(0xffffff, 2.2);
        key.position.set(4, 6, 6);
        scene.add(key);
        const rim = new THREE.PointLight(BLOOD, 60, 18);
        rim.position.set(-4, -1.5, 2.5);
        scene.add(rim);
        const under = new THREE.PointLight(0x5b6cff, 18, 14);
        under.position.set(3, -3, -2);
        scene.add(under);

        return (time) => {
          ball.rotation.y = time * 0.35;
          ball.rotation.x = Math.sin(time * 0.3) * 0.25;
          crown.rotation.y = -time * 0.5;
          crown.position.y = 1.52 + Math.sin(time * 1.2) * 0.05;
          rings[0].rotation.z = time * 0.22;
          rings[1].rotation.z = -time * 0.16;
          rings[2].rotation.z = time * 0.1;
          dust.rotation.y = time * 0.02;
          rim.intensity = 55 + Math.sin(time * 1.7) * 18;
          rig.rotation.y = pointer.x * 0.35;
          rig.rotation.x = -pointer.y * 0.2;
        };
      },
    }),
  );
  return <div ref={ref} className={cn("h-full w-full", className)} aria-hidden />;
}

/** Fixed full-page backdrop: the cathedral stadium, filmed from a circling blimp. */
export function Backdrop() {
  const ref = useStage((el) => mountStage(el, { fov: 48, far: 1400, reflections: true, setup: setupStadium }));
  return <div ref={ref} className="pointer-events-none fixed inset-0 z-0" aria-hidden />;
}

/** Small spinning football for empty states and gates. */
export function BallScene({ className }: { className?: string }) {
  const ref = useStage((el) =>
    mountStage(el, {
      fov: 30,
      reflections: true,
      setup: ({ scene, camera }) => {
        camera.position.set(0, 0, 6.4);
        const ball = createFootball(1);
        const ring = createThornRing(1.55, 24);
        ring.rotation.x = Math.PI / 2.3;
        scene.add(ball, ring);
        scene.add(new THREE.AmbientLight(0x8890a8, 0.6));
        const key = new THREE.DirectionalLight(0xffffff, 2);
        key.position.set(3, 5, 5);
        scene.add(key);
        const rim = new THREE.PointLight(BLOOD, 40, 12);
        rim.position.set(-3, -1, 2);
        scene.add(rim);
        return (time) => {
          ball.rotation.set(Math.sin(time * 0.4) * 0.3, time * 0.6, 0);
          ring.rotation.z = time * 0.3;
        };
      },
    }),
  );
  return <div ref={ref} className={cn("h-40 w-40", className)} aria-hidden />;
}
