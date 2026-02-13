"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical, Eye, Check } from "lucide-react";
import type { Page } from "@/types";
import Image from "next/image";

interface SortablePageProps {
  page: Page;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

export function SortablePage({
  page,
  index,
  isSelected,
  onSelect,
  onPreview,
}: SortablePageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group rounded-lg border bg-card overflow-hidden transition-all",
        isDragging && "opacity-50 scale-105 shadow-lg z-50",
        isSelected && "ring-2 ring-primary border-primary"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 p-1 rounded bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Selection Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className={cn(
          "absolute top-2 right-2 z-10 w-6 h-6 rounded border-2 flex items-center justify-center transition-all",
          isSelected
            ? "bg-primary border-primary text-primary-foreground"
            : "bg-background/80 border-muted-foreground/30 backdrop-blur opacity-0 group-hover:opacity-100"
        )}
      >
        {isSelected && <Check className="w-4 h-4" />}
      </button>

      {/* Image */}
      <div className="aspect-square relative bg-muted">
        <Image
          src={page.imagePath}
          alt={`Page ${page.pageNumber}`}
          fill
          className="object-contain"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />
        
        {/* Preview Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Eye className="w-8 h-8 text-white" />
        </button>
      </div>

      {/* Page Number */}
      <div className="p-2 text-center">
        <span className="text-sm font-medium">Page {index + 1}</span>
      </div>
    </div>
  );
}
