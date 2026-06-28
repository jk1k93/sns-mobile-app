import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  createCricketConfig,
  getCricketConfig,
  updateCricketConfig,
} from "@/api/cricket-config";
import { OptionSelectField } from "@/components/tournament/option-select-field";
import { PrimaryButton } from "@/components/ui/primary-button";
import { AppColors } from "@/constants/app-colors";
import { ApiError } from "@/lib/api";
import type { BallType, GroundType } from "@/contexts/tournament-draft-context";

function isPositiveIntegerText(text: string): boolean {
  return /^[1-9][0-9]*$/.test(text.trim());
}

function parseApiErrorMessage(body?: string): string | undefined {
  if (!body) return undefined;
  try {
    const parsed = JSON.parse(body);
    return typeof parsed.error === "string" ? parsed.error : undefined;
  } catch {
    return undefined;
  }
}

type CricketConfigFormProps = {
  tournamentId: string;
  onSave: () => void;
};

export function CricketConfigForm({ tournamentId, onSave }: CricketConfigFormProps) {
  const [groundType, setGroundType] = useState<GroundType | null>(null);
  const [ballType, setBallType] = useState<BallType | null>(null);
  const [numberOfTeams, setNumberOfTeams] = useState("");
  const [playersPerTeam, setPlayersPerTeam] = useState("");
  const [isAuctionBased, setIsAuctionBased] = useState<boolean | null>(null);
  const [auctionPurse, setAuctionPurse] = useState("");
  const [playerBasePrice, setPlayerBasePrice] = useState("");
  const { data: existingConfig, isLoading, isError } = useQuery({
    queryKey: ["cricket-config", tournamentId],
    queryFn: () => getCricketConfig(tournamentId),
  });

  useEffect(() => {
    if (!existingConfig) return;
    setGroundType(existingConfig.groundType);
    setBallType(existingConfig.ballType);
    setNumberOfTeams(String(existingConfig.numberOfTeams));
    setPlayersPerTeam(String(existingConfig.playersPerTeam));
    setIsAuctionBased(existingConfig.auctionBased);
    setAuctionPurse(existingConfig.auctionPurse != null ? String(existingConfig.auctionPurse) : "");
    setPlayerBasePrice(existingConfig.playerBasePrice != null ? String(existingConfig.playerBasePrice) : "");
  }, [existingConfig]);

  const auctionFieldsValid =
    !isAuctionBased ||
    (isPositiveIntegerText(auctionPurse) && isPositiveIntegerText(playerBasePrice));

  const canSave = useMemo(
    () =>
      groundType !== null &&
      ballType !== null &&
      isPositiveIntegerText(numberOfTeams) &&
      isPositiveIntegerText(playersPerTeam) &&
      isAuctionBased !== null &&
      auctionFieldsValid,
    [groundType, ballType, numberOfTeams, playersPerTeam, isAuctionBased, auctionFieldsValid]
  );

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createCricketConfig>[1]) =>
      existingConfig
        ? updateCricketConfig(tournamentId, payload)
        : createCricketConfig(tournamentId, payload),
    onSuccess: onSave,
    onError: (e) => {
      const message =
        e instanceof ApiError
          ? (parseApiErrorMessage(e.body) ?? e.message)
          : "Something went wrong. Please try again.";
      Alert.alert("Failed to save cricket details", message);
    },
  });

  const onSubmit = () => {
    if (!canSave || saveMutation.isPending) return;

    saveMutation.mutate({
      groundType: groundType!,
      ballType: ballType!,
      numberOfTeams: parseInt(numberOfTeams, 10),
      playersPerTeam: parseInt(playersPerTeam, 10),
      auctionBased: isAuctionBased ?? false,
      ...(isAuctionBased
        ? {
            auctionPurse: parseInt(auctionPurse, 10),
            playerBasePrice: parseInt(playerBasePrice, 10),
          }
        : {}),
    });
  };

  if (isLoading) {
    return (
      <ActivityIndicator
        size="large"
        color={AppColors.primary}
        style={styles.loader}
      />
    );
  }

  if (isError) {
    return (
      <View style={styles.errorWrap}>
        <Text style={styles.errorText}>Failed to load cricket config.</Text>
      </View>
    );
  }

  return (
    <>
      <OptionSelectField
        label="Ground type"
        value={groundType}
        onChange={setGroundType}
        options={[
          { value: "BOX", label: "Box cricket" },
          { value: "OPEN", label: "Open ground" },
        ]}
      />

      <OptionSelectField
        label="Ball type"
        value={ballType}
        onChange={setBallType}
        options={[
          { value: "TENNIS", label: "Tennis ball" },
          { value: "LEATHER", label: "Leather ball" },
        ]}
      />

      <Text style={styles.fieldLabel}>Number of teams</Text>
      <TextInput
        value={numberOfTeams}
        onChangeText={setNumberOfTeams}
        placeholder="e.g. 8"
        placeholderTextColor={AppColors.placeholder}
        keyboardType="number-pad"
        style={styles.input}
      />

      <Text style={styles.fieldLabel}>Players per team</Text>
      <TextInput
        value={playersPerTeam}
        onChangeText={setPlayersPerTeam}
        placeholder="e.g. 11"
        placeholderTextColor={AppColors.placeholder}
        keyboardType="number-pad"
        style={styles.input}
      />

      <OptionSelectField
        label="Auction based"
        value={isAuctionBased}
        onChange={(val) => {
          setIsAuctionBased(val);
          if (!val) {
            setAuctionPurse("");
            setPlayerBasePrice("");
          }
        }}
        options={[
          { value: true, label: "Yes" },
          { value: false, label: "No" },
        ]}
      />

      {isAuctionBased && (
        <>
          <Text style={styles.fieldLabel}>Purse per team</Text>
          <TextInput
            value={auctionPurse}
            onChangeText={setAuctionPurse}
            placeholder="e.g. 100000"
            placeholderTextColor={AppColors.placeholder}
            keyboardType="number-pad"
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>Base price per player</Text>
          <TextInput
            value={playerBasePrice}
            onChangeText={setPlayerBasePrice}
            placeholder="e.g. 1000"
            placeholderTextColor={AppColors.placeholder}
            keyboardType="number-pad"
            style={styles.input}
          />
        </>
      )}

      <PrimaryButton
        title={saveMutation.isPending ? "Saving…" : "Save"}
        onPress={onSubmit}
        disabled={!canSave || saveMutation.isPending}
        style={styles.saveBtn}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 32,
  },
  errorWrap: {
    marginTop: 32,
    alignItems: "center",
  },
  errorText: {
    fontSize: 15,
    color: AppColors.textMuted,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textDark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#C8E6D9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: AppColors.textDark,
    backgroundColor: AppColors.white,
    marginBottom: 16,
  },
  saveBtn: {
    marginTop: 8,
  },
});
