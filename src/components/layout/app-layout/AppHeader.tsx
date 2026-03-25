import { AlertTriangle, Loader2, LogOut, Menu } from "lucide-react";
import { GlobalPreferencesControls } from "@/components/GlobalPreferencesControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/useLocale";
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
  const { messages } = useLocale();

  return (
    <header className="shell-header sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">{messages.shell.openSidebar}</span>
          </button>
          {isProfileScopedPage && hasMismatch ? (
            <Badge
              variant="secondary"
              className="hidden h-6 max-w-[220px] items-center px-2 text-[11px] font-normal text-muted-foreground sm:inline-flex"
              title={messages.shell.activeRuntime(activeProfileName)}
            >
              <span className="truncate">{messages.shell.activeRuntime(activeProfileName)}</span>
            </Badge>
          ) : null}
        </div>

        <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {hasMismatch ? (
            <div className="max-w-[300px] rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-800 dark:text-amber-200">
              <p className="inline-flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {messages.shell.mismatchWarning(selectedProfileName, activeProfileName)}
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
                  {messages.shell.activating}
                </>
              ) : (
                <>
                  <span className="sm:hidden">{messages.shell.activate}</span>
                  <span className="hidden sm:inline">{messages.shell.activateProfile}</span>
                </>
              )}
            </Button>
          ) : null}
          {authEnabled ? (
            <Button variant="outline" className="h-9 px-3" onClick={() => void handleLogout()}>
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span className="hidden sm:inline">{username || messages.shell.signOut}</span>
              <span className="sm:hidden">{messages.shell.out}</span>
            </Button>
          ) : null}
          <GlobalPreferencesControls />
        </div>
      </div>
    </header>
  );
}
