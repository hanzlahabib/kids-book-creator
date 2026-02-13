"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, RefreshCw, Check, X, Plus, History, Download, Coins, Key, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

const themes = [
  { value: "animals", label: "🦁 Animals" },
  { value: "alphabet", label: "🔤 Alphabet" },
  { value: "numbers", label: "🔢 Numbers" },
  { value: "dinosaurs", label: "🦕 Dinosaurs" },
  { value: "unicorns", label: "🦄 Unicorns" },
  { value: "vehicles", label: "🚗 Vehicles" },
  { value: "ocean", label: "🐠 Ocean Life" },
  { value: "nature", label: "🌸 Nature" },
  { value: "islamic", label: "🌙 Islamic" },
  { value: "space", label: "🚀 Space" },
  { value: "food", label: "🍕 Food" },
];

const ageGroups = [
  { value: "2-4", label: "Ages 2-4 (Simple)" },
  { value: "4-6", label: "Ages 4-6 (Medium)" },
  { value: "6-8", label: "Ages 6-8 (Detailed)" },
  { value: "8+", label: "Ages 8+ (Complex)" },
];

const providers = [
  { value: "openai", label: "OpenAI (DALL-E 3)", cost: 0.04 },
  { value: "replicate", label: "Replicate (SDXL)", cost: 0.01 },
  { value: "stability", label: "Stability AI", cost: 0.02 },
  { value: "fal", label: "Fal.ai (Flux)", cost: 0.015 },
];

interface GeneratedImage {
  id: string;
  imagePath: string;
  prompt: string;
  selected: boolean;
}

interface HistoryItem {
  id: string;
  imagePath: string;
  prompt: string;
  theme: string;
  createdAt: string;
}

interface ApiKey {
  provider: string;
  isValid: boolean;
}

export default function GeneratePage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [theme, setTheme] = useState("animals");
  const [subject, setSubject] = useState("");
  const [ageGroup, setAgeGroup] = useState("4-6");
  const [quantity, setQuantity] = useState([1]);
  const [provider, setProvider] = useState("openai");
  const [mode, setMode] = useState<"credits" | "byok">("credits");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // User data
  const [credits, setCredits] = useState(0);
  const [userKeys, setUserKeys] = useState<ApiKey[]>([]);
  const [preferByok, setPreferByok] = useState(false);

  useEffect(() => {
    fetchHistory();
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      const [subRes, keysRes] = await Promise.all([
        fetch("/api/subscription"),
        fetch("/api/keys"),
      ]);
      
      if (subRes.ok) {
        const data = await subRes.json();
        setCredits(data.credits || 0);
        setPreferByok(data.preferByok || false);
        if (data.preferByok) {
          setMode("byok");
        }
      }
      
      if (keysRes.ok) {
        const data = await keysRes.json();
        setUserKeys(data.keys || []);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch("/api/generate?limit=20");
      const data = await response.json();
      setHistory(data.generations || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    // Check if user can generate
    if (mode === "credits" && credits < quantity[0]) {
      toast.error(`Not enough credits. You have ${credits}, need ${quantity[0]}.`);
      return;
    }
    
    if (mode === "byok" && !userKeys.find(k => k.provider === provider && k.isValid)) {
      toast.error(`No valid API key for ${provider}. Add one in Settings.`);
      return;
    }
    
    setIsGenerating(true);
    toast.info(`Generating ${quantity[0]} page(s)...`);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          subject: subject || undefined,
          ageGroup,
          quantity: quantity[0],
          style: "coloring",
          provider,
          mode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 402) {
          toast.error("Insufficient credits. Upgrade your plan or add your own API key.");
        } else {
          throw new Error(data.error || "Generation failed");
        }
        return;
      }

      const data = await response.json();
      
      const images: GeneratedImage[] = data.results
        .filter((r: { success: boolean }) => r.success)
        .map((r: { id: string; imagePath: string; prompt: string }) => ({
          id: r.id,
          imagePath: r.imagePath,
          prompt: r.prompt,
          selected: true,
        }));

      setGeneratedImages(images);
      
      // Update credits if returned
      if (data.credits !== undefined) {
        setCredits(data.credits);
      }
      
      fetchHistory();
      
      if (data.failed > 0) {
        toast.warning(`Generated ${data.generated}/${quantity[0]} pages. ${data.failed} failed.`);
      } else {
        toast.success(`Generated ${data.generated} page(s)!`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Generation failed. Check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleImageSelection = (id: string) => {
    setGeneratedImages((images) =>
      images.map((img) =>
        img.id === id ? { ...img, selected: !img.selected } : img
      )
    );
  };

  const handleAddToBook = async () => {
    const selected = generatedImages.filter((img) => img.selected);
    if (selected.length === 0) {
      toast.error("Please select at least one page");
      return;
    }
    
    toast.info("Create a book first, then add pages from the book editor.");
    router.push("/books/new");
  };

  const downloadImage = async (imagePath: string, index: number) => {
    try {
      const response = await fetch(imagePath);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coloring-page-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  const selectedCount = generatedImages.filter((img) => img.selected).length;
  const hasValidKey = (p: string) => userKeys.some(k => k.provider === p && k.isValid);
  const estimatedCost = providers.find(p => p.value === provider)?.cost || 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Generate Pages</h1>
        <p className="text-muted-foreground mt-1">
          Create AI-powered coloring and activity pages
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mode Toggle */}
            {session?.user && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Generation Mode</label>
                <div className="flex gap-2">
                  <Button
                    variant={mode === "credits" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setMode("credits")}
                  >
                    <Coins className="w-4 h-4 mr-1" />
                    Credits ({credits})
                  </Button>
                  <Button
                    variant={mode === "byok" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setMode("byok")}
                    disabled={userKeys.length === 0}
                  >
                    <Key className="w-4 h-4 mr-1" />
                    My Keys
                  </Button>
                </div>
                {mode === "credits" && credits < quantity[0] && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Not enough credits
                  </p>
                )}
              </div>
            )}
            
            {/* Provider Selection (BYOK mode) */}
            {mode === "byok" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">AI Provider</label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem 
                        key={p.value} 
                        value={p.value}
                        disabled={!hasValidKey(p.value)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{p.label}</span>
                          {!hasValidKey(p.value) && (
                            <span className="text-xs text-muted-foreground ml-2">(no key)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Est. cost: ${(estimatedCost * quantity[0]).toFixed(3)} for {quantity[0]} image(s)
                </p>
              </div>
            )}

            {/* Theme */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Theme</label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject (optional)</label>
              <Input
                placeholder="e.g., Lion, Letter A, Number 5..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for random subjects from the theme
              </p>
            </div>

            {/* Age Group */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Age Group</label>
              <Select value={ageGroup} onValueChange={setAgeGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ageGroups.map((ag) => (
                    <SelectItem key={ag.value} value={ag.value}>
                      {ag.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Quantity</label>
                <span className="text-sm text-muted-foreground">
                  {quantity[0]} page{quantity[0] > 1 ? "s" : ""}
                </span>
              </div>
              <Slider
                value={quantity}
                onValueChange={setQuantity}
                min={1}
                max={10}
                step={1}
              />
            </div>

            {/* Generate Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating || (mode === "credits" && credits < quantity[0])}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Pages
                </>
              )}
            </Button>

            {!session?.user && (
              <p className="text-xs text-muted-foreground text-center">
                <a href="/auth/signin" className="text-primary hover:underline">Sign in</a> to track credits and add API keys
              </p>
            )}
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Results</CardTitle>
              {generatedImages.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedCount} selected
                  </span>
                  <Button size="sm" onClick={handleAddToBook}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add to Book
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="generated">
              <TabsList className="mb-4">
                <TabsTrigger value="generated">Generated</TabsTrigger>
                <TabsTrigger value="history">
                  <History className="w-4 h-4 mr-1" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="generated">
                {isGenerating ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Array(quantity[0])
                      .fill(null)
                      .map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                      ))}
                  </div>
                ) : generatedImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {generatedImages.map((img, i) => (
                      <div
                        key={img.id}
                        onClick={() => toggleImageSelection(img.id)}
                        className={`aspect-square rounded-lg border overflow-hidden cursor-pointer relative group transition-all ${
                          img.selected
                            ? "ring-2 ring-primary border-primary"
                            : "opacity-70 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={img.imagePath}
                          alt={`Generated page ${i + 1}`}
                          fill
                          className="object-contain bg-white"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              img.selected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {img.selected ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadImage(img.imagePath, i);
                            }}
                            className="flex items-center gap-1 hover:underline"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </button>
                        </div>
                        <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
                          Page {i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center text-muted-foreground">
                    <Wand2 className="w-12 h-12 mb-4 opacity-20" />
                    <p>Generated pages will appear here</p>
                    <p className="text-sm">
                      Configure settings and click Generate
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history">
                {isLoadingHistory ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Array(6)
                      .fill(null)
                      .map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                      ))}
                  </div>
                ) : history.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {history.map((item, i) => (
                      <div
                        key={item.id}
                        className="aspect-square rounded-lg border overflow-hidden relative group"
                      >
                        <Image
                          src={item.imagePath}
                          alt={`History item ${i + 1}`}
                          fill
                          className="object-contain bg-white"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => downloadImage(item.imagePath, i)}
                            className="flex items-center gap-1 hover:underline"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center text-muted-foreground">
                    <History className="w-12 h-12 mb-4 opacity-20" />
                    <p>No generation history yet</p>
                    <p className="text-sm">
                      Your generated pages will appear here
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
