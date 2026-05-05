import { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CreatorRegistrationFormProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit: (details: CreatorDetails) => Promise<void>;
  isLoading?: boolean;
  mode?: "dialog" | "inline";
  submitLabel?: string;
}

export interface CreatorDetails {
  username: string;
  bio: string;
  profilePictureUrl?: string;
}

export function CreatorRegistrationForm({
  isOpen = true,
  onClose,
  onSubmit,
  isLoading = false,
  mode = "dialog",
  submitLabel = "Become a Creator",
}: CreatorRegistrationFormProps) {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!username.trim()) {
      setError("Creator name is required");
      return;
    }

    if (username.trim().length < 2) {
      setError("Creator name must be at least 2 characters");
      return;
    }

    if (username.trim().length > 50) {
      setError("Creator name must be 50 characters or less");
      return;
    }

    if (bio.trim().length > 500) {
      setError("Bio must be 500 characters or less");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        username: username.trim(),
        bio: bio.trim(),
        profilePictureUrl: profilePictureUrl.trim() || undefined,
      });
      // Reset form on success
      setUsername("");
      setBio("");
      setProfilePictureUrl("");
    } catch (err) {
      setError((err as Error).message || "Failed to register as creator");
    } finally {
      setIsSubmitting(false);
    }
  };

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">
          Creator Name *
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g., Luna Designs, Alex Studio"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          disabled={isSubmitting || isLoading}
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          {username.length}/50 characters
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell collectors about your work, style, and vision..."
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          rows={4}
          disabled={isSubmitting || isLoading}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {bio.length}/500 characters
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">
          Profile Picture URL
        </label>
        <input
          type="url"
          value={profilePictureUrl}
          onChange={(e) => setProfilePictureUrl(e.target.value)}
          placeholder="https://example.com/profile.jpg"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          disabled={isSubmitting || isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Leave blank to use default avatar
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        {mode === "dialog" && onClose ? (
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting || isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={isSubmitting || isLoading || !username.trim()}
          className="flex-1"
        >
          {isSubmitting || isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Profile...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );

  if (mode === "inline") {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">Create your creator profile</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill this out once and we&apos;ll activate your creator profile automatically.
          </p>
        </div>
        {form}
      </div>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Create Your Creator Profile</AlertDialogTitle>
          <AlertDialogDescription>
            Tell us about yourself. You can update these details anytime.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {form}
      </AlertDialogContent>
    </AlertDialog>
  );
}
