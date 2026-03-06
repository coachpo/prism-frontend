import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileDialogsProps {
  activateOpen: boolean;
  setActivateOpen: (open: boolean) => void;
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  deleteOpen: boolean;
  setDeleteOpen: (open: boolean) => void;
  selectedProfileName: string;
  activeProfileName: string;
  hasMismatch: boolean;
  isActivating: boolean;
  onActivate: () => void;
  nameInput: string;
  setNameInput: (value: string) => void;
  descriptionInput: string;
  setDescriptionInput: (value: string) => void;
  isSaving: boolean;
  canCreateProfile: boolean;
  hasSelectedProfile: boolean;
  onCreate: () => void;
  onEdit: () => void;
  deleteError: string | null;
  deleteConfirmTarget: string;
  deleteConfirmInput: string;
  setDeleteConfirmInput: (value: string) => void;
  isDeleteConfirmMatch: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  clearDeleteError: () => void;
}

export function ProfileDialogs({
  activateOpen,
  setActivateOpen,
  createOpen,
  setCreateOpen,
  editOpen,
  setEditOpen,
  deleteOpen,
  setDeleteOpen,
  selectedProfileName,
  activeProfileName,
  hasMismatch,
  isActivating,
  onActivate,
  nameInput,
  setNameInput,
  descriptionInput,
  setDescriptionInput,
  isSaving,
  canCreateProfile,
  hasSelectedProfile,
  onCreate,
  onEdit,
  deleteError,
  deleteConfirmTarget,
  deleteConfirmInput,
  setDeleteConfirmInput,
  isDeleteConfirmMatch,
  isDeleting,
  onDelete,
  clearDeleteError,
}: ProfileDialogsProps) {
  return (
    <>
      <Dialog open={activateOpen} onOpenChange={setActivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate &quot;{selectedProfileName}&quot; for runtime traffic?</DialogTitle>
            <DialogDescription>
              This will switch the active runtime profile. Existing traffic will route using the newly
              active profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <p>
              Current active: <strong>{activeProfileName}</strong>
            </p>
            <p>
              New active: <strong>{selectedProfileName}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onActivate} disabled={isActivating || !hasMismatch}>
              {isActivating ? "Activating..." : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Profile</DialogTitle>
            <DialogDescription>
              Create a new management scope profile. Runtime traffic is unaffected until activation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="profile-create-name">Name</Label>
              <Input
                id="profile-create-name"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="Profile name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-create-description">Description (Optional)</Label>
              <Input
                id="profile-create-description"
                value={descriptionInput}
                onChange={(event) => setDescriptionInput(event.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onCreate} disabled={isSaving || !canCreateProfile}>
              {isSaving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update selected profile metadata. This does not activate runtime traffic.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="profile-edit-name">Name</Label>
              <Input
                id="profile-edit-name"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="Profile name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-edit-description">Description (Optional)</Label>
              <Input
                id="profile-edit-description"
                value={descriptionInput}
                onChange={(event) => setDescriptionInput(event.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onEdit} disabled={isSaving || !hasSelectedProfile}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Profile</DialogTitle>
            <DialogDescription>
              Delete selected profile <strong>{selectedProfileName}</strong>. This action is
              irreversible.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {deleteError}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="profile-delete-confirm">
              Type <code>{deleteConfirmTarget}</code> to confirm
            </Label>
            <Input
              id="profile-delete-confirm"
              value={deleteConfirmInput}
              onChange={(event) => {
                setDeleteConfirmInput(event.target.value);
                if (deleteError) clearDeleteError();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={isDeleting || !hasSelectedProfile || !isDeleteConfirmMatch}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
