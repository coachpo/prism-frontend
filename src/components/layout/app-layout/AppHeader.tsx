import { AlertTriangle, Loader2, LogOut, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileSwitcherPopover } from "./ProfileSwitcherPopover";

type Props = {
  activeProfileName: string;
  canCreateProfile: boolean;
  deleteDisabledReason: string | null;
  editDisabledReason: string | null;
  filteredProfiles: Array<{
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    is_default: boolean;
    is_editable: boolean;
    version: number;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
  }>;
  handleLogout: () => Promise<void>;
  handleManageProfiles: () => void;
  handleSelectProfile: (profileId: number) => void;
  hasMismatch: boolean;
  hasNoMatches: boolean;
  hasNoProfiles: boolean;
  isActivating: boolean;
  isProfileScopedPage: boolean;
  openActivateDialog: () => void;
  openCreateDialog: () => void;
  openDeleteDialog: () => void;
  openEditDialog: () => void;
  profileQuery: string;
  profileSearchInputRef: React.RefObject<HTMLInputElement | null>;
  profileSwitcherOpen: boolean;
  selectedIsActive: boolean;
  selectedProfileButtonRef: React.RefObject<HTMLButtonElement | null>;
  selectedProfileId: number | null;
  selectedProfileName: string;
  setProfileQuery: (value: string) => void;
  setProfileSwitcherOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  username: string | null;
  authEnabled: boolean;
};

export function AppHeader({
  activeProfileName,
  authEnabled,
  canCreateProfile,
  deleteDisabledReason,
  editDisabledReason,
  filteredProfiles,
  handleLogout,
  handleManageProfiles,
  handleSelectProfile,
  hasMismatch,
  hasNoMatches,
  hasNoProfiles,
  isActivating,
  isProfileScopedPage,
  openActivateDialog,
  openCreateDialog,
  openDeleteDialog,
  openEditDialog,
  profileQuery,
  profileSearchInputRef,
  profileSwitcherOpen,
  selectedIsActive,
  selectedProfileButtonRef,
  selectedProfileId,
  selectedProfileName,
  setProfileQuery,
  setProfileSwitcherOpen,
  setSidebarOpen,
  username,
}: Props) {
  return (
    <header className="shell-header sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </button>
          {isProfileScopedPage && hasMismatch ? (
            <Badge
              variant="secondary"
              className="hidden h-6 max-w-[220px] items-center px-2 text-[11px] font-normal text-muted-foreground sm:inline-flex"
              title={`Active runtime: ${activeProfileName}`}
            >
              <span className="truncate">Active runtime: {activeProfileName}</span>
            </Badge>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {hasMismatch ? (
            <div className="max-w-[300px] rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-800 dark:text-amber-200">
              <p className="inline-flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  You&apos;re viewing <strong>{selectedProfileName}</strong>, but runtime traffic is
                  served by <strong>{activeProfileName}</strong>.
                </span>
              </p>
            </div>
          ) : null}

          <ProfileSwitcherPopover
            open={profileSwitcherOpen}
            onOpenChange={setProfileSwitcherOpen}
            isActivating={isActivating}
            selectedProfileName={selectedProfileName}
            activeProfileName={activeProfileName}
            hasNoProfiles={hasNoProfiles}
            selectedIsActive={selectedIsActive}
            profileQuery={profileQuery}
            setProfileQuery={setProfileQuery}
            selectedProfileId={selectedProfileId}
            filteredProfiles={filteredProfiles}
            hasNoMatches={hasNoMatches}
            canCreateProfile={canCreateProfile}
            editDisabledReason={editDisabledReason}
            deleteDisabledReason={deleteDisabledReason}
            selectedProfileButtonRef={selectedProfileButtonRef}
            profileSearchInputRef={profileSearchInputRef}
            onSelectProfile={handleSelectProfile}
            onOpenEditDialog={openEditDialog}
            onOpenDeleteDialog={openDeleteDialog}
            onOpenCreateDialog={openCreateDialog}
            onManageProfiles={handleManageProfiles}
          />

          {hasMismatch ? (
            <Button className="h-9 px-3" onClick={openActivateDialog} disabled={isActivating}>
              {isActivating ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <span className="sm:hidden">Activate</span>
                  <span className="hidden sm:inline">Activate profile</span>
                </>
              )}
            </Button>
          ) : null}
          {authEnabled ? (
            <Button variant="outline" className="h-9 px-3" onClick={() => void handleLogout()}>
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span className="hidden sm:inline">{username || "Sign out"}</span>
              <span className="sm:hidden">Out</span>
            </Button>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
