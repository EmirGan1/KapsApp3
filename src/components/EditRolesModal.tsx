import React, { useState, useEffect } from "react";
import { X, Check, Shield, Sparkles, Tag, AlertCircle, RefreshCw, Layers } from "lucide-react";
import { COURSE_ROLES, CourseRole } from "../types";
import { getApiUrl, getAuthHeaders } from "../utils/api";
import { Socket } from "socket.io-client";

interface EditRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  username: string;
  currentRoles?: string[];
  socket?: Socket | null;
  onRolesUpdated?: (newRoles: string[]) => void;
}

export default function EditRolesModal({
  isOpen,
  onClose,
  userId,
  username,
  currentRoles = [],
  socket,
  onRolesUpdated
}: EditRolesModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Ensure defaults (titc, eng_b_hl) if empty
      const initial = Array.isArray(currentRoles) && currentRoles.length > 0
        ? currentRoles
        : ["titc", "eng_b_hl"];
      setSelectedRoles(Array.from(new Set(initial)));
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [isOpen, currentRoles]);

  if (!isOpen) return null;

  // Toggle role with Smart SL / HL Conflict resolution
  const handleToggleRole = (role: CourseRole) => {
    setSelectedRoles((prev) => {
      const isSelected = prev.includes(role.id);

      if (isSelected) {
        // Unselecting
        return prev.filter((id) => id !== role.id);
      } else {
        // Selecting: If this role belongs to a subject group with SL/HL level, remove the conflicting level
        let next = [...prev];
        if (role.subjectGroup && role.level) {
          const conflictingRole = COURSE_ROLES.find(
            (r) => r.subjectGroup === role.subjectGroup && r.id !== role.id
          );
          if (conflictingRole) {
            next = next.filter((id) => id !== conflictingRole.id);
          }
        }
        next.push(role.id);
        return next;
      }
    });
  };

  const handleSelectDefaults = () => {
    setSelectedRoles((prev) => {
      const merged = Array.from(new Set([...prev, "titc", "eng_b_hl"]));
      return merged;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    // Make sure at least the mandatory default roles are preserved
    const rolesToSave = Array.from(new Set([...selectedRoles]));
    if (!rolesToSave.includes("titc")) rolesToSave.unshift("titc");
    if (!rolesToSave.includes("eng_b_hl")) rolesToSave.push("eng_b_hl");

    try {
      // 1. REST API update
      const res = await fetch(getApiUrl(`/api/users/${userId}/roles`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({ roles: rolesToSave })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Roller güncellenirken hata oluştu.");
      }

      // 2. Socket update broadcast for instant reactivity
      if (socket && socket.connected) {
        socket.emit("update_user_roles", { targetUserId: userId, roles: rolesToSave });
      }

      if (onRolesUpdated) {
        onRolesUpdated(rolesToSave);
      }

      setSuccessMessage("Roller başarıyla kaydedildi!");
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      console.error("Save roles error:", err);
      setErrorMessage(err.message || "Roller kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  // Group roles by subject for clean UI categorization
  const defaultRoles = COURSE_ROLES.filter((r) => r.isDefault);
  const subjectGroups = [
    { title: "Turkish A", roles: COURSE_ROLES.filter((r) => r.subjectGroup === "turkish") },
    { title: "Mathematics", roles: COURSE_ROLES.filter((r) => r.subjectGroup === "math") },
    { title: "Physics", roles: COURSE_ROLES.filter((r) => r.subjectGroup === "physics") },
    { title: "Psychology", roles: COURSE_ROLES.filter((r) => r.subjectGroup === "psychology") },
    { title: "Chemistry", roles: COURSE_ROLES.filter((r) => r.subjectGroup === "chemistry") },
    { title: "Biology", roles: COURSE_ROLES.filter((r) => r.subjectGroup === "biology") }
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold">
              <Tag size={20} />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white flex items-center gap-2">
                IB Ders Rolleri Yönetimi
              </h3>
              <p className="text-xs text-slate-400">
                <span className="text-indigo-400 font-semibold">@{username}</span> kullanıcısının ders rozetleri
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 scrollbar-thin scrollbar-thumb-slate-700">
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <Check size={16} className="shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Discord Live Preview Section */}
          <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-indigo-400" />
                Discord Profil Önizlemesi ({selectedRoles.length} Rol)
              </span>
              <button
                type="button"
                onClick={handleSelectDefaults}
                className="text-[11px] text-blue-400 hover:underline cursor-pointer"
              >
                Varsayılanları Geri Yükle
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 min-h-[34px] p-2 bg-slate-900/90 rounded-xl border border-slate-800">
              {selectedRoles.length === 0 ? (
                <span className="text-xs text-slate-500 italic">Hiçbir rol seçilmedi</span>
              ) : (
                COURSE_ROLES.filter((r) => selectedRoles.includes(r.id)).map((role) => (
                  <div
                    key={role.id}
                    style={{
                      backgroundColor: `${role.color}1A`,
                      borderColor: `${role.color}4D`
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold shadow-xs"
                  >
                    <span
                      style={{
                        backgroundColor: role.color,
                        boxShadow: `0 0 6px ${role.color}80`
                      }}
                      className="w-2 h-2 rounded-full shrink-0"
                    />
                    <span className="text-slate-100">{role.label}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 1. Mandatory Default Roles */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Layers size={13} className="text-rose-400" />
              <span>Zorunlu Varsayılan Roller (Tüm Öğrenciler)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {defaultRoles.map((role) => {
                const isSelected = selectedRoles.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleToggleRole(role)}
                    style={{
                      borderColor: isSelected ? role.color : undefined,
                      backgroundColor: isSelected ? `${role.color}15` : undefined
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                      isSelected
                        ? "border-2 shadow-md shadow-slate-950"
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        style={{ backgroundColor: role.color }}
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                      />
                      <div>
                        <p className="font-bold text-sm text-white">{role.label}</p>
                        <p className="text-[10px] text-slate-400">Zorunlu / Varsayılan</p>
                      </div>
                    </div>
                    <div
                      style={{ backgroundColor: isSelected ? role.color : undefined }}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                        isSelected ? "border-transparent text-white" : "border-slate-700 text-transparent"
                      }`}
                    >
                      <Check size={12} strokeWidth={3} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Elective IB Subject Groups with SL / HL Smart Switch */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Seçmeli IB Dersleri (SL / HL Otomatik Geçiş)</span>
              <span className="text-[10px] text-slate-500 font-normal lowercase">Aynı dersin SL/HL seçenekleri birbirini otomatik dengeler</span>
            </div>

            <div className="space-y-2.5">
              {subjectGroups.map((group) => (
                <div key={group.title} className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80">
                  <p className="text-xs font-semibold text-slate-300 mb-2 px-1">{group.title}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.roles.map((role) => {
                      const isSelected = selectedRoles.includes(role.id);
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => handleToggleRole(role)}
                          style={{
                            borderColor: isSelected ? role.color : undefined,
                            backgroundColor: isSelected ? `${role.color}18` : undefined
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                            isSelected
                              ? "border-2 shadow-md shadow-slate-950"
                              : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-1">
                            <span
                              style={{ backgroundColor: role.color }}
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                            />
                            <span className="font-semibold text-xs text-slate-100 truncate">{role.label}</span>
                          </div>
                          <div
                            style={{ backgroundColor: isSelected ? role.color : undefined }}
                            className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                              isSelected ? "border-transparent text-white" : "border-slate-700 text-transparent"
                            }`}
                          >
                            <Check size={10} strokeWidth={3} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Vazgeç
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Rolleri Kaydet</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
