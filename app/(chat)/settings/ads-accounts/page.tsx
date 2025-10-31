"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/toast";

type Media = {
  id: string;
  displayName: string;
  description: string | null;
};

type AdsAccount = {
  id: string;
  mediaId: string;
  tokenName: string;
  accountId: string | null;
  accountEmail: string | null;
  status: "active" | "expired" | "invalid" | "revoked";
  tokenExpiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function AdsAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AdsAccount[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AdsAccount | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState({
    mediaId: "",
    tokenName: "",
    accessToken: "",
    accountId: "",
    accountEmail: "",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const response = await fetch("/api/ads-accounts");

      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }

      const data = await response.json();
      setAccounts(data.accounts || []);
      setMedia(data.media || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setLoadError(true);
      // Don't show toast on initial load, show error state instead
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      if (!formData.mediaId || !formData.tokenName || !formData.accessToken || !formData.accountId) {
        toast({
          type: "error",
          description: "Please fill in all required fields (Platform, Account Name, Access Token, and Account ID)",
        });
        return;
      }

      const response = await fetch("/api/ads-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create account");
      }

      toast({
        type: "success",
        description: "Ad account added successfully",
      });

      setShowAddDialog(false);
      resetForm();
      fetchAccounts();
    } catch (error) {
      console.error("Error adding account:", error);
      toast({
        type: "error",
        description: error instanceof Error ? error.message : "Failed to add account",
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedAccount) return;

    try {
      const updateData: any = {};
      if (formData.tokenName) updateData.tokenName = formData.tokenName;
      if (formData.accessToken) updateData.accessToken = formData.accessToken;
      if (formData.accountId) updateData.accountId = formData.accountId;
      if (formData.accountEmail) updateData.accountEmail = formData.accountEmail;

      const response = await fetch(`/api/ads-accounts/${selectedAccount.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update account");
      }

      toast({
        type: "success",
        description: "Ad account updated successfully",
      });

      setShowEditDialog(false);
      setSelectedAccount(null);
      resetForm();
      fetchAccounts();
    } catch (error) {
      console.error("Error updating account:", error);
      toast({
        type: "error",
        description: error instanceof Error ? error.message : "Failed to update account",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;

    try {
      const response = await fetch(`/api/ads-accounts/${selectedAccount.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete account");
      }

      toast({
        type: "success",
        description: "Ad account revoked successfully",
      });

      setShowDeleteDialog(false);
      setSelectedAccount(null);
      fetchAccounts();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        type: "error",
        description: error instanceof Error ? error.message : "Failed to delete account",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      mediaId: "",
      tokenName: "",
      accessToken: "",
      accountId: "",
      accountEmail: "",
    });
  };

  const openEditDialog = (account: AdsAccount) => {
    setSelectedAccount(account);
    setFormData({
      mediaId: account.mediaId,
      tokenName: account.tokenName,
      accessToken: "",
      accountId: account.accountId || "",
      accountEmail: account.accountEmail || "",
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (account: AdsAccount) => {
    setSelectedAccount(account);
    setShowDeleteDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 dark:text-green-400";
      case "expired":
        return "text-yellow-600 dark:text-yellow-400";
      case "invalid":
        return "text-red-600 dark:text-red-400";
      case "revoked":
        return "text-gray-600 dark:text-gray-400";
      default:
        return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return "🟢";
      case "expired":
        return "⚠️";
      case "invalid":
        return "🔴";
      case "revoked":
        return "⭕";
      default:
        return "";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      "day"
    );
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 font-semibold text-lg">Setup Required</h3>
            <p className="mb-6 text-center text-muted-foreground text-sm">
              Please complete the database migration first. Check{" "}
              <code className="rounded bg-muted px-1 py-0.5">QUICK_START.md</code> for instructions.
            </p>
            <Button onClick={fetchAccounts} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-3xl">Ads Account Management</h1>
            <p className="text-muted-foreground text-sm">
              Manage your advertising platform account tokens
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>

        {/* Accounts List */}
        {accounts.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <Card className="w-full max-w-md">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="mb-4 text-6xl">🔑</div>
                <h3 className="mb-2 font-semibold text-lg">No ad accounts configured</h3>
                <p className="mb-6 text-center text-muted-foreground text-sm">
                  Add your first account to get started with ad management
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Account
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
        <div className="space-y-4">
          {accounts.map((account) => {
            const accountMedia = media.find((m) => m.id === account.mediaId);
            return (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {account.tokenName}
                        <span className={`text-sm ${getStatusColor(account.status)}`}>
                          {getStatusIcon(account.status)} {account.status}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {accountMedia?.displayName || account.mediaId}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(account)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(account)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 text-sm">
                    {account.accountId && (
                      <div>
                        <span className="text-muted-foreground">Account ID: </span>
                        <code className="rounded bg-muted px-1 py-0.5 text-xs">
                          {account.accountId}
                        </code>
                      </div>
                    )}
                    {account.accountEmail && (
                      <div>
                        <span className="text-muted-foreground">Email: </span>
                        {account.accountEmail}
                      </div>
                    )}
                    {account.lastUsedAt && (
                      <div>
                        <span className="text-muted-foreground">Last used: </span>
                        {formatDate(account.lastUsedAt)}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Created: </span>
                      {new Date(account.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Ad Account</DialogTitle>
            <DialogDescription>
              Add a new advertising platform account token
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="platform">Platform *</Label>
              <Select
                value={formData.mediaId}
                onValueChange={(value) =>
                  setFormData({ ...formData, mediaId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {media.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tokenName">Account Name *</Label>
              <Input
                id="tokenName"
                placeholder="e.g., Main Account"
                value={formData.tokenName}
                onChange={(e) =>
                  setFormData({ ...formData, tokenName: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="accessToken">Access Token *</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Your API token"
                value={formData.accessToken}
                onChange={(e) =>
                  setFormData({ ...formData, accessToken: e.target.value })
                }
              />
              <p className="mt-1 text-muted-foreground text-xs">
                ℹ️ Your token will be encrypted and stored securely
              </p>
            </div>
            <div>
              <Label htmlFor="accountId">Account ID *</Label>
              <Input
                id="accountId"
                placeholder="e.g., 1981942764328771586"
                value={formData.accountId}
                onChange={(e) =>
                  setFormData({ ...formData, accountId: e.target.value })
                }
              />
              <p className="mt-1 text-muted-foreground text-xs">
                ℹ️ Required for budget queries. Find this in your NewsBreak dashboard.
              </p>
            </div>
            <div>
              <Label htmlFor="accountEmail">Account Email (Optional)</Label>
              <Input
                id="accountEmail"
                type="email"
                placeholder="account@example.com"
                value={formData.accountEmail}
                onChange={(e) =>
                  setFormData({ ...formData, accountEmail: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ad Account</DialogTitle>
            <DialogDescription>
              Update your ad account information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-tokenName">Account Name</Label>
              <Input
                id="edit-tokenName"
                value={formData.tokenName}
                onChange={(e) =>
                  setFormData({ ...formData, tokenName: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-accessToken">Access Token (Optional)</Label>
              <Input
                id="edit-accessToken"
                type="password"
                placeholder="Leave empty to keep current token"
                value={formData.accessToken}
                onChange={(e) =>
                  setFormData({ ...formData, accessToken: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-accountId">Account ID *</Label>
              <Input
                id="edit-accountId"
                placeholder="e.g., 1981942764328771586"
                value={formData.accountId}
                onChange={(e) =>
                  setFormData({ ...formData, accountId: e.target.value })
                }
              />
              <p className="mt-1 text-muted-foreground text-xs">
                ℹ️ Required for budget queries
              </p>
            </div>
            <div>
              <Label htmlFor="edit-accountEmail">Account Email (Optional)</Label>
              <Input
                id="edit-accountEmail"
                type="email"
                value={formData.accountEmail}
                onChange={(e) =>
                  setFormData({ ...formData, accountEmail: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Revoke Ad Account?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke "{selectedAccount?.tokenName}"? This
              will immediately disable this token and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

