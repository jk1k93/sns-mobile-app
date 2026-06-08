import * as SecureStore from 'expo-secure-store';

const KEY = 'sportsnstats_selected_sport_id';

export async function getSelectedSportId(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}

export async function setSelectedSportId(id: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, id);
}

export async function clearSelectedSportId(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
