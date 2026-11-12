/**
 * The link between the Score button (React) and the stadium scene (three.js).
 * The button queues goals; the scene drains the queue every frame and reports
 * back how hot things are and how much of the building is still standing.
 * This module has no dependencies, so the UI can use it without loading three.js.
 */

export type MayhemPhase = "standing" | "collapsing" | "rebuilding";

export interface MayhemState {
  /** The scene is running and listening for goals. */
  ready: boolean;
  /** Goals scored in the current streak. */
  goals: number;
  /** 0-1: builds with consecutive goals, cools when you stop. */
  heat: number;
  /** 0-1: share of the building still in one piece. */
  integrity: number;
  phase: MayhemPhase;
  /** 0-1 progress of the rebuild after the tower has fallen. */
  rebuild: number;
}

let state: MayhemState = { ready: false, goals: 0, heat: 0, integrity: 1, phase: "standing", rebuild: 0 };
let queued = 0;
const listeners = new Set<() => void>();

export const mayhem = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  getState: () => state,

  /** Called by the button. Ignored while the tower is down. */
  score() {
    if (state.ready && state.phase === "standing") queued++;
  },

  /** Called by the scene once a frame: how many goals were scored since last time. */
  takeGoals() {
    const goals = queued;
    queued = 0;
    return goals;
  },

  /** Called by the scene when anything the UI shows has changed. */
  report(next: Partial<MayhemState>) {
    const merged = { ...state, ...next };
    if ((Object.keys(merged) as (keyof MayhemState)[]).every((key) => merged[key] === state[key])) return;
    state = merged;
    listeners.forEach((listener) => listener());
  },
};
