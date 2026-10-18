// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileSpreadsheet,
  Image as ImageIcon,
} from "lucide-react";
import {
  Table,
  Spinner,
  Modal,
  DropdownSelect,
  Button,
  Pagination,
} from "@/components/ui";
import BulkProductModal from "@/components/admin/BulkProductModal";
import BulkUpdateModal from "@/components/admin/BulkUpdateModal";
import SystemUpdateModal from "@/components/admin/SystemUpdateModal";
import { formatPrice } from "@/utils/formatData";
import { useProducts } from "@/hooks/admin-useProducts";
import { useCategories } from "@/hooks/admin-useCategories";
import { useTags } from "@/hooks/admin-useTags";
import { useAlert } from "@/context/AlertContext";
import api from "@/services/admin-api";
import { PRODUCTS_PAGE_SIZE, PRODUCT_MESSAGES } from "@/constants/products";
import ProductBulkActionsBar from "@/components/admin/ProductBulkActionsBar";

export default function Products() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const Alert = useAlert();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState(
    () => searchParams?.get("categoryId") || "",
  );
  const [tagId, setTagId] = useState(() => searchParams?.get("tagId") || "");
  const [page, setPage] = useState(
    () => Number(searchParams?.get("page")) || 1,
  );

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [systemUpdateOpen, setSystemUpdateOpen] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [excelMenuOpen, setExcelMenuOpen] = useState(false);
  const excelMenuRef = useRef<HTMLDivElement>(null);
  const newMenuRef = useRef<HTMLDivElement>(null);
  const editMenuRef = useRef<HTMLDivElement>(null);

  // Debounce de búsqueda para proteger peticiones a la API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        excelMenuRef.current &&
        !excelMenuRef.current.contains(event.target as Node)
      ) {
        setExcelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Manejo de clicks fuera de los popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        newMenuRef.current &&
        !newMenuRef.current.contains(event.target as Node)
      ) {
        setNewMenuOpen(false);
      }
      if (
        editMenuRef.current &&
        !editMenuRef.current.contains(event.target as Node)
      ) {
        setEditMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const params = {
    page,
    limit: PRODUCTS_PAGE_SIZE,
    search: debouncedSearch,
    ...(categoryId && { categoryId }),
    ...(tagId && { tagId }),
  };

  const { products, total, totalPages, loading, refetch, updateProduct } =
    useProducts(params);
  const { categories } = useCategories();
  const { tags } = useTags();

  useEffect(() => {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    sp.set("page", String(page));
    if (categoryId) sp.set("categoryId", categoryId);
    else sp.delete("categoryId");
    if (tagId) sp.set("tagId", tagId);
    else sp.delete("tagId");
    router.replace(`/dashboard/products?${sp.toString()}`);
  }, [page, categoryId, tagId]);

  const handleToggleStatus = async (e, product) => {
    e.stopPropagation();
    const newStatus = product.status === "active" ? "draft" : "active";
    setToggling(product.id);
    try {
      await api.patch(`/admin/products/${product.id}/status`, {
        status: newStatus,
      });
      updateProduct(product.id, { status: newStatus });
    } catch {
      Alert.fire({ message: PRODUCT_MESSAGES.STATUS_ERROR, type: "error" });
    } finally {
      setToggling(null);
    }
  };

  const handleBulkDelete = async () => {
    const result = await Alert.fire({
      title: PRODUCT_MESSAGES.BULK_DELETE_TITLE,
      message: PRODUCT_MESSAGES.BULK_DELETE_TEXT(selected.length),
      type: "warning",
      variant: "modal",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    setBulkProcessing(true);
    try {
      const results = await Promise.allSettled(
        selected.map((id) => api.delete(`/admin/products/${id}`)),
      );

      const fulfilled = results.filter((r) => r.status === "fulfilled").length;
      const rejected = results.filter((r) => r.status === "rejected").length;

      if (rejected === 0) {
        Alert.fire({
          message: PRODUCT_MESSAGES.BULK_DELETE_SUCCESS(fulfilled),
          type: "success",
        });
      } else {
        Alert.fire({
          message: PRODUCT_MESSAGES.BULK_DELETE_PARTIAL(fulfilled, rejected),
          type: "warning",
        });
      }

      setSelected([]);
      refetch();
    } catch {
      Alert.fire({
        message: PRODUCT_MESSAGES.BULK_DELETE_ERROR,
        type: "error",
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleSelectAll = async () => {
    const currentIds = new Set(products.map((p) => p.id));
    const outsideCount = selected.filter((id) => !currentIds.has(id)).length;
    const allCurrentSelected =
      products.length > 0 && products.every((p) => selected.includes(p.id));

    if (outsideCount > 0) {
      const action = allCurrentSelected
        ? "se borrará toda la selección (incluidos los de otras páginas)"
        : "se reemplazará la selección actual por la de esta página";

      const result = await Alert.fire({
        title: PRODUCT_MESSAGES.SELECTION_REPLACE_TITLE,
        message: PRODUCT_MESSAGES.SELECTION_REPLACE_TEXT(outsideCount, action),
        type: "warning",
        variant: "modal",
        showCancelButton: true,
        confirmButtonText: "Continuar",
        cancelButtonText: "Cancelar",
      });
      if (!result.isConfirmed) return;
    }

    if (allCurrentSelected) setSelected([]);
    else setSelected(products.map((p) => p.id));
  };

  const handleDelete = async (product) => {
    const result = await Alert.fire({
      title: PRODUCT_MESSAGES.DELETE_CONFIRM_TITLE,
      message: PRODUCT_MESSAGES.DELETE_CONFIRM_TEXT(product.name),
      type: "warning",
      variant: "modal",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/admin/products/${product.id}`);
      refetch();
    } catch {
      Alert.fire({ message: "Error al eliminar producto", type: "error" });
    }
  };

  const buildProductUrl = (productId: string) => {
    const query = new URLSearchParams();
    query.set("page", String(page));
    if (categoryId) query.set("categoryId", categoryId);
    if (tagId) query.set("tagId", tagId);
    return `/dashboard/products/${productId}?${query.toString()}`;
  };

  const columns = [
    {
      header: "Producto",
      className: "min-w-[260px]",
      accessor: (p) => (
        <div className="flex items-center gap-3">
          {p.images?.[0] ? (
            <img
              src={p.images[0]}
              alt=""
              className="w-10 h-10 min-w-10 rounded-lg object-cover bg-[var(--color-bg-base)] border border-[var(--color-border)] shrink-0"
            />
          ) : (
            <div className="w-10 h-10 min-w-10 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center shrink-0 text-[var(--color-text-muted)]">
              <ImageIcon className="w-5 h-5 opacity-40" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
              {p.name}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] truncate">
              /{p.slug}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Categoría",
      accessor: (p) => (
        <span className="text-sm text-[var(--color-text-secondary)]">
          {p.category?.name || "—"}
        </span>
      ),
    },
    {
      header: "Etiquetas",
      className: "max-w-[180px]",
      accessor: (p) => {
        const tv = p.tagValues || [];
        if (tv.length === 0) {
          return <span className="text-[var(--color-text-muted)]">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {tv.slice(0, 3).map((item) => (
              <span
                key={item.id}
                className="text-xs px-2 py-0.5 rounded-full border font-medium"
                style={{
                  backgroundColor: `${item.tag?.color || "#6366f1"}15`,
                  color: item.tag?.color || "var(--color-primary-text)",
                  borderColor: `${item.tag?.color || "#6366f1"}35`,
                }}
              >
                {item.value}
              </span>
            ))}
            {tv.length > 3 && (
              <span className="text-xs text-[var(--color-text-muted)] font-medium self-center">
                +{tv.length - 3}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Precio",
      accessor: (p) => (
        <span className="font-semibold text-sm text-[var(--color-text-primary)]">
          {formatPrice(p.retailPrice)}
        </span>
      ),
    },
    {
      header: "Variantes",
      accessor: (p) => (
        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]">
          {(p.skus || []).filter((s) => s.attributeValues?.length > 0).length}
        </span>
      ),
    },
    {
      header: "Estado",
      accessor: (p) => (
        <button
          type="button"
          onClick={(e) => handleToggleStatus(e, p)}
          disabled={toggling === p.id}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer w-[96px] justify-center shrink-0 ${
            p.status === "active"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
          } disabled:opacity-50`}
        >
          {toggling === p.id ? (
            <Spinner size="sm" />
          ) : (
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                p.status === "active" ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          )}
          {p.status === "active" ? "Activo" : "Borrador"}
        </button>
      ),
    },
    {
      header: "Acciones",
      accessor: (p) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(buildProductUrl(p.id));
            }}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-bg-elevated)] transition-colors cursor-pointer"
            title="Editar producto"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(p);
            }}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Eliminar producto"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Productos
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            {total} productos en catálogo
          </p>
        </div>

        {/* Acciones de Cabecera: Crear + Dropdown Planillas */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            onClick={() => router.push("/dashboard/products/new")}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </Button>

          {/* Menú Dropdown Planillas Excel */}
          <div className="relative" ref={excelMenuRef}>
            <button
              type="button"
              onClick={() => setExcelMenuOpen(!excelMenuOpen)}
              className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              title="Operaciones con planilla Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            </button>

            {excelMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-xl z-30 p-1.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setExcelMenuOpen(false);
                    setBulkOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors cursor-pointer text-left"
                >
                  <Plus className="w-4 h-4 text-emerald-500" />
                  <span>Creación con planilla</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExcelMenuOpen(false);
                    setBulkUpdateOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors cursor-pointer text-left"
                >
                  <FileSpreadsheet className="w-4 h-4 text-cyan-500" />
                  <span>Edición con planilla</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1 w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Buscar por nombre o slug..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 md:flex md:gap-3">
          <DropdownSelect
            options={[
              { value: "", label: "Todas las categorías" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={categoryId}
            onChange={(v) => {
              setCategoryId(v);
              setPage(1);
            }}
            className="w-full md:w-52"
          />
          <DropdownSelect
            options={[
              { value: "", label: "Todas las etiquetas" },
              ...tags.flatMap((t) =>
                (t.values || []).map((v) => ({
                  value: v.id,
                  label: `${t.name}: ${v.value}`,
                })),
              ),
            ]}
            value={tagId}
            onChange={(v) => {
              setTagId(v);
              setPage(1);
            }}
            className="w-full md:w-52"
          />
        </div>
      </div>

      {/* Barra de Acciones Masivas (solo sobre filas tildadas) */}
      <ProductBulkActionsBar
        selectedCount={selected.length}
        onOpenSystemUpdate={() => setSystemUpdateOpen(true)}
        onBulkDelete={handleBulkDelete}
        isProcessing={bulkProcessing}
      />

      {/* Tabla */}
      <div className="relative min-h-[220px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-bg-base)]/60 backdrop-blur-xs">
            <Spinner size="lg" />
          </div>
        )}

        <Table
          columns={columns}
          data={products}
          onRowClick={(p) => router.push(buildProductUrl(p.id))}
          emptyMessage="No hay productos que coincidan con la búsqueda"
          selectable
          selected={selected}
          onSelectionChange={setSelected}
          onSelectAll={handleSelectAll}
        />
      </div>

      {/* Floating / Sticky Footer Pagination */}
      <div className="sticky bottom-0 left-0 right-0 p-3  bg-[var(--color-bg-base)]/80 backdrop-blur-md border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--color-text-muted)] z-10 transition-colors">
        <span>
          Mostrando {(page - 1) * PRODUCTS_PAGE_SIZE + 1}–
          {Math.min(page * PRODUCTS_PAGE_SIZE, total)} de {total} productos
        </span>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* Modales */}
      <BulkProductModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        categories={categories}
        onCreated={refetch}
      />

      <BulkUpdateModal
        open={bulkUpdateOpen}
        onClose={() => setBulkUpdateOpen(false)}
        onUpdated={refetch}
      />

      <SystemUpdateModal
        open={systemUpdateOpen}
        onClose={() => setSystemUpdateOpen(false)}
        selectedIds={selected}
        categories={categories}
        onUpdated={() => {
          refetch();
          setSelected([]);
        }}
      />

      <Modal
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="Más acciones"
      >
        <div className="text-center py-8 text-sm text-[var(--color-text-secondary)]">
          Próximamente más operaciones por lote y reportes para tu catálogo.
        </div>
      </Modal>
    </div>
  );
}
