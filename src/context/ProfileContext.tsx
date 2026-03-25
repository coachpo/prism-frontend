import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, setApiProfileId } from "@/lib/api";
import { useLocale } from "@/i18n/useLocale";
import type { Profile, ProfileCreate, ProfileUpdate } from "@/lib/types";
import { createProfileBootstrapLoader } from "./profile/bootstrap";
import { parseStoredProfileId, PROFILE_STORAGE_KEY, writeStoredProfileId } from "./profile/persistence";
import { resolveSelectedProfile } from "./profile/selection";

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

const loadProfileBootstrapState = createProfileBootstrapLoader({
  getActiveProfile: () => api.profiles.getActive(),
  listProfiles: () => api.profiles.list(),
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { messages } = useLocale();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const selectedProfileIdRef = useRef<number | null>(null);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId]
  );

  const bumpRevision = useCallback(() => {
    setRevision((previous) => previous + 1);
  }, []);

  const commitSelectedProfileId = useCallback(
    (profileId: number | null, options?: { bumpRevision?: boolean }) => {
      selectedProfileIdRef.current = profileId;
      setSelectedProfileId(profileId);
      setApiProfileId(profileId);
      writeStoredProfileId(profileId);
      if (options?.bumpRevision) {
        bumpRevision();
      }
    },
    [bumpRevision]
  );

  const syncSelectedProfile = useCallback(
    (
      snapshotProfiles: Profile[],
      activeProfileId: number | null,
      options?: {
        preferredProfileId?: number | null;
        bumpRevisionOnChange?: boolean;
      }
    ): number | null => {
      const candidate =
        options?.preferredProfileId === undefined
          ? selectedProfileIdRef.current
          : options.preferredProfileId;
      const nextSelected = resolveSelectedProfile(
        snapshotProfiles,
        candidate,
        activeProfileId
      );
      const nextSelectedId = nextSelected?.id ?? null;

      commitSelectedProfileId(nextSelectedId, {
        bumpRevision:
          Boolean(options?.bumpRevisionOnChange) &&
          nextSelectedId !== selectedProfileIdRef.current,
      });

      return nextSelectedId;
    },
    [commitSelectedProfileId]
  );

  const selectProfile = useCallback(
    (profileId: number) => {
      commitSelectedProfileId(profileId, { bumpRevision: true });
    },
    [commitSelectedProfileId]
  );

  const refreshProfiles = useCallback(async () => {
    const data = await api.profiles.list();
    setProfiles(data);
    const nextActiveProfile = data.find((profile) => profile.is_active) ?? null;
    setActiveProfile(nextActiveProfile);
    syncSelectedProfile(data, nextActiveProfile?.id ?? null, {
      bumpRevisionOnChange: true,
    });
    return data;
  }, [syncSelectedProfile]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { profiles: fetchedProfiles, activeProfile: fetchedActiveProfile } =
          await loadProfileBootstrapState(true);
        if (!mounted) return;

        setProfiles(fetchedProfiles);
        setActiveProfile(fetchedActiveProfile);

        const persistedId = parseStoredProfileId(
          localStorage.getItem(PROFILE_STORAGE_KEY)
        );
        syncSelectedProfile(
          fetchedProfiles,
          fetchedActiveProfile?.id ?? null,
          { preferredProfileId: persistedId }
        );
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
  }, [syncSelectedProfile]);

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

      if (selectedProfileId === id) {
        const remainingProfiles = profiles.filter((profile) => profile.id !== id);
        const remainingActiveProfileId =
          activeProfile?.id === id ? null : activeProfile?.id ?? null;
        syncSelectedProfile(remainingProfiles, remainingActiveProfileId, {
          bumpRevisionOnChange: true,
        });
      }

      await refreshProfiles();
    },
    [
      activeProfile?.id,
      profiles,
      refreshProfiles,
      selectedProfileId,
      syncSelectedProfile,
    ]
  );

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium">{messages.profiles.loadingProfiles}</p>
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
