import { useState } from "react";
import { Trash2, Shield, Users, Link as LinkIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTripContext } from "@/shared/context/useTripContext";
import {
  useCollaborators,
  useShareLinks,
} from "@/shared/hooks/queries";
import {
  useUpdateCollaboratorRole,
  useRemoveCollaborator,
  useRevokeShareLink,
} from "@/shared/hooks/mutations";
import { tripsApi } from "@/shared/api/client";
import { toast } from "sonner";

export function AccessManagementSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { trip } = useTripContext();
  const tripId = trip._id;

  const { data: collaborators, isLoading: loadingCollabs } = useCollaborators(tripId);
  const { data: shareLinks, isLoading: loadingLinks } = useShareLinks(tripId);

  const updateRole = useUpdateCollaboratorRole(tripId);
  const removeCollab = useRemoveCollaborator(tripId);
  const revokeLink = useRevokeShareLink(tripId);

  const [isLoadingShareLink, setIsLoadingShareLink] = useState(false);
  const [activeTab, setActiveTab] = useState("links");

  async function handleCreateLink(role: "viewer" | "editor") {
    setIsLoadingShareLink(true);
    try {
      const { url } = await tripsApi.createShareLink(tripId, role);
      await navigator.clipboard.writeText(url);
      toast.success(`${role === "editor" ? "Editor" : "View-only"} link copied to clipboard`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create share link");
    } finally {
      setIsLoadingShareLink(false);
    }
  }

  function handleRevoke(linkId: string) {
    if (confirm("Are you sure you want to revoke this link?")) {
      revokeLink.mutate(linkId, {
        onSuccess: () => toast.success("Link revoked"),
      });
    }
  }

  function handleRemoveCollab(userId: string) {
    if (confirm("Remove this collaborator? They will lose access immediately.")) {
      removeCollab.mutate(userId, {
        onSuccess: () => toast.success("Collaborator removed"),
      });
    }
  }

  function handleChangeRole(userId: string, newRole: "editor" | "viewer") {
    updateRole.mutate({ userId, role: newRole }, {
      onSuccess: () => toast.success(`Role updated to ${newRole}`),
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-elev-1 border-t border-border"
      >
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="text-xl tracking-tight">Sharing & Access</SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="links">Share Links</TabsTrigger>
            <TabsTrigger value="collabs">Collaborators</TabsTrigger>
          </TabsList>

          <TabsContent value="links" className="space-y-6 outline-none">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleCreateLink("viewer")}
                  disabled={isLoadingShareLink}
                  className="flex flex-col items-center py-6 h-auto"
                >
                  <LinkIcon className="h-5 w-5 mb-2 text-muted-foreground" />
                  <span>Create Viewer Link</span>
                  <span className="text-xs text-muted-foreground font-normal">Read-only</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCreateLink("editor")}
                  disabled={isLoadingShareLink}
                  className="flex flex-col items-center py-6 h-auto border-primary/20 hover:bg-primary/5"
                >
                  <Shield className="h-5 w-5 mb-2 text-primary" />
                  <span className="text-primary">Create Editor Link</span>
                  <span className="text-xs text-primary/70 font-normal">Can modify</span>
                </Button>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Active Links</h3>
                {loadingLinks ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : !shareLinks || shareLinks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active links.</p>
                ) : (
                  <div className="space-y-3">
                    {shareLinks.map((link) => (
                      <div
                        key={link.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          link.revokedAt ? "bg-elev-2/50 border-border/50 opacity-60" : "bg-elev-2 border-border"
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                link.role === "editor"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {link.role.toUpperCase()}
                            </span>
                            {link.revokedAt && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-destructive/10 text-destructive">
                                REVOKED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            Created: {new Date(link.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {!link.revokedAt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRevoke(link.id)}
                            disabled={revokeLink.isPending}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="collabs" className="space-y-4 outline-none pt-2">
            {loadingCollabs ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : !collaborators || collaborators.length === 0 ? (
              <div className="text-center py-8 bg-elev-2 rounded-xl border border-border">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No collaborators yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                  Create an editor link from the Share Links tab to invite people.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {collaborators.map((c) => (
                  <div key={c.userId} className="flex items-center justify-between p-3 rounded-lg border border-border bg-elev-2">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-sm font-medium truncate">{c.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Joined {new Date(c.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select
                        className="text-xs bg-transparent border border-border rounded-md px-2 py-1 outline-none focus:border-primary cursor-pointer"
                        value={c.role}
                        onChange={(e) => handleChangeRole(c.userId, e.target.value as any)}
                        disabled={updateRole.isPending}
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => handleRemoveCollab(c.userId)}
                        disabled={removeCollab.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
