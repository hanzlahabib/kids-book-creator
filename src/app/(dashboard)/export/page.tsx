"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Download, FileText, BookOpen, Package } from "lucide-react";
import type { Book } from "@/types";

const trimSizes = [
  { value: "8.5x11", label: '8.5" x 11" (Letter)' },
  { value: "8x10", label: '8" x 10"' },
  { value: "6x9", label: '6" x 9"' },
];

export default function ExportPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [trimSize, setTrimSize] = useState("8.5x11");
  const [coverAuthor, setCoverAuthor] = useState("Activity Books");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch("/api/books");
      const data = await response.json();
      const booksWithPages = (data.books || []).filter(
        (b: Book) => b.pageCount > 0 || (b.pages && b.pages.length > 0)
      );
      setBooks(booksWithPages);
      if (booksWithPages.length > 0) {
        setSelectedBookId(booksWithPages[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch books:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedBook = books.find((b) => b.id === selectedBookId);

  const handleExport = async () => {
    if (!selectedBookId) {
      toast.error("Please select a book to export");
      return;
    }

    setIsExporting(true);
    toast.info("Generating PDF export package...");

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: selectedBookId,
          trimSize,
          includePageNumbers: true,
          includeCover: true,
          coverAuthor,
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
      a.download = `${selectedBook?.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-kdp-package.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Export complete! Download started.");
      fetchBooks(); // Refresh to update status
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Export</h1>
        <p className="text-muted-foreground mt-1">
          Download your books as KDP-ready PDF files
        </p>
      </div>

      {books.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Download className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No books to export</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Create a book and add pages first, then come here to export it as a
              KDP-ready PDF with interior and cover files.
            </p>
            <Button asChild>
              <Link href="/books/new">Create Book</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Export Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Export Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Book Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Book</label>
                <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a book" />
                  </SelectTrigger>
                  <SelectContent>
                    {books.map((book) => (
                      <SelectItem key={book.id} value={book.id}>
                        {book.title} ({book.pageCount || book.pages?.length || 0} pages)
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
              </div>

              {/* Cover Author */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Cover Author Name</label>
                <Input
                  value={coverAuthor}
                  onChange={(e) => setCoverAuthor(e.target.value)}
                  placeholder="Your name or pen name"
                />
              </div>

              {/* Selected Book Info */}
              {selectedBook && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-medium">{selectedBook.title}</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Pages: {selectedBook.pageCount || selectedBook.pages?.length || 0}</p>
                    <p>Theme: {selectedBook.theme || "Not set"}</p>
                    <p>Age Group: {selectedBook.ageGroup || "Not set"}</p>
                    <p>
                      Status:{" "}
                      <span
                        className={
                          selectedBook.status === "exported"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }
                      >
                        {selectedBook.status}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Export Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleExport}
                disabled={isExporting || !selectedBookId}
              >
                {isExporting ? (
                  "Generating PDFs..."
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export KDP Package
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Export Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Interior PDF
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                All your coloring pages compiled into a single PDF with correct
                margins and dimensions for KDP printing. Pages are single-sided
                for proper coloring book format.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Cover PDF
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Front cover, spine, and back cover combined into a single file
                with proper bleeds and dimensions. Spine width is automatically
                calculated based on your page count.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  ZIP Package
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                You&apos;ll receive a ZIP file containing:
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li>Interior PDF (book-name-interior.pdf)</li>
                  <li>Cover PDF (book-name-cover.pdf)</li>
                  <li>README with KDP upload instructions</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">📋 KDP Requirements</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>✓ Minimum 24 pages recommended</p>
                <p>✓ 300 DPI resolution</p>
                <p>✓ Proper bleed and margins</p>
                <p>✓ Black & white interior</p>
                <p>✓ Spine calculated for white paper</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
