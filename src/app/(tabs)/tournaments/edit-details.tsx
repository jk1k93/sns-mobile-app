import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchTournament, updateTournament, type UpdateTournamentPayload } from "@/api/tournaments";
import type { Venue } from "@/api/venues";
import { ContactsField } from "@/components/tournament/contacts-field";
import { DatePickerField } from "@/components/tournament/date-picker-field";
import { VenueSearchField } from "@/components/tournament/venue-search-field";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/primary-button";
import { AppColors } from "@/constants/app-colors";
import { useAuth } from "@/contexts/auth-context";
import type { DraftContact } from "@/contexts/tournament-draft-context";
import { useHideTabBarWhileFocused } from "@/hooks/use-hide-tab-bar";
import { ApiError } from "@/lib/api";
import { parseIsoDate } from "@/lib/date";

function parseApiErrorMessage(body?: string): string | undefined {
  if (!body) return undefined;
  try {
    const parsed = JSON.parse(body);
    return typeof parsed.error === "string" ? parsed.error : undefined;
  } catch {
    return undefined;
  }
}

export default function EditTournamentDetailsScreen() {
  const router = useRouter();
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  useHideTabBarWhileFocused();

  const { data: tournament, isLoading, isError } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => fetchTournament(accessToken!, tournamentId),
    enabled: !!accessToken && !!tournamentId,
  });

  const [name, setName] = useState("");
  const [venue, setVenue] = useState<Venue | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [registrationStartDate, setRegistrationStartDate] = useState<string | null>(null);
  const [registrationEndDate, setRegistrationEndDate] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [contacts, setContacts] = useState<DraftContact[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!tournament) return;
    setName(tournament.name);
    setVenue(
      tournament.venue
        ? {
            id: tournament.venue.id,
            name: tournament.venue.name,
            city: tournament.venue.city?.name ?? null,
            address: tournament.venue.address,
          }
        : null
    );
    setStartDate(tournament.tournamentStartDate);
    setEndDate(tournament.tournamentEndDate);
    setRegistrationStartDate(tournament.registrationStartDate);
    setRegistrationEndDate(tournament.registrationEndDate);
    setDescription(tournament.description ?? "");
    setContacts(
      tournament.contacts.map((c) => ({
        userId: c.userId,
        name: c.user.name ?? c.user.phoneNumber,
        phone: c.user.phoneNumber,
      }))
    );
  }, [tournament]);

  const startAsDate = useMemo(() => {
    if (!startDate) return undefined;
    return parseIsoDate(startDate) ?? undefined;
  }, [startDate]);

  const regStartAsDate = useMemo(() => {
    if (!registrationStartDate) return undefined;
    return parseIsoDate(registrationStartDate) ?? undefined;
  }, [registrationStartDate]);

  const canContinue = useMemo(() => {
    if (!name.trim() || !venue) return false;
    if (startDate && endDate) {
      const a = parseIsoDate(startDate);
      const b = parseIsoDate(endDate);
      if (a && b && b.getTime() < a.getTime()) return false;
    }
    if (registrationStartDate && registrationEndDate) {
      const rs = parseIsoDate(registrationStartDate);
      const re = parseIsoDate(registrationEndDate);
      if (rs && re && re.getTime() < rs.getTime()) return false;
    }
    return true;
  }, [name, venue, startDate, endDate, registrationStartDate, registrationEndDate]);

  const onContinue = async () => {
    if (!canContinue || isSubmitting || !accessToken || !tournamentId || !venue) return;

    const contactsPayload = contacts.map((c) =>
      c.userId ? { userId: c.userId } : { name: c.name, phone: c.phone }
    );

    const payload: UpdateTournamentPayload = {
      name: name.trim(),
      venueId: venue.id,
      ...(startDate ? { tournamentStartDate: startDate } : {}),
      ...(endDate ? { tournamentEndDate: endDate } : {}),
      ...(registrationStartDate ? { registrationStartDate } : {}),
      ...(registrationEndDate ? { registrationEndDate } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      contacts: contactsPayload,
    };

    setIsSubmitting(true);
    try {
      await updateTournament(accessToken, tournamentId, payload);
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      router.push({
        pathname: "/tournaments/sport-details",
        params: { tournamentId, mode: "edit", tournamentName: name.trim() },
      });
    } catch (e) {
      const message =
        e instanceof ApiError
          ? (parseApiErrorMessage(e.body) ?? e.message)
          : "Something went wrong. Please try again.";
      Alert.alert("Failed to save tournament", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ThemedView style={styles.flex}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color={AppColors.textDark} />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {tournament?.name ?? "Edit tournament"}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {isLoading && (
            <ActivityIndicator
              size="large"
              color={AppColors.primary}
              style={styles.centered}
            />
          )}

          {isError && (
            <View style={styles.centered}>
              <Text style={styles.errorText}>Failed to load tournament.</Text>
            </View>
          )}

          {tournament && (
            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.fieldLabel}>
                Tournament name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Summer Open 2026"
                placeholderTextColor={AppColors.placeholder}
                style={styles.input}
              />

              <VenueSearchField
                label={<>Tournament location <Text style={styles.required}>*</Text></>}
                value={venue}
                onChange={setVenue}
                onAddNewVenue={() => router.push("/tournaments/add-venue")}
              />

              <DatePickerField
                label="Tournament start date"
                value={startDate}
                onChange={setStartDate}
              />

              <DatePickerField
                label="Tournament end date"
                value={endDate}
                onChange={setEndDate}
                minimumDate={startAsDate}
              />

              <DatePickerField
                label="Registration start date"
                value={registrationStartDate}
                onChange={setRegistrationStartDate}
                maximumDate={startAsDate}
              />

              <DatePickerField
                label="Registration end date"
                value={registrationEndDate}
                onChange={setRegistrationEndDate}
                minimumDate={regStartAsDate}
                maximumDate={startAsDate}
              />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the tournament, rules, prizes…"
                placeholderTextColor={AppColors.placeholder}
                style={[styles.input, styles.descriptionInput]}
                multiline
                textAlignVertical="top"
              />

              <ContactsField
                contacts={contacts}
                onAdd={(c) => setContacts((prev) => [...prev, c])}
                onRemove={(phone) =>
                  setContacts((prev) => prev.filter((c) => c.phone !== phone))
                }
              />

              <PrimaryButton
                title={isSubmitting ? "Saving…" : "Continue"}
                onPress={onContinue}
                disabled={!canContinue || isSubmitting}
                style={styles.continueBtn}
              />
            </ScrollView>
          )}
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.textDark,
    textAlign: "center",
  },
  headerSpacer: {
    width: 24,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 15,
    color: AppColors.textMuted,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textDark,
    marginBottom: 8,
  },
  required: {
    color: AppColors.primary,
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
  descriptionInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  continueBtn: {
    marginTop: 8,
  },
});
