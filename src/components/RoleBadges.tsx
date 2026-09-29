import React from "react";
import { COURSE_ROLES, CourseRole } from "../types";
import { ShieldCheck, Plus, Sparkles, Tag } from "lucide-react";

interface RoleBadgesProps {
  roles?: string[] | null;
  showEditButton?: boolean;
  onEditClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  emptyText?: string;
}

export default function RoleBadges({
  roles,
  showEditButton = false,
  onEditClick,
  size = "md",
  className = "",
  emptyText = "Henüz rol atanmadı"
}: RoleBadgesProps) {
  // Normalize roles: if empty or undefined, fallback to default roles (titc & eng_b_hl)
  const roleIds = Array.isArray(roles) && roles.length > 0 
    ? roles 
    : ["titc", "eng_b_hl"];

  // Map to CourseRole objects in canonical order
  const activeRoles: CourseRole[] = COURSE_ROLES.filter((r) => roleIds.includes(r.id));

  const sizeStyles = {
    sm: {
      pill: "px-2 py-0.5 text-[11px] gap-1.5",
      dot: "w-1.5 h-1.5",
      text: "text-[11px]"
    },
    md: {
      pill: "px-2.5 py-1 text-xs gap-2",
      dot: "w-2 h-2",
      text: "text-xs font-semibold"
    },
    lg: {
      pill: "px-3 py-1.5 text-sm gap-2.5",
      dot: "w-2.5 h-2.5",
      text: "text-sm font-semibold"
    }
  }[size];

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {activeRoles.map((role) => (
        <div
          key={role.id}
          style={{
            backgroundColor: `${role.color}1A`, // 10% opacity
            borderColor: `${role.color}4D`,     // 30% opacity
          }}
          className={`inline-flex items-center rounded-lg border transition-all duration-150 select-none shadow-2xs hover:scale-105 ${sizeStyles.pill}`}
          title={`${role.label} IB Dersi Rolü`}
        >
          {/* Discord-style Glowing Role Circle Dot */}
          <span
            style={{
              backgroundColor: role.color,
              boxShadow: `0 0 6px ${role.color}80`
            }}
            className={`${sizeStyles.dot} rounded-full shrink-0`}
          />
          {/* Readable English Course Label */}
          <span className={`text-slate-900 dark:text-slate-100 tracking-tight leading-none ${sizeStyles.text}`}>
            {role.label}
          </span>
        </div>
      ))}

      {activeRoles.length === 0 && (
        <span className="text-xs text-slate-400 italic">{emptyText}</span>
      )}

      {/* Emirgan / Admin Role Edit Button */}
      {showEditButton && onEditClick && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditClick();
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
          title="Emirgan Rol Yönetimi: Kullanıcı Ders Rollerini Düzenle"
        >
          <Tag size={12} className="text-indigo-500" />
          <span>+ Rolleri Düzenle</span>
        </button>
      )}
    </div>
  );
}
