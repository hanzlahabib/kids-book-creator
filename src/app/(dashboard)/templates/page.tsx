"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { RefreshCw, FileStack } from "lucide-react";
import type { Template } from "@/types";

const categoryEmojis: Record<string, string> = {
  coloring: "🎨",
  tracing: "✏️",
  educational: "📚",
  activity: "🎯",
};

const themeEmojis: Record<string, string> = {
  animals: "🦁",
  alphabet: "🔤",
  numbers: "🔢",
  dinosaurs: "🦕",
  unicorns: "🦄",
  vehicles: "🚗",
  ocean: "🐠",
  nature: "🌸",
  islamic: "🌙",
  space: "🚀",
  food: "🍕",
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [ageFilter, setAgeFilter] = useState<string>("all");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedTemplates = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch("/api/templates/seed", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to seed templates");

      const data = await response.json();
      toast.success(data.message);
      fetchTemplates();
    } catch (error) {
      toast.error("Failed to seed templates");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleUseTemplate = async (template: Template) => {
    try {
      // Create a new book based on the template
      const config = template.config ? JSON.parse(template.config) : {};
      
      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: template.name,
          theme: template.theme,
          ageGroup: template.ageGroup,
          trimSize: "8.5x11",
        }),
      });

      if (!response.ok) throw new Error("Failed to create book");

      const data = await response.json();
      toast.success(`Created book from template: ${template.name}`);
      router.push(`/books/${data.book.id}`);
    } catch (error) {
      toast.error("Failed to create book from template");
    }
  };

  const filteredTemplates = templates.filter((template) => {
    if (categoryFilter !== "all" && template.category !== categoryFilter) return false;
    if (ageFilter !== "all" && template.ageGroup !== ageFilter) return false;
    return true;
  });

  const categories = [...new Set(templates.map((t) => t.category))];
  const ageGroups = [...new Set(templates.map((t) => t.ageGroup))];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Templates</h1>
          <p className="text-muted-foreground mt-1">
            Start with a pre-built template for faster book creation
          </p>
        </div>
        {templates.length === 0 && (
          <Button onClick={handleSeedTemplates} disabled={isSeeding}>
            {isSeeding ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load Starter Templates"
            )}
          </Button>
        )}
      </div>

      {/* Filters */}
      {templates.length > 0 && (
        <div className="flex gap-4 mb-6">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {categoryEmojis[cat] || "📁"} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={ageFilter} onValueChange={setAgeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Age Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ages</SelectItem>
              {ageGroups.map((age) => (
                <SelectItem key={age} value={age}>
                  Ages {age}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileStack className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No templates loaded</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Click the button above to load 10 starter templates including Animals,
              Alphabet, Numbers, Dinosaurs, and more!
            </p>
            <Button onClick={handleSeedTemplates} disabled={isSeeding}>
              {isSeeding ? "Loading..." : "Load Starter Templates"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => {
            const config = template.config ? JSON.parse(template.config) : {};
            return (
              <Card
                key={template.id}
                className="hover:border-primary/50 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl mb-2">
                    {themeEmojis[template.theme] || "📁"}
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm text-muted-foreground mb-4">
                    <p className="flex items-center gap-1">
                      {categoryEmojis[template.category]} {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                    </p>
                    <p>Ages {template.ageGroup}</p>
                    {config.pageCount && <p>{config.pageCount} pages</p>}
                  </div>
                  {template.description && (
                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => handleUseTemplate(template)}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
