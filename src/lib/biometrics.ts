/**
 * Profils biométriques type Homme / Femme : mesures classiques pour les tests
 * (VBT, mobilité, sauts, normes). Stockés dans les données athlète et utilisables en tests.
 */
export type Gender = "male" | "female";

export type BiometricProfile = {
  gender: Gender;
  dateOfBirth: Date | null;
  heightCm: number | null;
  weightKg: number | null;
  armSpanCm: number | null;
  sittingHeightCm: number | null;
  bodyFatPercent: number | null;
  restingHeartRate: number | null;
};

/** Valeurs par défaut pour un profil type Homme (référence tests / création compte) */
export const DEFAULT_BIOMETRICS_MALE: BiometricProfile = {
  gender: "male",
  dateOfBirth: new Date(1990, 0, 1), // 1er janv 1990 pour âge déterministe en tests
  heightCm: 178,
  weightKg: 75,
  armSpanCm: 182,
  sittingHeightCm: 92,
  bodyFatPercent: 15,
  restingHeartRate: 62,
};

/** Valeurs par défaut pour un profil type Femme (référence tests / création compte) */
export const DEFAULT_BIOMETRICS_FEMALE: BiometricProfile = {
  gender: "female",
  dateOfBirth: new Date(1992, 5, 15), // 15 juin 1992
  heightCm: 165,
  weightKg: 58,
  armSpanCm: 168,
  sittingHeightCm: 86,
  bodyFatPercent: 22,
  restingHeartRate: 68,
};

/** Noms d’affichage des profils par défaut */
export const DEFAULT_ATHLETE_NAMES = {
  male: "Profil Homme",
  female: "Profil Femme",
} as const;

/** Convertit un BiometricProfile en champs Prisma pour Athlete (sans name/isDefault/userId) */
export function toAthleteBiometricFields(profile: BiometricProfile) {
  return {
    gender: profile.gender,
    dateOfBirth: profile.dateOfBirth ?? undefined,
    heightCm: profile.heightCm ?? undefined,
    weightKg: profile.weightKg ?? undefined,
    armSpanCm: profile.armSpanCm ?? undefined,
    sittingHeightCm: profile.sittingHeightCm ?? undefined,
    bodyFatPercent: profile.bodyFatPercent ?? undefined,
    restingHeartRate: profile.restingHeartRate ?? undefined,
  };
}
