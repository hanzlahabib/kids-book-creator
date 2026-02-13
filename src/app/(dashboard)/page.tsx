"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Wand2, FileStack, Download, BookOpen } from "lucide-react";
import type { Book } from "@/types";

interface Stats {
  totalBooks: number;
  totalPages: number;
  totalGenerations: number;
  exportedBooks: number;
}

interface RecentBook extends Book {
  _count?: { pages: number };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalBooks: 0,
    totalPages: 0,
    totalGenerations: 0,
    exportedBooks: 0,
  });
  const [recentBooks, setRecentBooks] = useState<RecentBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats");
      const data = await response.json();
      setStats(data.stats);
      setRecentBooks(data.recentBooks || []);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Create beautiful children&apos;s books for Amazon KDP
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/generate">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Generate Pages</h3>
                <p className="text-sm text-muted-foreground">
                  Create AI coloring pages
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/templates">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <FileStack className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold">Browse Templates</h3>
                <p className="text-sm text-muted-foreground">
                  Start with a template
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/books">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Download className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold">Export Book</h3>
                <p className="text-sm text-muted-foreground">
                  Download KDP-ready PDFs
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Books Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Books</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/books">View All</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4]" />
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
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

            {recentBooks.length > 0 ? (
              recentBooks.slice(0, 4).map((book) => (
                <Link key={book.id} href={`/books/${book.id}`}>
                  <Card className="aspect-[3/4] hover:border-primary/50 transition-colors cursor-pointer overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-primary/30 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-primary/30" />
                    </div>
                    <CardContent className="h-full flex flex-col justify-end p-4 relative z-10">
                      <div className="bg-background/90 backdrop-blur rounded-lg p-3 -mx-1 -mb-1">
                        <h3 className="font-semibold text-sm truncate">
                          {book.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {book._count?.pages || book.pageCount || 0} pages
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="aspect-[3/4] bg-muted/30 border-dashed">
                <CardContent className="h-full flex flex-col items-center justify-center p-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Your books will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold">{stats.totalBooks}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pages Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold">{stats.totalGenerations}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Book Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold">{stats.totalPages}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Exported
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold">{stats.exportedBooks}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
