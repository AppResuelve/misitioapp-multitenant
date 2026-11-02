// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Modal, Input, Button } from "@/components/ui";
import { slugify } from "@/utils/slugify";
import { COLOR_PALETTE } from "@/constants/colors";
import type { Campaign } from "@/hooks/admin-useCampaigns";

interface CampaignModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
  editing: Campaign | null;
  saving: boolean;
}

const formatDateInput = (dateStr?: string | null) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function CampaignModal({
  open,
  onClose,
  onSave,
  editing,
  saving,
}: CampaignModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [color, setColor] = useState(COLOR_PALETTE[0] || "#6366f1");
  const [slugManual, setSlugManual] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (editing) {
      setName(editing.name);
      setSlug(editing.slug);
      setDescription(editing.description || "");
      setStartsAt(formatDateInput(editing.startsAt));
      setEndsAt(formatDateInput(editing.endsAt));
      setColor(editing.color || COLOR_PALETTE[0] || "#6366f1");
      setSlugManual(true);
    } else {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      setName("");
      setSlug("");
      setDescription("");
      setStartsAt(formatDateInput(now.toString()));
      setEndsAt(formatDateInput(nextWeek.toString()));
      setColor(COLOR_PALETTE[0] || "#6366f1");
      setSlugManual(false);
    }
  }, [open, editing]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugManual) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      description: description.trim() || null,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      color,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar campaña" : "Nueva campaña"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre de la campaña"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Día de la Madre, Hot Sale..."
          required
          autoFocus
        />

        <Input
          label="Identificador único (Slug)"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugManual(true);
          }}
          placeholder="dia-de-la-madre"
          required
        />

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            Descripción interna (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Notas para el equipo o detalles de la estrategia..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Inicio
            </label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Fin
            </label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Color identificador
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full cursor-pointer transition-transform ${
                  color === c
                    ? "ring-2 ring-offset-2 ring-[var(--color-primary)] scale-110"
                    : "hover:scale-105 opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4 justify-end border-t border-[var(--color-border)]">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving
              ? "Guardando..."
              : editing
                ? "Guardar cambios"
                : "Crear campaña"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
