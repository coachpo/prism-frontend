import type { Profile } from "@/lib/types";

export interface ProfileBootstrapState {
  activeProfile: Profile | null;
  profiles: Profile[];
}

export interface ProfileBootstrapApi {
  getActiveProfile: () => Promise<Profile | null>;
  listProfiles: () => Promise<Profile[]>;
}

export function createProfileBootstrapLoader(api: ProfileBootstrapApi) {
  let profileBootstrapPromise: Promise<ProfileBootstrapState> | null = null;

  return async function loadProfileBootstrapState(
    reuseInFlight = false,
  ): Promise<ProfileBootstrapState> {
    if (reuseInFlight && profileBootstrapPromise) {
      return profileBootstrapPromise;
    }

    const loadPromise = Promise.all([
      api.listProfiles(),
      api.getActiveProfile(),
    ]).then(([profiles, activeProfile]) => ({
      activeProfile,
      profiles,
    }));

    if (reuseInFlight) {
      profileBootstrapPromise = loadPromise;
      void loadPromise.finally(() => {
        if (profileBootstrapPromise === loadPromise) {
          profileBootstrapPromise = null;
        }
      });
    }

    return loadPromise;
  };
}
