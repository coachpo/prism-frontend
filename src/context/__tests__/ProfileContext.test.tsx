import { StrictMode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileProvider, useProfileContext } from "../ProfileContext";

const api = vi.hoisted(() => ({
  profiles: {
    getActive: vi.fn(),
    list: vi.fn(),
  },
}));

const setApiProfileId = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({ api, setApiProfileId }));

const storageState = new Map<string, string>();
const localStorageMock = {
  clear: vi.fn(() => {
    storageState.clear();
  }),
  getItem: vi.fn((key: string) => storageState.get(key) ?? null),
  removeItem: vi.fn((key: string) => {
    storageState.delete(key);
  }),
  setItem: vi.fn((key: string, value: string) => {
    storageState.set(key, value);
  }),
};

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: localStorageMock,
});

function ProfileProbe() {
  const { activeProfile, selectedProfile, selectProfile } = useProfileContext();

  return (
    <div>
      <div>{selectedProfile?.name ?? "missing"}/{activeProfile?.name ?? "missing"}</div>
      <button type="button" onClick={() => selectProfile(2)}>
        Select secondary
      </button>
    </div>
  );
}

describe("ProfileProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageState.clear();
    localStorage.clear();

    const profile = {
      id: 1,
      name: "Default",
      description: null,
      is_active: true,
      is_default: true,
      is_editable: true,
      version: 1,
      created_at: "",
      deleted_at: null,
      updated_at: "",
    };

    api.profiles.list.mockResolvedValue([profile]);
    api.profiles.getActive.mockResolvedValue(profile);
  });

  afterEach(() => {
    cleanup();
  });

  it("deduplicates StrictMode bootstrap profile fetches", async () => {
    render(
      <StrictMode>
        <ProfileProvider>
          <ProfileProbe />
        </ProfileProvider>
      </StrictMode>,
    );

    await waitFor(() => {
      expect(screen.getByText("Default/Default")).toBeInTheDocument();
    });

    expect(api.profiles.list).toHaveBeenCalledTimes(1);
    expect(api.profiles.getActive).toHaveBeenCalledTimes(1);
    expect(setApiProfileId).toHaveBeenCalledWith(1);
  });

  it("does not rerun bootstrap fetches when only the selected profile changes", async () => {
    const profiles = [
      {
        id: 1,
        name: "Default",
        description: null,
        is_active: true,
        is_default: true,
        is_editable: true,
        version: 1,
        created_at: "",
        deleted_at: null,
        updated_at: "",
      },
      {
        id: 2,
        name: "Secondary",
        description: null,
        is_active: false,
        is_default: false,
        is_editable: true,
        version: 1,
        created_at: "",
        deleted_at: null,
        updated_at: "",
      },
    ];

    api.profiles.list.mockResolvedValue(profiles);
    api.profiles.getActive.mockResolvedValue(profiles[0]);

    render(
      <StrictMode>
        <ProfileProvider>
          <ProfileProbe />
        </ProfileProvider>
      </StrictMode>,
    );

    await waitFor(() => {
      expect(screen.getByText("Default/Default")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Select secondary" }));

    await waitFor(() => {
      expect(screen.getByText("Secondary/Default")).toBeInTheDocument();
    });

    expect(api.profiles.list).toHaveBeenCalledTimes(1);
    expect(api.profiles.getActive).toHaveBeenCalledTimes(1);
  });

  it("fetches fresh profile snapshots after provider remounts", async () => {
    const firstProfile = {
      id: 1,
      name: "Default",
      description: null,
      is_active: true,
      is_default: true,
      is_editable: true,
      version: 1,
      created_at: "",
      deleted_at: null,
      updated_at: "",
    };
    const secondProfile = {
      id: 2,
      name: "Second login",
      description: null,
      is_active: true,
      is_default: true,
      is_editable: true,
      version: 1,
      created_at: "",
      deleted_at: null,
      updated_at: "",
    };

    api.profiles.list.mockResolvedValueOnce([firstProfile]).mockResolvedValueOnce([secondProfile]);
    api.profiles.getActive.mockResolvedValueOnce(firstProfile).mockResolvedValueOnce(secondProfile);

    const firstRender = render(
      <ProfileProvider>
        <ProfileProbe />
      </ProfileProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Default/Default")).toBeInTheDocument();
    });

    firstRender.unmount();

    render(
      <ProfileProvider>
        <ProfileProbe />
      </ProfileProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Second login/Second login")).toBeInTheDocument();
    });

    expect(api.profiles.list).toHaveBeenCalledTimes(2);
    expect(api.profiles.getActive).toHaveBeenCalledTimes(2);
  });
});
