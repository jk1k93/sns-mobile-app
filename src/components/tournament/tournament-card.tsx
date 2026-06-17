import { Pressable, StyleSheet, Text, View } from "react-native";

import type { TournamentListItem, TournamentStatus } from "@/api/tournaments";
import { AppColors } from "@/constants/app-colors";
import { parseIsoDate } from "@/lib/date";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = parseIsoDate(iso);
  if (!d) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_LABEL: Record<TournamentStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CANCELLED: "Cancelled",
  ARCHIVED: "Archived",
};

const STATUS_COLORS: Record<TournamentStatus, { bg: string; text: string }> = {
  DRAFT: { bg: "#EEF2F5", text: "#546E7A" },
  PUBLISHED: { bg: "#E0F2F1", text: AppColors.primaryDark },
  CANCELLED: { bg: "#FDECEA", text: "#C62828" },
  ARCHIVED: { bg: "#ECEFF1", text: "#455A64" },
};

type Props = {
  tournament: TournamentListItem;
  onPress: () => void;
};

export function TournamentCard({ tournament, onPress }: Props) {
  const statusColor = STATUS_COLORS[tournament.status];
  const startDate = formatDate(tournament.tournamentStartDate);
  const endDate = formatDate(tournament.tournamentEndDate);
  const venueName = tournament.venue?.name ?? null;
  const venueCity = tournament.venue?.city?.name ?? null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
    >
      <View style={styles.topRow}>
        <Text style={styles.name} numberOfLines={1}>{tournament.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {STATUS_LABEL[tournament.status]}
          </Text>
        </View>
      </View>

      {(venueName || venueCity) && (
        <Text style={styles.venue} numberOfLines={1}>
          {[venueName, venueCity].filter(Boolean).join(" · ")}
        </Text>
      )}

      {(startDate || endDate) && (
        <Text style={styles.dates}>
          {startDate && endDate
            ? `${startDate} – ${endDate}`
            : startDate ?? endDate}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C8E6D9",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.textDark,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  venue: {
    fontSize: 14,
    color: AppColors.textMuted,
    marginTop: 2,
  },
  dates: {
    fontSize: 13,
    color: AppColors.placeholder,
    marginTop: 4,
  },
});
