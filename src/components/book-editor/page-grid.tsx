"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortablePage } from "./sortable-page";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Eye } from "lucide-react";
import type { Page } from "@/types";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PageGridProps {
  pages: Page[];
  bookId: string;
  onReorder: (newOrder: string[]) => Promise<void>;
  onDelete: (pageIds: string[]) => Promise<void>;
  onAddPages: () => void;
}

export function PageGrid({
  pages,
  bookId,
  onReorder,
  onDelete,
  onAddPages,
}: PageGridProps) {
  const [items, setItems] = useState(pages);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [previewPage, setPreviewPage] = useState<Page | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      await onReorder(newItems.map((item) => item.id));
    }
  };

  const toggleSelection = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedPages.size === 0) return;
    
    await onDelete(Array.from(selectedPages));
    setItems(items.filter((item) => !selectedPages.has(item.id)));
    setSelectedPages(new Set());
  };

  const selectAll = () => {
    setSelectedPages(new Set(items.map((item) => item.id)));
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
  };

  // Sync items when pages prop changes
  if (pages.length !== items.length || pages.some((p, i) => p.id !== items[i]?.id)) {
    setItems(pages);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {pages.length} pages
          </span>
          {selectedPages.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-primary">
                {selectedPages.size} selected
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedPages.size > 0 ? (
            <>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete ({selectedPages.size})
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button size="sm" onClick={onAddPages}>
                <Plus className="w-4 h-4 mr-1" />
                Add Pages
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Grid */}
      {items.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {items.map((page, index) => (
                <SortablePage
                  key={page.id}
                  page={page}
                  index={index}
                  isSelected={selectedPages.has(page.id)}
                  onSelect={() => toggleSelection(page.id)}
                  onPreview={() => setPreviewPage(page)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">No pages in this book yet</p>
          <Button onClick={onAddPages}>
            <Plus className="w-4 h-4 mr-2" />
            Add Pages
          </Button>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewPage} onOpenChange={() => setPreviewPage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Page {previewPage?.pageNumber}</DialogTitle>
          </DialogHeader>
          {previewPage && (
            <div className="space-y-4">
              <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                <Image
                  src={previewPage.imagePath}
                  alt={`Page ${previewPage.pageNumber}`}
                  fill
                  className="object-contain"
                />
              </div>
              {previewPage.prompt && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Prompt:</span> {previewPage.prompt}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
