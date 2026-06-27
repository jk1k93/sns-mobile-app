import type { TournamentDetail } from "@/api/tournaments";
import { CricketConfigDisplay } from "./cricket-config-display";

export function SportConfigDisplay({ tournament }: { tournament: TournamentDetail }) {
  const sport = tournament.sport.name.toLowerCase();

  if (sport === "cricket" && tournament.cricketTournamentConfig) {
    return <CricketConfigDisplay config={tournament.cricketTournamentConfig} />;
  }

  return null;
}
