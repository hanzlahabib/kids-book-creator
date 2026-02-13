"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
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
  Save, Trash2, AlertTriangle, ExternalLink, Key, Plus, 
  CreditCard, Coins, Crown, LogOut, Loader2, Check, X,
  ToggleLeft, ToggleRight
} from "lucide-react";

interface ApiKey {
  id: string;
  provider: string;
  keyLast4: string;
  name: string;
  isValid: boolean;
  lastUsed: string | null;
  usageCount: number;
  maskedKey: string;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  credits: number;
  features: string[];
  limits: Record<string, unknown>;
}

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI (DALL-E 3)' },
  { value: 'replicate', label: 'Replicate (SDXL)' },
  { value: 'stability', label: 'Stability AI' },
  { value: 'fal', label: 'Fal.ai (Flux)' },
];

function SettingsPageContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  
  // Settings state
  const [defaultTrimSize, setDefaultTrimSize] = useState("8.5x11");
  const [defaultAuthor, setDefaultAuthor] = useState("Activity Books");
  const [preferByok, setPreferByok] = useState(false);
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [showAddKeyDialog, setShowAddKeyDialog] = useState(false);
  const [newKeyProvider, setNewKeyProvider] = useState("openai");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [isAddingKey, setIsAddingKey] = useState(false);
  
  // Subscription state
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [credits, setCredits] = useState(0);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  
  // Dialog state
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  // Handle checkout result
  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') {
      toast.success('Subscription activated! Welcome to the plan.');
      // Refresh subscription data
      fetchSubscription();
    } else if (checkout === 'canceled') {
      toast.info('Checkout canceled');
    }
  }, [searchParams]);
  
  // Load initial data
  useEffect(() => {
    loadSettings();
    if (session?.user) {
      fetchApiKeys();
      fetchSubscription();
      fetchPlans();
    }
  }, [session]);
  
  const loadSettings = () => {
    const saved = localStorage.getItem("kbc-settings");
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setDefaultTrimSize(settings.defaultTrimSize || "8.5x11");
        setDefaultAuthor(settings.defaultAuthor || "Activity Books");
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    }
  };
  
  const fetchApiKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const res = await fetch('/api/keys');
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys || []);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setIsLoadingKeys(false);
    }
  };
  
  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/subscription');
      if (res.ok) {
        const data = await res.json();
        setCurrentPlan(data.plan);
        setCredits(data.credits || 0);
        setCreditsUsed(data.creditsUsed || 0);
        setPreferByok(data.preferByok || false);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };
  
  const fetchPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const res = await fetch('/api/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setIsLoadingPlans(false);
    }
  };
  
  const handleSave = async () => {
    localStorage.setItem("kbc-settings", JSON.stringify({
      defaultTrimSize,
      defaultAuthor,
    }));
    
    // Update BYOK preference
    if (session?.user) {
      await fetch('/api/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferByok }),
      });
    }
    
    toast.success("Settings saved!");
  };
  
  const handleAddKey = async () => {
    if (!newKeyValue.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    
    setIsAddingKey(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: newKeyProvider,
          key: newKeyValue,
          name: newKeyName || undefined,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || 'Failed to add key');
        return;
      }
      
      toast.success('API key added successfully!');
      setApiKeys([data.key, ...apiKeys]);
      setShowAddKeyDialog(false);
      setNewKeyValue("");
      setNewKeyName("");
    } catch (error) {
      toast.error('Failed to add key');
    } finally {
      setIsAddingKey(false);
    }
  };
  
  const handleDeleteKey = async (keyId: string) => {
    try {
      const res = await fetch(`/api/keys/${keyId}`, { method: 'DELETE' });
      if (res.ok) {
        setApiKeys(apiKeys.filter(k => k.id !== keyId));
        toast.success('API key deleted');
      }
    } catch (error) {
      toast.error('Failed to delete key');
    }
  };
  
  const handleTestKey = async (keyId: string) => {
    try {
      const res = await fetch(`/api/keys/${keyId}`, { method: 'POST' });
      const data = await res.json();
      
      if (data.isValid) {
        toast.success('API key is valid!');
      } else {
        toast.error('API key is invalid');
      }
      
      // Update key in list
      setApiKeys(apiKeys.map(k => 
        k.id === keyId ? { ...k, isValid: data.isValid } : k
      ));
    } catch (error) {
      toast.error('Failed to test key');
    }
  };
  
  const handleUpgrade = async (planSlug: string) => {
    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || 'Failed to start checkout');
        return;
      }
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error('Failed to start checkout');
    }
  };
  
  const handleManageBilling = async () => {
    try {
      const res = await fetch('/api/subscription/portal', { method: 'POST' });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error('Failed to open billing portal');
    }
  };
  
  const handleClearData = async () => {
    setIsClearing(true);
    try {
      const booksResponse = await fetch("/api/books");
      const booksData = await booksResponse.json();
      
      for (const book of booksData.books || []) {
        await fetch(`/api/books/${book.id}`, { method: "DELETE" });
      }
      
      localStorage.removeItem("kbc-settings");
      toast.success("All data cleared successfully");
      setShowClearDialog(false);
      setDefaultTrimSize("8.5x11");
      setDefaultAuthor("Activity Books");
    } catch (error) {
      toast.error("Failed to clear data");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your app preferences and manage your account
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Section */}
        {session?.user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Account & Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{session.user.name || session.user.email}</p>
                  <p className="text-sm text-muted-foreground">{session.user.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
              
              {/* Current Plan */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">Current Plan: {currentPlan?.name || 'Free'}</p>
                    <p className="text-sm text-muted-foreground">
                      {credits} credits remaining this month
                    </p>
                  </div>
                  {currentPlan && currentPlan.slug !== 'free' && (
                    <Button variant="outline" size="sm" onClick={handleManageBilling}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage Billing
                    </Button>
                  )}
                </div>
                
                {/* Credit progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Credits used</span>
                    <span>{creditsUsed} / {currentPlan?.credits || 10}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ 
                        width: `${Math.min(100, (creditsUsed / (currentPlan?.credits || 10)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Upgrade options */}
              {(!currentPlan || currentPlan.slug === 'free') && (
                <div className="grid gap-4 md:grid-cols-3">
                  {plans.filter(p => p.slug !== 'free').map(plan => (
                    <div key={plan.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium">{plan.name}</h4>
                      <p className="text-2xl font-bold">${plan.price / 100}<span className="text-sm font-normal">/mo</span></p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {plan.credits === 99999 ? 'Unlimited' : plan.credits} images/month
                      </p>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleUpgrade(plan.slug)}
                      >
                        Upgrade
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Generation Mode */}
        {session?.user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                Generation Mode
              </CardTitle>
              <CardDescription>
                Choose how to generate images
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">
                    {preferByok ? "Using Your API Keys (BYOK)" : "Using Credits"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {preferByok 
                      ? "Images generated using your own API keys - pay provider directly"
                      : "Images generated using your subscription credits"
                    }
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPreferByok(!preferByok)}
                  disabled={!apiKeys.length && !preferByok}
                >
                  {preferByok ? (
                    <ToggleRight className="w-6 h-6 text-primary" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </Button>
              </div>
              {!apiKeys.length && (
                <p className="text-sm text-muted-foreground mt-2">
                  Add an API key below to enable BYOK mode
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* API Keys Section */}
        {session?.user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Keys (BYOK)
              </CardTitle>
              <CardDescription>
                Add your own API keys to use your provider accounts directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setShowAddKeyDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add API Key
              </Button>
              
              {isLoadingKeys ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : apiKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No API keys added yet. Add your first key to enable BYOK mode.
                </p>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map(key => (
                    <div 
                      key={key.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${key.isValid ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="font-medium">
                            {PROVIDERS.find(p => p.value === key.provider)?.label || key.provider}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {key.maskedKey}
                            {key.name && ` · ${key.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleTestKey(key.id)}
                        >
                          Test
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteKey(key.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Export Defaults */}
        <Card>
          <CardHeader>
            <CardTitle>Export Defaults</CardTitle>
            <CardDescription>
              Default settings for PDF export
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Trim Size</label>
              <Select value={defaultTrimSize} onValueChange={setDefaultTrimSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8.5x11">8.5&quot; x 11&quot; (Letter)</SelectItem>
                  <SelectItem value="8x10">8&quot; x 10&quot;</SelectItem>
                  <SelectItem value="6x9">6&quot; x 9&quot;</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Default Author Name</label>
              <Input
                value={defaultAuthor}
                onChange={(e) => setDefaultAuthor(e.target.value)}
                placeholder="Your name or pen name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that affect your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg">
              <div>
                <p className="font-medium">Clear All Data</p>
                <p className="text-sm text-muted-foreground">
                  Delete all books, pages, and reset settings
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowClearDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full" size="lg">
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>

      {/* Add Key Dialog */}
      <Dialog open={showAddKeyDialog} onOpenChange={setShowAddKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add API Key</DialogTitle>
            <DialogDescription>
              Add your own API key to use this provider directly
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <Select value={newKeyProvider} onValueChange={setNewKeyProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <Input
                type="password"
                placeholder="sk-..."
                value={newKeyValue}
                onChange={(e) => setNewKeyValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name (optional)</label>
              <Input
                placeholder="My OpenAI Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddKey} disabled={isAddingKey}>
              {isAddingKey && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Clear All Data
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all your books, pages, and reset settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
              disabled={isClearing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearData}
              disabled={isClearing}
            >
              {isClearing ? "Clearing..." : "Yes, Clear Everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsLoading() {
  return (
    <div className="p-8 max-w-4xl space-y-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsPageContent />
    </Suspense>
  );
}
