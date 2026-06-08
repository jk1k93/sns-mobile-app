import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
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

import { createVenue } from "@/api/venues";
import { CityAutocompleteField } from "@/components/tournament/city-autocomplete-field";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/components/ui/primary-button";
import { AppColors } from "@/constants/app-colors";
import { useAuth } from "@/contexts/auth-context";
import { useTournamentDraft } from "@/contexts/tournament-draft-context";
import { useHideTabBarWhileFocused } from "@/hooks/use-hide-tab-bar";
import {
  fetchCityDetails,
  type CityDetails,
  type CityPrediction,
} from "@/lib/google-places";
import { ApiError } from "@/lib/api";

export default function AddVenueScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const { setVenue } = useTournamentDraft();
  useHideTabBarWhileFocused();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityDetails | null>(null);
  const [loadingCityDetails, setLoadingCityDetails] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) throw new Error("Not signed in");
      if (!selectedCity) {
        throw new Error("Select a city from suggestions before saving");
      }
      return createVenue(accessToken, {
        city: selectedCity,
        venue: {
          name: name.trim(),
          address: address.trim() ? address.trim() : null,
        },
      });
    },
    onSuccess: (venue) => {
      setVenue(venue);
      void queryClient.invalidateQueries({ queryKey: ["venues"] });
      router.back();
    },
    onError: (e) => {
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not create venue";
      Alert.alert("Could not add venue", message);
    },
  });

  const canSave =
    name.trim().length > 0 &&
    city.trim().length > 0 &&
    Boolean(accessToken) &&
    Boolean(selectedCity) &&
    !loadingCityDetails;

  const handleCityChange = (value: string) => {
    setCity(value);
    setSelectedCity(null);
  };

  const handleCitySelect = async (prediction: CityPrediction) => {
    setLoadingCityDetails(true);
    try {
      const details = await fetchCityDetails(prediction.placeId);
      if (!details) {
        setSelectedCity(null);
        Alert.alert(
          "Could not use this city",
          "Please select another city suggestion and try again."
        );
        return;
      }
      setSelectedCity(details);
      setCity(prediction.description);
    } catch {
      setSelectedCity(null);
      Alert.alert("Could not verify city", "Please try selecting the city again.");
    } finally {
      setLoadingCityDetails(false);
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
            <Text style={styles.headerTitle}>Add new venue</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.fieldLabel}>Venue name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Riverside Sports Arena"
              placeholderTextColor={AppColors.placeholder}
              style={styles.input}
            />

            <CityAutocompleteField
              label="City"
              value={city}
              onChange={handleCityChange}
              onSelectPrediction={(prediction) => {
                void handleCitySelect(prediction);
              }}
            />
            {loadingCityDetails ? (
              <Text style={styles.helperText}>Verifying selected city…</Text>
            ) : null}
            {!loadingCityDetails && city.trim().length > 0 && !selectedCity ? (
              <Text style={styles.helperText}>
                Choose a city from suggestions to continue.
              </Text>
            ) : null}

            <Text style={styles.fieldLabel}>Address (optional)</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Street, area, pincode…"
              placeholderTextColor={AppColors.placeholder}
              style={[styles.input, styles.inputMultiline]}
              multiline
            />

            <PrimaryButton
              title="Save venue"
              onPress={() => mutation.mutate()}
              disabled={!canSave}
              loading={mutation.isPending}
            />
          </ScrollView>
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
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  helperText: {
    marginTop: -8,
    marginBottom: 12,
    fontSize: 12,
    color: AppColors.textMuted,
  },
});
