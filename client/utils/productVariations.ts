import { generateSkuCode } from "@/utils/skuGenerator";
import { EMPTY_SKU, UNIT_DIVISOR } from "@/constants/productForm";

export interface SkuCombinationParams {
  productName: string;
  attributesMap: Record<number, Set<number>>;
  allAttributes: any[];
  existingSkus: any[];
  basePrice: number;
  wholesalePrice?: number | null;
  wholesaleMinQty?: number | null;
  keepPriceDefaults?: boolean;
  priceDefaults?: { retail: boolean; wholesale: boolean };
}

/**
 * Genera el producto cartesiano de los atributos seleccionados,
 * preservando IDs y datos de variantes que ya existían.
 */
export function generateSkuCombinations({
  productName,
  attributesMap,
  allAttributes,
  existingSkus,
  basePrice,
  wholesalePrice = null,
  wholesaleMinQty = null,
  keepPriceDefaults = false,
  priceDefaults = { retail: true, wholesale: true },
}: SkuCombinationParams) {
  const groups = Object.entries(attributesMap)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, vIds]) => [...vIds])
    .filter((g) => g.length > 0);

  if (!groups.length) return [];

  // Producto cartesiano
  const combinations = groups.reduce(
    (acc, group) => acc.flatMap((combo) => group.map((vId) => [...combo, vId])),
    [[] as number[]],
  );

  const unitAttr = allAttributes.find((a) => a.unitType);
  const divisor = unitAttr ? UNIT_DIVISOR[unitAttr.unitType] : null;

  return combinations.map((combo) => {
    const sorted = [...combo].sort((a, b) => a - b);

    // Buscar si ya existía una variante con esta misma combinación exacta
    const existing = existingSkus.find((s) => {
      const sSorted = [...(s.attributeValueIds || [])].sort((a, b) => a - b);
      return (
        sSorted.length === sorted.length &&
        sSorted.every((vId, i) => vId === sorted[i])
      );
    });

    if (existing?.id) {
      return { ...existing, attributeValueIds: combo };
    }

    // Calcular precio por unidad si aplica
    let retailPrice = keepPriceDefaults && priceDefaults.retail ? basePrice : 0;
    if (divisor && unitAttr && basePrice > 0) {
      const unitValueId = combo.find((vId) =>
        unitAttr.values.some((v: any) => v.id === vId),
      );
      if (unitValueId) {
        const unitVal = unitAttr.values.find((v: any) => v.id === unitValueId);
        const parsedVal = parseFloat(unitVal?.value);
        if (!isNaN(parsedVal) && parsedVal > 0) {
          retailPrice = (parsedVal / divisor) * basePrice;
        }
      }
    }

    return {
      ...EMPTY_SKU,
      images: [],
      attributeValueIds: combo,
      sku: generateSkuCode(productName, combo, allAttributes),
      retailPrice,
      wholesalePrice:
        keepPriceDefaults && priceDefaults.wholesale ? wholesalePrice : null,
      wholesaleMinQty:
        keepPriceDefaults && priceDefaults.wholesale ? wholesaleMinQty : null,
    };
  });
}

/**
 * Detecta qué variantes persistidas en BD se van a eliminar
 * si se confirma la nueva selección de atributos.
 */
export function detectSkusAtRisk(currentSkus: any[], nextSkus: any[]): any[] {
  return currentSkus.filter(
    (s) =>
      s.id &&
      !nextSkus.some((ns) => {
        const sSorted = [...(s.attributeValueIds || [])].sort((a, b) => a - b);
        const nsSorted = [...(ns.attributeValueIds || [])].sort(
          (a, b) => a - b,
        );
        return (
          sSorted.length === nsSorted.length &&
          sSorted.every((vId, i) => vId === nsSorted[i])
        );
      }),
  );
}

/**
 * Verifica si la cantidad de variantes generadas coincide exactamente
 * con la combinatoria de valores de atributos seleccionados.
 */
export function checkUnsyncedAttributes(
  selectedAttributes: Record<number, Set<number>>,
  skus: any[],
): boolean {
  if (!Object.keys(selectedAttributes).length) return false;

  const withValues = Object.entries(selectedAttributes).filter(
    ([, vIds]) => vIds.size > 0,
  );

  if (!withValues.length) return skus.length > 0;

  const expectedCount = withValues.reduce(
    (acc, [, vIds]) => acc * vIds.size,
    1,
  );

  return skus.length !== expectedCount;
}
