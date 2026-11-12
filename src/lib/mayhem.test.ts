import { describe, expect, it, vi } from "vitest";
import { mayhem } from "./mayhem";

describe("mayhem store", () => {
  it("ignores goals until the scene is listening", () => {
    mayhem.score();
    expect(mayhem.takeGoals()).toBe(0);
  });

  it("queues goals and hands them to the scene once", () => {
    mayhem.report({ ready: true });
    mayhem.score();
    mayhem.score();
    mayhem.score();
    expect(mayhem.takeGoals()).toBe(3);
    expect(mayhem.takeGoals()).toBe(0);
  });

  it("refuses goals while the tower is down", () => {
    mayhem.report({ phase: "collapsing" });
    mayhem.score();
    mayhem.report({ phase: "rebuilding", rebuild: 0.5 });
    mayhem.score();
    expect(mayhem.takeGoals()).toBe(0);
    mayhem.report({ phase: "standing", rebuild: 0 });
    mayhem.score();
    expect(mayhem.takeGoals()).toBe(1);
  });

  it("notifies subscribers only when something changed", () => {
    const listener = vi.fn();
    const unsubscribe = mayhem.subscribe(listener);
    mayhem.report({ heat: 0.4 });
    mayhem.report({ heat: 0.4 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(mayhem.getState().heat).toBe(0.4);
    unsubscribe();
    mayhem.report({ heat: 0.6 });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
