// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Image as ImageIcon, SlidersHorizontal } from "lucide-react";
import {
  Button,
  Input,
  TiptapEditor,
  DropdownSelect,
  Card,
  Spinner,
} from "@/components/ui";
import ImageUpload from "@/components/admin/ImageUpload";
import { TagSelect } from "@/components/admin/TagSelect";

import SkuCard from "@/components/admin/products/SkuCard";
import ProductPricingSection from "@/components/admin/products/ProductPricingSection";
import ProductAttributesModal from "@/components/admin/products/ProductAttributesModal";
import ProductSkuPriceModal from "@/components/admin/products/ProductSkuPriceModal";

import { useProduct } from "@/hooks/admin-useProducts";
import { useCategories } from "@/hooks/admin-useCategories";
import { useTags } from "@/hooks/admin-useTags";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";
import { useAlert } from "@/context/AlertContext";
import { calculateComparePrice } from "@/utils/discount";
import { slugify } from "@/utils/slugify";
import api from "@/services/admin-api";

import { EMPTY_PRODUCT, PRODUCT_FORM_MESSAGES } from "@/constants/productForm";
import {
  generateSkuCombinations,
  detectSkusAtRisk,
  checkUnsyncedAttributes,
} from "@/utils/productVariations";

export default function ProductForm() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const Alert = useAlert();
  const { setIsDirty, confirmLeave } = useUnsavedChanges();

  const backParams = new URLSearchParams();
  const pageVal = searchParams?.get("page");
  const catVal = searchParams?.get("categoryId");
  const tagVal = searchParams?.get("tagId");
  if (pageVal) backParams.set("page", pageVal);
  if (catVal) backParams.set("categoryId", catVal);
  if (tagVal) backParams.set("tagId", tagVal);
  const backToList = `/dashboard/products?${backParams.toString()}`;

  const isEditing = Boolean(id) && id !== "new";
  const { product, loading: productLoading } = useProduct(id);
  const { categories } = useCategories();
  const { tags } = useTags();

  // Estados principales
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [skus, setSkus] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [tagIds, setTagIds] = useState([]);
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modales
  const [attrModalOpen, setAttrModalOpen] = useState(false);
  const [modalAttrs, setModalAttrs] = useState({});
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceDefaults, setPriceDefaults] = useState({
    retail: true,
    wholesale: true,
  });

  useEffect(() => {
    api
      .get("/admin/attributes")
      .then(({ data }) => setAttributes(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        slug: product.slug || "",
        description: product.description || "",
        images: product.images || [],
        retailPrice: product.retailPrice || 0,
        comparePrice: product.comparePrice || null,
        discountPercentage: product.discountPercentage || null,
        wholesalePrice: product.wholesalePrice || null,
        wholesaleMinQty: product.wholesaleMinQty || null,
        stock:
          product.skus?.find((s) => !s.attributeValues?.length)?.stock ?? 0,
        status: product.status || "active",
        tags: product.tags || [],
        categoryId: product.categoryId || "",
      });
      setTagIds(product.tagValues?.map((tv) => tv.id) || []);
      setSlugManual(true);

      if (product.skus?.length > 0) {
        const realSkus = product.skus.filter(
          (s) => s.attributeValues?.length > 0,
        );
        if (realSkus.length > 0) {
          const inferredAttrs = {};
          realSkus.forEach((sku) => {
            sku.attributeValues.forEach((av) => {
              const aId = av.attribute?.id;
              if (!aId) return;
              if (!inferredAttrs[aId]) inferredAttrs[aId] = new Set();
              inferredAttrs[aId].add(av.id);
            });
          });
          setSelectedAttributes(inferredAttrs);
          setSkus(
            realSkus.map((s) => ({
              id: s.id,
              retailPrice: s.retailPrice || 0,
              wholesalePrice: s.wholesalePrice ?? null,
              wholesaleMinQty: s.wholesaleMinQty ?? null,
              stock: s.stock || 0,
              sku: s.sku || "",
              images: s.images || [],
              sortOrder: Number(s.sortOrder) || 0,
              status: s.status || "active",
              attributeValueIds: (s.attributeValues || []).map((v) => v.id),
            })),
          );
        } else {
          setSkus([]);
        }
      }
    }
  }, [product]);

  const handleChange = (field: string, value: any) => {
    const next = { ...form, [field]: value };
    if (field === "name" && !slugManual) next.slug = slugify(value);
    if (field === "retailPrice" || field === "discountPercentage") {
      const retail =
        field === "retailPrice" ? Number(value) : Number(form.retailPrice);
      const pct =
        field === "discountPercentage"
          ? Number(value)
          : Number(form.discountPercentage);
      next.comparePrice = calculateComparePrice(retail, pct);
    }
    setForm(next);
    setIsDirty(true);
  };

  const openAttrModal = () => {
    const copy = {};
    Object.entries(selectedAttributes).forEach(([k, v]) => {
      copy[Number(k)] = new Set(v);
    });
    setModalAttrs(copy);
    setAttrModalOpen(true);
  };

  const handleConfirmAttrs = async () => {
    const emptyAttr = Object.entries(modalAttrs).find(
      ([, vIds]) => vIds.size === 0,
    );
    if (emptyAttr) {
      const attr = attributes.find((a) => a.id === Number(emptyAttr[0]));
      await Alert.fire({
        message: PRODUCT_FORM_MESSAGES.ATTR_SELECT_VALUE_WARNING(
          attr?.name || "el atributo",
        ),
        type: "warning",
        variant: "banner",
      });
      return;
    }

    if (Object.keys(modalAttrs).length === 0) {
      setIsDirty(true);
      setSelectedAttributes({});
      setSkus([]);
      setAttrModalOpen(false);
      return;
    }

    const confirmed = {};
    for (const [k, v] of Object.entries(modalAttrs)) {
      confirmed[Number(k)] = new Set(v);
    }

    if (skus.length === 0) {
      setSelectedAttributes(confirmed);
      setAttrModalOpen(false);
      setShowPriceModal(true);
      return;
    }

    const nextSkus = generateSkuCombinations({
      productName: form.name,
      attributesMap: confirmed,
      allAttributes: attributes,
      existingSkus: skus,
      basePrice: Number(form.retailPrice) || 0,
      wholesalePrice: form.wholesalePrice,
      wholesaleMinQty: form.wholesaleMinQty,
      keepPriceDefaults: false,
    });

    const skusAtRisk = detectSkusAtRisk(skus, nextSkus);
    if (skusAtRisk.length > 0) {
      const result = await Alert.fire({
        title: PRODUCT_FORM_MESSAGES.CONFIRM_DELETE_SKUS_TITLE,
        message: PRODUCT_FORM_MESSAGES.CONFIRM_DELETE_SKUS_TEXT(
          skusAtRisk.length,
        ),
        type: "warning",
        variant: "modal",
        showCancelButton: true,
        confirmButtonText: "Actualizar",
        cancelButtonText: "Cancelar",
      });
      if (!result.isConfirmed) return;
    }

    setSelectedAttributes(confirmed);
    setSkus(nextSkus);
    setAttrModalOpen(false);
    setIsDirty(true);
  };

  const handleApplyInitialPriceDefaults = () => {
    const nextSkus = generateSkuCombinations({
      productName: form.name,
      attributesMap: selectedAttributes,
      allAttributes: attributes,
      existingSkus: skus,
      basePrice: Number(form.retailPrice) || 0,
      wholesalePrice: form.wholesalePrice,
      wholesaleMinQty: form.wholesaleMinQty,
      keepPriceDefaults: true,
      priceDefaults,
    });
    setSkus(nextSkus);
    setShowPriceModal(false);
    setIsDirty(true);
  };

  const hasUnsyncedChanges = checkUnsyncedAttributes(selectedAttributes, skus);

  const updateSku = (i: number, updatedSku: any) => {
    const nx = [...skus];
    nx[i] = updatedSku;
    setSkus(nx);
    setIsDirty(true);
  };

  const removeSku = (i: number) => {
    setSkus(skus.filter((_, idx) => idx !== i));
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      Alert.fire({
        message: PRODUCT_FORM_MESSAGES.NAME_REQUIRED,
        type: "warning",
      });
      return;
    }
    if (!form.slug.trim()) handleChange("slug", slugify(form.name));

    if (hasUnsyncedChanges) {
      Alert.fire({
        message: PRODUCT_FORM_MESSAGES.UNSYNCED_ATTRIBUTES,
        type: "warning",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        categoryId: form.categoryId || null,
        tagIds,
        retailPrice: Number(form.retailPrice) || 0,
        comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
        discountPercentage: form.discountPercentage
          ? Number(form.discountPercentage)
          : null,
        wholesalePrice: form.wholesalePrice
          ? Number(form.wholesalePrice)
          : null,
        wholesaleMinQty: form.wholesaleMinQty
          ? Number(form.wholesaleMinQty)
          : null,
        stock: Number(form.stock) || 0,
        skus: skus.map((s) => ({
          ...(s.id && { id: s.id }),
          retailPrice: Number(s.retailPrice) || 0,
          wholesalePrice: s.wholesalePrice ? Number(s.wholesalePrice) : null,
          wholesaleMinQty: s.wholesaleMinQty ? Number(s.wholesaleMinQty) : null,
          stock: Number(s.stock) || 0,
          sku: s.sku || null,
          images: s.images || [],
          sortOrder: Number(s.sortOrder) || 0,
          status: s.status || "active",
          attributeValueIds: s.attributeValueIds || [],
        })),
      };

      if (isEditing) await api.put(`/admin/products/${id}`, payload);
      else await api.post("/admin/products", payload);

      Alert.fire({
        message: isEditing
          ? PRODUCT_FORM_MESSAGES.SAVE_SUCCESS_EDIT
          : PRODUCT_FORM_MESSAGES.SAVE_SUCCESS_NEW,
        type: "success",
        duration: 1500,
      });

      setIsDirty(false);
      router.push(backToList);
    } catch (err: any) {
      Alert.fire({
        message: err.response?.data?.error || PRODUCT_FORM_MESSAGES.SAVE_ERROR,
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (productLoading && isEditing) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-30 sm:pb-68">
      {/* Botón Volver */}
      <button
        type="button"
        onClick={async () => {
          if (await confirmLeave()) router.push(backToList);
        }}
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a productos</span>
      </button>

      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {isEditing ? `Editar ${form.name || "Producto"}` : "Nuevo Producto"}
          </h1>
        </div>

        {/* Layout en 2 columnas: Principal (2 cols) y Lateral Sticky (1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Columna Izquierda: Información Principal y Variantes */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-5">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Detalles generales
              </h2>

              <Input
                label="Nombre del producto"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Torta Velvet, Cookies New York..."
                required
              />

              <Input
                label="Slug (URL amigable)"
                value={form.slug}
                onChange={(e) => {
                  setSlugManual(true);
                  handleChange("slug", slugify(e.target.value));
                }}
                placeholder="nombre-del-producto"
                required
              />

              <TiptapEditor
                label="Descripción"
                value={form.description || ""}
                onChange={(val) => handleChange("description", val)}
                placeholder="Descripción detallada del producto que verán tus clientes..."
                maxLength={2000}
              />
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Imágenes del producto
              </h2>
              <ImageUpload
                images={form.images}
                onChange={(imgs) => handleChange("images", imgs)}
                max={4}
                folder="productos"
              />
            </Card>

            {/* Variantes / SKUs */}
            <Card className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Variantes
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {Object.keys(selectedAttributes).length > 0
                      ? Object.entries(selectedAttributes)
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(
                            ([aId]) =>
                              attributes.find((a) => a.id === Number(aId))
                                ?.name,
                          )
                          .filter(Boolean)
                          .join(", ")
                      : "Sin atributos configurados"}
                    {" • "}
                    {skus.length} variante(s)
                  </p>
                  {hasUnsyncedChanges && (
                    <span className="text-xs text-amber-500 dark:text-amber-400 mt-1 block font-medium">
                      Los atributos cambiaron. Abrí el administrador para
                      regenerar las variantes.
                    </span>
                  )}
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={openAttrModal}
                  className="gap-2 shrink-0 self-start sm:self-auto"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Administrar atributos</span>
                </Button>
              </div>

              <div className="space-y-2 pt-2">
                {skus.map((sku, i) => (
                  <SkuCard
                    key={sku.id || i}
                    sku={sku}
                    index={i}
                    attributes={attributes}
                    unitType={product?.unitType}
                    onChange={updateSku}
                    onRemove={removeSku}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* Columna Derecha: Sticky con Precios, Organización y Tags */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
            <Card className="p-6 space-y-4">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Precios e inventario
              </h2>
              <ProductPricingSection
                form={form}
                onChange={handleChange}
                hasSkus={skus.length > 0}
                skus={skus}
                unitType={product?.unitType}
              />
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Organización
              </h2>
              <DropdownSelect
                label="Estado"
                value={form.status}
                onChange={(v) => handleChange("status", v)}
                options={[
                  { value: "active", label: "Activo" },
                  { value: "draft", label: "Borrador" },
                ]}
              />

              <DropdownSelect
                label="Categoría"
                value={form.categoryId}
                onChange={(v) => handleChange("categoryId", v)}
                options={[
                  { value: "", label: "Sin categoría" },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />

              <div className="pt-2 border-t border-[var(--color-border)]">
                <TagSelect tags={tags} selected={tagIds} onChange={setTagIds} />
              </div>
            </Card>
          </div>
        </div>

        {/* Barra Flotante de Acciones */}
        <div className="fixed bottom-0 left-0 right-0 z-30 py-3 px-6 bg-[var(--color-bg-base)]/85 backdrop-blur-md border-t border-[var(--color-border)] shadow-lg flex justify-end gap-3 transition-colors">
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              if (await confirmLeave()) router.push(backToList);
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : "Crear producto"}
          </Button>
        </div>
      </form>

      {/* Modales */}
      <ProductAttributesModal
        open={attrModalOpen}
        onClose={() => setAttrModalOpen(false)}
        onConfirm={handleConfirmAttrs}
        attributes={attributes}
        setAttributes={setAttributes}
        modalAttrs={modalAttrs}
        setModalAttrs={setModalAttrs}
      />

      <ProductSkuPriceModal
        open={showPriceModal}
        onClose={() => setShowPriceModal(false)}
        onConfirm={handleApplyInitialPriceDefaults}
        formRetailPrice={form.retailPrice}
        formWholesalePrice={form.wholesalePrice}
        formWholesaleMinQty={form.wholesaleMinQty}
        priceDefaults={priceDefaults}
        onChangeDefaults={setPriceDefaults}
        combinationsCount={Object.values(selectedAttributes).reduce(
          (acc, v) => acc * (v.size || 1),
          1,
        )}
      />
    </div>
  );
}
