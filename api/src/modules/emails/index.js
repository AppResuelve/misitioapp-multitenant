const { sendEmail } = require("./services/email.sender");

module.exports = {
  sendEmail,
  TYPES: {
    WELCOME: "WELCOME",
    RECOVERY: "RECOVERY",
    SUBSCRIPTION_EXPIRING_SOON: "SUBSCRIPTION_EXPIRING_SOON",
    ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
    CONTACT_FORM: "CONTACT_FORM",
  },
};
