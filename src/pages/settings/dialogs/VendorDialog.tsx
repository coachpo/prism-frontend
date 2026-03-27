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
import { useLocale } from "@/i18n/useLocale";
import type { Vendor } from "@/lib/types";
import type { VendorFormState } from "../vendorManagementFormState";

interface VendorDialogProps {
  editingVendor: Vendor | null;
  onClose: () => void;
  onSave: () => Promise<void>;
  open: boolean;
  setVendorForm: (updater: VendorFormState | ((current: VendorFormState) => VendorFormState)) => void;
  vendorForm: VendorFormState;
  vendorSaving: boolean;
}

export function VendorDialog({
  editingVendor,
  onClose,
  onSave,
  open,
  setVendorForm,
  vendorForm,
  vendorSaving,
}: VendorDialogProps) {
  const { messages } = useLocale();
  const isEditing = editingVendor !== null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? messages.vendorManagement.editVendor : messages.vendorManagement.createVendor}
          </DialogTitle>
          <DialogDescription>{messages.vendorManagement.sectionDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendor-name">{messages.vendorManagement.nameLabel}</Label>
            <Input
              id="vendor-name"
              value={vendorForm.name}
              onChange={(event) =>
                setVendorForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder={messages.vendorManagement.namePlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor-key">{messages.vendorManagement.keyLabel}</Label>
            <Input
              id="vendor-key"
              value={vendorForm.key}
              onChange={(event) =>
                setVendorForm((current) => ({ ...current, key: event.target.value }))
              }
              placeholder={messages.vendorManagement.keyPlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor-description">{messages.vendorManagement.descriptionLabel}</Label>
            <Input
              id="vendor-description"
              value={vendorForm.description}
              onChange={(event) =>
                setVendorForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder={messages.vendorManagement.descriptionPlaceholder}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {messages.vendorManagement.cancel}
          </Button>
          <Button onClick={() => void onSave()} disabled={vendorSaving}>
            {vendorSaving
              ? messages.vendorManagement.saving
              : isEditing
                ? messages.vendorManagement.saveEdit
                : messages.vendorManagement.saveCreate}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
