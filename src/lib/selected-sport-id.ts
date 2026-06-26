import * as SecureStore from 'expo-secure-store';

const key = (userId: string) => `sportsnstats_selected_sport_id_${userId}`;

export async function getSelectedSportId(userId: string): Promise<string | null> {
  return SecureStore.getItemAsync(key(userId));
}

export async function setSelectedSportId(userId: string, id: string): Promise<void> {
  await SecureStore.setItemAsync(key(userId), id);
}

export async function clearSelectedSportId(userId: string): Promise<void> {
  await SecureStore.deleteItemAsync(key(userId));
}
