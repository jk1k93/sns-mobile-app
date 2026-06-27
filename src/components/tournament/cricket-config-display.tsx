import { StyleSheet, Text, View } from "react-native";

import type { CricketConfig } from "@/api/cricket-config";
import { AppColors } from "@/constants/app-colors";

const GROUND_TYPE_LABEL: Record<string, string> = {
  BOX: "Box cricket",
  OPEN: "Open ground",
};

const BALL_TYPE_LABEL: Record<string, string> = {
  TENNIS: "Tennis ball",
  LEATHER: "Leather ball",
};

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || "—"}</Text>
    </View>
  );
}

export function CricketConfigDisplay({ config }: { config: CricketConfig }) {
  return (
    <>
      <Text style={styles.sectionTitle}>Details</Text>
      <DetailRow
        label="Ground type"
        value={GROUND_TYPE_LABEL[config.groundType] ?? config.groundType}
      />
      <DetailRow
        label="Ball type"
        value={BALL_TYPE_LABEL[config.ballType] ?? config.ballType}
      />
      <DetailRow label="Number of teams" value={String(config.numberOfTeams)} />
      <DetailRow label="Players per team" value={String(config.playersPerTeam)} />
      <DetailRow label="Auction based" value={config.auctionBased ? "Yes" : "No"} />
      {config.auctionBased && (
        <>
          <DetailRow
            label="Purse per team"
            value={config.auctionPurse != null ? String(config.auctionPurse) : null}
          />
          <DetailRow
            label="Base price per player"
            value={config.playerBasePrice != null ? String(config.playerBasePrice) : null}
          />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.textDark,
    marginTop: 24,
    marginBottom: 4,
  },
  row: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rowValue: {
    fontSize: 15,
    color: AppColors.textDark,
  },
});
