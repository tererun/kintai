"use client";

import { useState } from "react";
import { TaskItem } from "@/types";

interface MessagePreviewProps {
  type: "start" | "end";
  endTime?: string;
  tasks: TaskItem[];
  doneTasks?: TaskItem[];
  nextTasks?: TaskItem[];
}

export function MessagePreview({
  type,
  endTime,
  tasks,
  doneTasks,
  nextTasks,
}: MessagePreviewProps) {
  const [copied, setCopied] = useState(false);

  const generateMessage = () => {
    const lines: string[] = [];

    if (type === "start") {
      lines.push(":work_start:");
      lines.push(`稼働予定 ${endTime}`);
      lines.push("やること");
      tasks.forEach((task) => {
        lines.push(`- ${task.url ?? task.title}`);
      });
    } else {
      lines.push(":work_end:");
      lines.push("やったこと");
      (doneTasks ?? []).forEach((task) => {
        lines.push(`- ${task.url ?? task.title}`);
      });
      if (nextTasks && nextTasks.length > 0) {
        lines.push("次の自分へ");
        nextTasks.forEach((task) => {
          lines.push(`- ${task.url ?? task.title}`);
        });
      }
    }

    return lines.join("\n");
  };

  const message = generateMessage();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg">プレビュー</h3>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
            copied
              ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
              : "bg-gradient-to-r from-[var(--accent)] to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
          }`}
        >
          {copied ? (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              コピーしました!
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              コピー
            </>
          )}
        </button>
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--accent)] to-orange-600 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
        <pre className="relative p-5 bg-[var(--background)] rounded-2xl text-sm whitespace-pre-wrap font-mono overflow-x-auto border border-[var(--border)]">
          {message}
        </pre>
      </div>
    </div>
  );
}
