// @/components/admin/content/LinkDestinationSelector.tsx
"use client";

import { useMemo } from "react";
import { DropdownSelect, Input } from "@/components/ui";
import ResourceSearchTrigger from "@/components/admin/search/ResourceSearchTrigger";
import { LINK_TYPES } from "@/constants/siteContent";

export interface LinkDestinationValues {
  linkType: string;
  categoryId?: string | number | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  productId?: string | number | null;
  productName?: string | null;
  productSlug?: string | null;
  externalUrl?: string | null;
}

interface LinkDestinationSelectorProps {
  label?: string;
  values: LinkDestinationValues;
  allowedLinks?: string[];
  onChange: (updates: Partial<LinkDestinationValues>) => void;
  gridCols?: string;
}

export default function LinkDestinationSelector({
  label = "Destino del clic",
  values,
  allowedLinks,
  onChange,
  gridCols = "grid-cols-1 sm:grid-cols-2",
}: LinkDestinationSelectorProps) {
  const options = useMemo(() => {
    if (!allowedLinks) return LINK_TYPES;
    return LINK_TYPES.filter((lt) => allowedLinks.includes(lt.value));
  }, [allowedLinks]);

  const handleLinkTypeChange = (newType: string) => {
    if (newType === values.linkType) return;

    // Al alternar el tipo, limpiamos los campos del tipo anterior
    onChange({
      linkType: newType,
      categoryId: "",
      categoryName: "",
      categorySlug: "",
      productId: "",
      productName: "",
      productSlug: "",
      externalUrl: "",
    });
  };

  return (
    <div className={`grid ${gridCols} gap-3 pt-1`}>
      <div>
        <DropdownSelect
          label={label}
          value={values.linkType || "none"}
          onChange={handleLinkTypeChange}
          options={options}
          placeholder="Seleccionar destino..."
        />
      </div>

      {values.linkType === "category" && (
        <ResourceSearchTrigger
          label="Categoría destino"
          scope="categories"
          status="active"
          selectedId={values.categoryId}
          selectedName={values.categoryName}
          onSelect={(cat) =>
            onChange({
              categoryId: cat.id,
              categoryName: cat.name,
              categorySlug: cat.slug,
            })
          }
          onClear={() =>
            onChange({
              categoryId: "",
              categoryName: "",
              categorySlug: "",
            })
          }
        />
      )}

      {values.linkType === "product" && (
        <ResourceSearchTrigger
          label="Producto destino"
          scope="products"
          status="active"
          selectedId={values.productId}
          selectedName={values.productName}
          onSelect={(prod) =>
            onChange({
              productId: prod.id,
              productName: prod.name,
              productSlug: prod.slug,
            })
          }
          onClear={() =>
            onChange({
              productId: "",
              productName: "",
              productSlug: "",
            })
          }
        />
      )}

      {values.linkType === "external" && (
        <Input
          label="URL Externa"
          value={values.externalUrl || ""}
          onChange={(e) => onChange({ externalUrl: e.target.value })}
          placeholder="https://..."
          required
        />
      )}
    </div>
  );
}
