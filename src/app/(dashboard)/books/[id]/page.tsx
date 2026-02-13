"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageGrid } from "@/components/book-editor/page-grid";
import { AddPagesDialog } from "@/components/book-editor/add-pages-dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  MoreVertical,
  Download,
  Trash2,
  Save,
  BookOpen,
  Eye,
} from "lucide-react";
import type { Book, Page } from "@/types";

const trimSizes = [
  { value: "8.5x11", label: '8.5" x 11"' },
  { value: "8x10", label: '8" x 10"' },
  { value: "6x9", label: '6" x 9"' },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BookEditorPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showAddPages, setShowAddPages] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Editable fields
  const [title, setTitle] = useState("");
  const [trimSize, setTrimSize] = useState("8.5x11");

  useEffect(() => {
    fetchBook();
  }, [id]);

  const fetchBook = async () => {
    try {
      const response = await fetch(`/api/books/${id}`);
      if (!response.ok) throw new Error("Book not found");
      
      const data = await response.json();
      setBook(data.book);
      setTitle(data.book.title);
      setTrimSize(data.book.trimSize);
    } catch (error) {
      toast.error("Failed to load book");
      router.push("/books");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!book) return;
    setIsSaving(true);

    try {
      const response = await fetch(`/api/books/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, trimSize }),
      });

      if (!response.ok) throw new Error("Failed to save");
      
      const data = await response.json();
      setBook(data.book);
      toast.success("Book saved");
    } catch (error) {
      toast.error("Failed to save book");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReorder = async (newOrder: string[]) => {
    try {
      const response = await fetch(`/api/books/${id}/pages`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageOrder: newOrder }),
      });

      if (!response.ok) throw new Error("Failed to reorder");
      
      const data = await response.json();
      setBook(data.book);
    } catch (error) {
      toast.error("Failed to reorder pages");
      fetchBook();
    }
  };

  const handleDeletePages = async (pageIds: string[]) => {
    try {
      await Promise.all(
        pageIds.map((pageId) =>
          fetch(`/api/pages/${pageId}`, { method: "DELETE" })
        )
      );
      
      await fetchBook();
      toast.success(`Deleted ${pageIds.length} page(s)`);
    } catch (error) {
      toast.error("Failed to delete pages");
    }
  };

  const handleAddPages = async (
    pages: { imagePath: string; prompt: string }[]
  ) => {
    try {
      const response = await fetch(`/api/books/${id}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pages: pages.map((p) => ({
            imagePath: p.imagePath,
            prompt: p.prompt,
            theme: book?.theme,
            ageGroup: book?.ageGroup,
            style: "coloring",
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to add pages");
      
      await fetchBook();
    } catch (error) {
      throw error;
    }
  };

  const handleExport = async () => {
    if (!book || book.pages?.length === 0) {
      toast.error("Book has no pages to export");
      return;
    }

    setIsExporting(true);
    toast.info("Generating PDF export...");

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: id,
          trimSize,
          includePageNumbers: true,
          includeCover: true,
          coverTitle: title,
          coverAuthor: "Activity Books",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Export failed");
      }

      // Download the ZIP file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-kdp-package.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Export complete! Download started.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteBook = async () => {
    try {
      await fetch(`/api/books/${id}`, { method: "DELETE" });
      toast.success("Book deleted");
      router.push("/books");
    } catch (error) {
      toast.error("Failed to delete book");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-32 mb-8" />
        <div className="grid grid-cols-5 gap-4">
          {Array(10)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
        </div>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/books"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Books
          </Link>
          <div className="flex items-center gap-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold h-auto py-1 px-2 border-transparent hover:border-input focus:border-input"
            />
            <span
              className={`text-xs px-2 py-1 rounded ${
                book.status === "exported"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {book.status}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            {book.pages?.length || 0} pages • {book.theme} • {book.ageGroup}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={trimSize} onValueChange={setTrimSize}>
            <SelectTrigger className="w-32">
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

          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>

          {book.pages && book.pages.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}

          <Button
            onClick={handleExport}
            disabled={isExporting || !book.pages?.length}
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export PDF"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowPreview(true)}>
                <Eye className="w-4 h-4 mr-2" />
                Preview Book
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Book
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Page Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Pages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PageGrid
            pages={book.pages || []}
            bookId={id}
            onReorder={handleReorder}
            onDelete={handleDeletePages}
            onAddPages={() => setShowAddPages(true)}
          />
        </CardContent>
      </Card>

      {/* Add Pages Dialog */}
      <AddPagesDialog
        open={showAddPages}
        onOpenChange={setShowAddPages}
        bookTheme={book.theme}
        bookAgeGroup={book.ageGroup}
        onAddPages={handleAddPages}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Book</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{book.title}"? This action cannot
              be undone and will delete all pages in the book.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBook}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Book Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Book Preview</DialogTitle>
          </DialogHeader>
          {book.pages && book.pages.length > 0 && (
            <div className="space-y-4">
              <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                <img
                  src={book.pages[previewIndex]?.imagePath}
                  alt={`Page ${previewIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() =>
                    setPreviewIndex(Math.max(0, previewIndex - 1))
                  }
                  disabled={previewIndex === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {previewIndex + 1} of {book.pages.length}
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setPreviewIndex(
                      Math.min(book.pages!.length - 1, previewIndex + 1)
                    )
                  }
                  disabled={previewIndex === book.pages.length - 1}
                >
                  Next
                </Button>
              </div>
              {/* Thumbnail strip */}
              <div className="flex gap-2 overflow-x-auto py-2">
                {book.pages.map((page, index) => (
                  <button
                    key={page.id}
                    onClick={() => setPreviewIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                      index === previewIndex
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={page.imagePath}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
