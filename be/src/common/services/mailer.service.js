const nodemailer = require('nodemailer');

let transporter;

const asBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
};

const asInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error) => {
  if (!error) return false;
  const retryableCodes = new Set(['ETIMEDOUT', 'ECONNECTION', 'ECONNRESET', 'ESOCKET', 'EAI_AGAIN']);
  if (retryableCodes.has(error.code)) return true;
  if (typeof error.responseCode === 'number' && error.responseCode >= 500) return true;
  return false;
};

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = asBool(process.env.SMTP_SECURE, false);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration is missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.');
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  return transporter;
};

const sendMail = async ({ to, subject, text }) => {
  if (!to) throw new Error('Email recipient is required.');

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  if (!from) throw new Error('MAIL_FROM or SMTP_USER must be configured.');

  const smtp = getTransporter();
  const retries = Math.max(0, asInt(process.env.MAIL_SEND_MAX_RETRIES, 2));
  const retryDelayMs = Math.max(100, asInt(process.env.MAIL_SEND_RETRY_DELAY_MS, 800));

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await smtp.sendMail({
        from,
        to,
        subject,
        text
      });
    } catch (error) {
      lastError = error;
      const canRetry = attempt < retries && isRetryableError(error);
      if (!canRetry) break;
      await wait(retryDelayMs * (attempt + 1));
    }
  }

  throw lastError;
};

module.exports = { sendMail };
