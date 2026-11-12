import type { Player } from "@/lib/fpl/types";
import type { TeamFixture } from "@/lib/fpl/fixtures";
import { num } from "@/lib/fpl/format";

export interface CaptainOption {
  player: Player;
  score: number;
  fixtures: TeamFixture[];
  reasons: string[];
}

/**
 * Ranks captain candidates for the next gameweek: FPL's own expected points,
 * nudged by fixture difficulty, home advantage, recent form and availability.
 */
export function rankCaptains(squad: Player[], nextFixtures: Map<number, TeamFixture[]>): CaptainOption[] {
  return squad
    .map((player) => {
      const fixtures = nextFixtures.get(player.team) ?? [];
      const reasons: string[] = [];
      const ep = num(player.ep_next);
      const form = num(player.form);
      let score = ep * 0.7 + form * 0.3;

      if (fixtures.length === 0) {
        score = 0;
        reasons.push("No fixture next gameweek");
      } else {
        const ease = fixtures.reduce((s, f) => s + (3 - f.difficulty) * 0.1 + (f.home ? 0.05 : 0), 0);
        score *= 1 + ease;
        if (fixtures.length > 1) { score *= 1.6; reasons.push("Double gameweek"); }
        const easiest = Math.min(...fixtures.map((f) => f.difficulty));
        if (easiest <= 2) reasons.push("Favourable fixture");
        if (easiest >= 4) reasons.push("Tough fixture");
        if (fixtures.some((f) => f.home)) reasons.push("Playing at home");
      }

      const chance = player.chance_of_playing_next_round;
      if (chance != null && chance < 100) {
        score *= chance / 100;
        reasons.push(`${chance}% chance of playing`);
      }
      if (player.penalties_order === 1) { score *= 1.05; reasons.push("On penalties"); }
      if (form >= 6) reasons.push(`In form (${form.toFixed(1)})`);
      reasons.unshift(`${ep.toFixed(1)} expected points`);

      return { player, score: +score.toFixed(2), fixtures, reasons };
    })
    .sort((a, b) => b.score - a.score);
}
