import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, setApiProfileId } from "@/lib/api";
import type { Profile, ProfileCreate, ProfileUpdate } from "@/lib/types";

interface ProfileContextType {
  profiles: Profile[];
  activeProfile: Profile | null;
  selectedProfile: Profile | null;
  selectedProfileId: number | null;
  isLoading: boolean;
  error: string | null;
  revision: number;
  selectProfile: (profileId: number) => void;
  refreshProfiles: () => Promise<Profile[]>;
  createProfile: (data: ProfileCreate) => Promise<Profile>;
  updateProfile: (id: number, data: ProfileUpdate) => Promise<Profile>;
  activateProfile: (id: number) => Promise<Profile>;
  deleteProfile: (id: number) => Promise<void>;
  bumpRevision: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const STORAGE_KEY = "prism.selectedProfileId";

function parseStoredProfileId(raw: string | null): number | null {
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId]
  );

  const bumpRevision = useCallback(() => {
    setRevision((previous) => previous + 1);
  }, []);

  const selectProfile = useCallback(
    (profileId: number) => {
      setSelectedProfileId(profileId);
      setApiProfileId(profileId);
      localStorage.setItem(STORAGE_KEY, String(profileId));
      bumpRevision();
    },
    [bumpRevision]
  );

  const refreshProfiles = useCallback(async () => {
    const data = await api.profiles.list();
    setProfiles(data);
    setActiveProfile(data.find((profile) => profile.is_active) ?? null);
    return data;
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [fetchedProfiles, fetchedActiveProfile] = await Promise.all([
          api.profiles.list(),
          api.profiles.getActive(),
        ]);
        if (!mounted) return;

        setProfiles(fetchedProfiles);
        setActiveProfile(fetchedActiveProfile);

        const persistedId = parseStoredProfileId(localStorage.getItem(STORAGE_KEY));
        const persistedProfile =
          persistedId === null
            ? null
            : fetchedProfiles.find((profile) => profile.id === persistedId) ?? null;

        const targetProfile = persistedProfile ?? fetchedActiveProfile;
        if (targetProfile) {
          setSelectedProfileId(targetProfile.id);
          setApiProfileId(targetProfile.id);
          localStorage.setItem(STORAGE_KEY, String(targetProfile.id));
        } else {
          setSelectedProfileId(null);
          setApiProfileId(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        if (mounted) {
          const message = err instanceof Error ? err.message : "Failed to initialize profiles";
          setError(message);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const createProfile = useCallback(
    async (data: ProfileCreate) => {
      try {
        const createdProfile = await api.profiles.create(data);
        await refreshProfiles();
        return createdProfile;
      } catch (err) {
        if (err instanceof Error && err.message.includes("409")) {
          throw new Error(
            "Maximum 10 profiles reached. Delete a profile to create a new one."
          );
        }
        throw err;
      }
    },
    [refreshProfiles]
  );

  const updateProfile = useCallback(
    async (id: number, data: ProfileUpdate) => {
      const updatedProfile = await api.profiles.update(id, data);
      await refreshProfiles();
      return updatedProfile;
    },
    [refreshProfiles]
  );

  const activateProfile = useCallback(
    async (id: number) => {
      if (!activeProfile) {
        throw new Error("No active profile snapshot available");
      }

      try {
        const updatedProfile = await api.profiles.activate(id, {
          expected_active_profile_id: activeProfile.id,
          expected_active_profile_version: activeProfile.version,
        });
        await refreshProfiles();
        return updatedProfile;
      } catch (err) {
        if (err instanceof Error && err.message.includes("409")) {
          await refreshProfiles();
        }
        throw err;
      }
    },
    [activeProfile, refreshProfiles]
  );

  const deleteProfile = useCallback(
    async (id: number) => {
      await api.profiles.delete(id);
      const refreshedProfiles = await refreshProfiles();

      if (selectedProfileId === id) {
        const nextActiveProfile =
          refreshedProfiles.find((profile) => profile.is_active) ?? null;
        if (nextActiveProfile) {
          setSelectedProfileId(nextActiveProfile.id);
          setApiProfileId(nextActiveProfile.id);
          localStorage.setItem(STORAGE_KEY, String(nextActiveProfile.id));
          bumpRevision();
        } else {
          setSelectedProfileId(null);
          setApiProfileId(null);
          localStorage.removeItem(STORAGE_KEY);
          bumpRevision();
        }
      }
    },
    [bumpRevision, refreshProfiles, selectedProfileId]
  );

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        selectedProfile,
        selectedProfileId,
        isLoading,
        error,
        revision,
        selectProfile,
        refreshProfiles,
        createProfile,
        updateProfile,
        activateProfile,
        deleteProfile,
        bumpRevision,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProfileContext() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfileContext must be used within a ProfileProvider");
  }
  return context;
}
