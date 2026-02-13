"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BookOpen, MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { Book } from "@/types";

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch("/api/books");
      const data = await response.json();
      setBooks(data.books || []);
    } catch (error) {
      toast.error("Failed to load books");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this book?")) return;

    try {
      await fetch(`/api/books/${id}`, { method: "DELETE" });
      setBooks(books.filter((b) => b.id !== id));
      toast.success("Book deleted");
    } catch (error) {
      toast.error("Failed to delete book");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4]" />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Books</h1>
          <p className="text-muted-foreground mt-1">
            Manage and edit your book projects
          </p>
        </div>
        <Button asChild>
          <Link href="/books/new">
            <Plus className="w-4 h-4 mr-2" />
            New Book
          </Link>
        </Button>
      </div>

      {books.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No books yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Create your first book to get started. You can generate pages,
              arrange them, and export as KDP-ready PDFs.
            </p>
            <Button asChild>
              <Link href="/books/new">
                <Plus className="w-4 h-4 mr-2" />
                Create First Book
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* New Book Card */}
          <Link href="/books/new">
            <Card className="aspect-[3/4] hover:border-primary/50 transition-colors cursor-pointer border-dashed">
              <CardContent className="h-full flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  New Book
                </span>
              </CardContent>
            </Card>
          </Link>

          {/* Book Cards */}
          {books.map((book) => (
            <Link key={book.id} href={`/books/${book.id}`}>
              <Card className="aspect-[3/4] hover:border-primary/50 transition-colors cursor-pointer overflow-hidden group relative">
                {/* Cover Preview */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-primary/30 flex items-center justify-center">
                  {book.pages && book.pages.length > 0 ? (
                    <img
                      src={book.pages[0].imagePath}
                      alt={book.title}
                      className="w-full h-full object-cover opacity-30"
                    />
                  ) : (
                    <BookOpen className="w-16 h-16 text-primary/30" />
                  )}
                </div>

                {/* Book Info */}
                <CardContent className="h-full flex flex-col justify-end p-4 relative z-10">
                  <div className="bg-background/90 backdrop-blur rounded-lg p-3 -mx-1 -mb-1">
                    <h3 className="font-semibold text-sm truncate">
                      {book.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {book.pageCount} pages
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          book.status === "exported"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {book.status}
                      </span>
                    </div>
                  </div>
                </CardContent>

                {/* Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.preventDefault()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => handleDelete(book.id, e)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
