import { Stack } from "expo-router";

import { AppColors } from "@/constants/app-colors";
import { TournamentDraftProvider } from "@/contexts/tournament-draft-context";

export default function TournamentsStackLayout() {
  return (
    <TournamentDraftProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: AppColors.white },
          animation: "slide_from_right",
        }}
      />
    </TournamentDraftProvider>
  );
}
