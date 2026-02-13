"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";

const themes = [
  { value: "animals", label: "🦁 Animals" },
  { value: "alphabet", label: "🔤 Alphabet" },
  { value: "numbers", label: "🔢 Numbers" },
  { value: "dinosaurs", label: "🦕 Dinosaurs" },
  { value: "unicorns", label: "🦄 Unicorns & Fairies" },
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

const trimSizes = [
  { value: "8.5x11", label: '8.5" x 11" (Letter)' },
  { value: "8x10", label: '8" x 10"' },
  { value: "6x9", label: '6" x 9"' },
];

export default function NewBookPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [theme, setTheme] = useState("animals");
  const [ageGroup, setAgeGroup] = useState("4-6");
  const [trimSize, setTrimSize] = useState("8.5x11");

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a book title");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle: subtitle || null,
          theme,
          ageGroup,
          trimSize,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create book");
      }

      const data = await response.json();
      toast.success("Book created successfully!");
      router.push(`/books/${data.book.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create book");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/books"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Books
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Create New Book</h1>
        <p className="text-muted-foreground mt-1">
          Set up your new activity book project
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Book Details
          </CardTitle>
          <CardDescription>
            Enter the basic information for your book
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Book Title *</label>
            <Input
              placeholder="e.g., Amazing Animals Coloring Book"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Subtitle (optional)</label>
            <Input
              placeholder="e.g., For Kids Ages 4-6"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>

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

          {/* Age Group */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Age Group</label>
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

          {/* Trim Size */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Trim Size</label>
            <Select value={trimSize} onValueChange={setTrimSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {trimSizes.map((ts) => (
                  <SelectItem key={ts.value} value={ts.value}>
                    {ts.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Standard sizes for Amazon KDP paperback printing
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button variant="outline" asChild className="flex-1">
              <Link href="/books">Cancel</Link>
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !title.trim()}
              className="flex-1"
            >
              {isCreating ? "Creating..." : "Create Book"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
