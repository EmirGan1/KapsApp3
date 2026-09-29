import React, { useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Download, Film, Image as ImageIcon, Eye, Layers } from "lucide-react";
import PostMediaFrame from "./PostMediaFrame";
import { Post } from "../types";

export interface PostMediaItem {
  url: string;
  type: "image" | "video" | "file";
  name?: string;
  size?: number;
}

export function extractPostMediaItems(post: Post): PostMediaItem[] {
  const items: PostMediaItem[] = [];

  // 1. Try parsing attachments
  let attachmentsList: any[] = [];
  if (post.attachments) {
    if (typeof post.attachments === "string") {
      try {
        attachmentsList = JSON.parse(post.attachments);
      } catch {
        attachmentsList = [];
      }
    } else if (Array.isArray(post.attachments)) {
      attachmentsList = post.attachments;
    }
  }

  if (Array.isArray(attachmentsList) && attachmentsList.length > 0) {
    for (const att of attachmentsList) {
      if (!att) continue;
      if (typeof att === "string") {
        const ext = att.split(".").pop()?.toLowerCase() || "";
        const isVid = ["mp4", "webm", "mov", "mkv", "avi"].includes(ext);
        const isDoc = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip", "txt"].includes(ext);
        items.push({
          url: att,
          type: isVid ? "video" : isDoc ? "file" : "image",
          name: att.split("/").pop() || "Dosya"
        });
      } else if (typeof att === "object" && att.url) {
        const ext = String(att.url).split(".").pop()?.toLowerCase() || "";
        const isVid = att.media_type === "video" || ["mp4", "webm", "mov", "mkv", "avi"].includes(ext);
        const isDoc = att.media_type === "file" || ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip", "txt"].includes(ext);
        items.push({
          url: att.url,
          type: isVid ? "video" : isDoc ? "file" : (att.media_type || "image"),
          name: att.original_name || att.name || String(att.url).split("/").pop() || "Dosya",
          size: att.size
        });
      }
    }
  }

  // 2. If no attachments were found or only post.image is set
  if (items.length === 0 && post.image) {
    const ext = post.image.split(".").pop()?.toLowerCase() || "";
    const isVid = post.media_type === "video" || ["mp4", "webm", "mov", "mkv", "avi"].includes(ext);
    const isDoc = post.media_type === "file" || ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip", "txt"].includes(ext);
    items.push({
      url: post.image,
      type: isVid ? "video" : isDoc ? "file" : (post.media_type || "image"),
      name: post.image.split("/").pop() || "Medya"
    });
  }

  return items;
}

interface MultiMediaPostViewerProps {
  post: Post;
  onOpenModal: (post: Post, initialIndex?: number) => void;
}

export default function MultiMediaPostViewer({ post, onOpenModal }: MultiMediaPostViewerProps) {
  const items = extractPostMediaItems(post);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex] || items[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || isNaN(bytes)) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Render file attachment card
  const renderFileCard = (item: PostMediaItem, isSingle = false) => {
    return (
      <div 
        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:border-blue-400 transition-all cursor-pointer"
        onClick={() => onOpenModal(post, currentIndex)}
      >
        <div className="flex items-center gap-3.5 min-w-0 pr-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
            <FileText size={24} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
              {item.name || "Ders Dosyası"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {formatFileSize(item.size) || "Döküman"} • İndir veya Görüntüle
            </p>
          </div>
        </div>
        <a
          href={item.url}
          download={item.name || `kapsapp-file-${Date.now()}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Download size={14} />
          <span className="hidden sm:inline">İndir</span>
        </a>
      </div>
    );
  };

  // SINGLE ITEM VIEW
  if (items.length === 1) {
    if (currentItem.type === "file") {
      return <div className="px-2 sm:px-4 pb-3">{renderFileCard(currentItem, true)}</div>;
    }
    return (
      <div className="px-2 sm:px-4 pb-3">
        <PostMediaFrame
          src={currentItem.url}
          mediaType={currentItem.type}
          alt={post.caption || currentItem.name || "Gönderi medyası"}
          onClick={() => onOpenModal(post, 0)}
        />
      </div>
    );
  }

  // MULTIPLE ITEMS CAROUSEL VIEW (2 to 50 items)
  return (
    <div className="px-2 sm:px-4 pb-3 select-none">
      <div className="relative group/carousel rounded-2xl overflow-hidden shadow-sm">
        {/* Active Item Container */}
        {currentItem.type === "file" ? (
          <div className="p-2 bg-slate-950/40 rounded-2xl">
            {renderFileCard(currentItem)}
          </div>
        ) : (
          <PostMediaFrame
            src={currentItem.url}
            mediaType={currentItem.type}
            alt={post.caption || currentItem.name || "Gönderi medyası"}
            onClick={() => onOpenModal(post, currentIndex)}
          />
        )}

        {/* Counter Badge (Top Right) */}
        <div className="absolute top-3 right-3 z-20 bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-md pointer-events-none border border-white/10">
          <Layers size={13} className="text-blue-400" />
          <span>{currentIndex + 1} / {items.length}</span>
        </div>

        {/* Navigation Arrows (Visible on hover or mobile) */}
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-md shadow-lg transition-all opacity-80 sm:opacity-0 group-hover/carousel:opacity-100 active:scale-95 cursor-pointer border border-white/15"
              title="Önceki"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-md shadow-lg transition-all opacity-80 sm:opacity-0 group-hover/carousel:opacity-100 active:scale-95 cursor-pointer border border-white/15"
              title="Sonraki"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip / Indicator Dots below carousel */}
      <div className="mt-2 flex items-center justify-between gap-2 overflow-hidden px-1">
        {/* Thumbnail Preview Row (Horizontal scroll for up to 50 items) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full scrollbar-none">
          {items.map((it, idx) => (
            <button
              key={`${it.url}_${idx}`}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                idx === currentIndex
                  ? "border-blue-500 scale-105 shadow-md ring-2 ring-blue-500/30"
                  : "border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100"
              }`}
            >
              {it.type === "video" ? (
                <div className="w-full h-full bg-neutral-900 flex items-center justify-center relative">
                  <video src={it.url} muted className="w-full h-full object-cover pointer-events-none" />
                  <Film size={14} className="absolute text-white drop-shadow-md" />
                </div>
              ) : it.type === "file" ? (
                <div className="w-full h-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FileText size={16} />
                </div>
              ) : (
                <img
                  src={it.url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              )}
              <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-[9px] text-white px-1 rounded font-mono">
                {idx + 1}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
