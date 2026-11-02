// utils/campaignValidation.js
const { Campaign } = require("../models");

/**
 * Valida que una campaña permita que sus elementos hijos estén en 'active'.
 * Si ya se tiene la instancia de campaign cargada (por ejemplo vía eager loading),
 * se evita hacer una query adicional a la base de datos.
 */
const assertCampaignAllowsActive = async (
  tenantId,
  campaignId,
  preloadedCampaign = null,
) => {
  if (!campaignId) return;

  let campaign = preloadedCampaign;

  // Si no vino pre-cargada o no coincide el ID, la buscamos
  if (!campaign || String(campaign.id) !== String(campaignId)) {
    campaign = await Campaign.findOne({
      where: { tenantId, id: campaignId },
      attributes: ["id", "name", "status"],
    });
  }

  if (!campaign) {
    throw Object.assign(new Error("La campaña asociada no existe"), {
      status: 404,
    });
  }

  if (campaign.status === "draft") {
    throw Object.assign(
      new Error(
        `No podés activar este elemento porque la campaña "${campaign.name}" está en borrador. Activá la campaña primero.`,
      ),
      { status: 400 },
    );
  }

  if (campaign.status === "archived") {
    throw Object.assign(
      new Error(
        `No podés activar este elemento porque la campaña "${campaign.name}" está archivada.`,
      ),
      { status: 400 },
    );
  }
};

module.exports = { assertCampaignAllowsActive };
