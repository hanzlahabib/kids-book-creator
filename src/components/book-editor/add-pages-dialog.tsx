"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Wand2, RefreshCw, Check, X, Image as ImageIcon } from "lucide-react";
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
];

interface GeneratedImage {
  id: string;
  imagePath: string;
  prompt: string;
  selected: boolean;
}

interface AddPagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookTheme?: string | null;
  bookAgeGroup?: string | null;
  onAddPages: (pages: { imagePath: string; prompt: string }[]) => Promise<void>;
}

export function AddPagesDialog({
  open,
  onOpenChange,
  bookTheme,
  bookAgeGroup,
  onAddPages,
}: AddPagesDialogProps) {
  const [theme, setTheme] = useState(bookTheme || "animals");
  const [subject, setSubject] = useState("");
  const [ageGroup, setAgeGroup] = useState(bookAgeGroup || "4-6");
  const [quantity, setQuantity] = useState([5]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    toast.info(`Generating ${quantity[0]} pages...`);

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
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await response.json();
      
      const images: GeneratedImage[] = data.results
        .filter((r: any) => r.success)
        .map((r: any) => ({
          id: r.id,
          imagePath: r.imagePath,
          prompt: r.prompt,
          selected: true,
        }));

      setGeneratedImages(images);
      
      if (data.failed > 0) {
        toast.warning(`Generated ${data.generated}/${quantity[0]} pages. ${data.failed} failed.`);
      } else {
        toast.success(`Generated ${data.generated} pages!`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Generation failed");
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

  const handleAddSelected = async () => {
    const selected = generatedImages.filter((img) => img.selected);
    if (selected.length === 0) {
      toast.error("Please select at least one page");
      return;
    }

    setIsAdding(true);

    try {
      await onAddPages(
        selected.map((img) => ({
          imagePath: img.imagePath,
          prompt: img.prompt,
        }))
      );
      
      toast.success(`Added ${selected.length} pages to book`);
      setGeneratedImages([]);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to add pages");
    } finally {
      setIsAdding(false);
    }
  };

  const selectedCount = generatedImages.filter((img) => img.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Pages to Book</DialogTitle>
          <DialogDescription>
            Generate new pages or select from generation history
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="generate">
          <TabsList className="w-full">
            <TabsTrigger value="generate" className="flex-1">Generate New</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">From History</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            {/* Generation Controls */}
            <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Subject (optional)</label>
                <Input
                  placeholder="e.g., Lion, Letter A..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Quantity</label>
                  <span className="text-sm text-muted-foreground">
                    {quantity[0]} pages
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
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
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

            {/* Generated Images Grid */}
            {generatedImages.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedCount} of {generatedImages.length} selected
                  </span>
                  <Button
                    onClick={handleAddSelected}
                    disabled={selectedCount === 0 || isAdding}
                  >
                    {isAdding ? "Adding..." : `Add ${selectedCount} Pages`}
                  </Button>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {generatedImages.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => toggleImageSelection(img.id)}
                      className={`relative aspect-square rounded-lg border overflow-hidden cursor-pointer transition-all ${
                        img.selected
                          ? "ring-2 ring-primary border-primary"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={img.imagePath}
                        alt="Generated page"
                        fill
                        className="object-contain"
                      />
                      <div
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
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
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <div className="py-8 text-center text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Generation history will appear here</p>
              <p className="text-sm">Generate pages first to build your library</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
