"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Users, DollarSign, Image, Book, Search, 
  ChevronLeft, ChevronRight, Loader2, Crown, 
  Plus, Minus, Shield
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string | null;
  credits: number;
  creditsUsed: number;
  subscriptionStatus: string | null;
  booksCount: number;
  generationsCount: number;
  apiKeysCount: number;
  createdAt: string;
}

interface Analytics {
  users: {
    total: number;
    newLast30Days: number;
    newLast7Days: number;
    byPlan: { plan: string; count: number }[];
  };
  generations: {
    total: number;
    last30Days: number;
  };
  books: {
    total: number;
  };
  revenue: {
    mrr: number;
    activeSubscriptions: number;
  };
  usage: {
    last7Days: { provider: string; count: number; creditsUsed: number }[];
  };
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit user dialog
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editRole, setEditRole] = useState("");
  const [creditAdjustment, setCreditAdjustment] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    // Redirect non-admins
    if (status === "loading") return;
    if (!session || session.user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    fetchAnalytics();
    fetchUsers();
  }, [session, status, router, currentPage, searchQuery]);
  
  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  };
  
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        search: searchQuery,
      });
      
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalUsers(data.total);
        setTotalPages(data.pages);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setCreditAdjustment(0);
    setShowEditDialog(true);
  };
  
  const handleSaveUser = async () => {
    if (!selectedUser) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editRole !== selectedUser.role ? editRole : undefined,
          creditsAdjustment: creditAdjustment !== 0 ? creditAdjustment : undefined,
        }),
      });
      
      if (res.ok) {
        toast.success("User updated successfully");
        setShowEditDialog(false);
        fetchUsers();
      } else {
        toast.error("Failed to update user");
      }
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Redirect happens in useEffect, but show nothing while redirecting
  if (!session || session.user.role !== "admin") {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage users, view analytics, and monitor the platform
        </p>
      </div>
      
      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.users.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.users.newLast7Days || 0} last 7 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics?.revenue.mrr?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.revenue.activeSubscriptions || 0} active subscriptions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Generations</CardTitle>
            <Image className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.generations.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.generations.last30Days || 0} last 30 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <Book className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.books.total || 0}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Users by Plan */}
      {analytics?.users.byPlan && analytics.users.byPlan.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Users by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              {analytics.users.byPlan.map((item) => (
                <div 
                  key={item.plan} 
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg"
                >
                  <Crown className="w-4 h-4" />
                  <span className="font-medium">{item.plan}:</span>
                  <span>{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user accounts and subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Plan</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Credits</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Stats</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{user.name || "—"}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-muted rounded text-sm">
                            {user.plan || "Free"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">{user.credits}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-muted-foreground">
                            {user.booksCount} books · {user.generationsCount} images
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            user.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {users.length} of {totalUsers} users
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="px-3 py-2 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Adjust Credits</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCreditAdjustment(c => c - 10)}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={creditAdjustment}
                  onChange={(e) => setCreditAdjustment(parseInt(e.target.value) || 0)}
                  className="text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCreditAdjustment(c => c + 10)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Current: {selectedUser?.credits} → New: {(selectedUser?.credits || 0) + creditAdjustment}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
