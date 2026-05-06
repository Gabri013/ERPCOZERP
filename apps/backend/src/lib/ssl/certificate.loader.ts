import https from 'https';
import * as forge from 'node-forge';

interface CertInfo {
  pem: string;
  notBefore: Date;
  notAfter: Date;
  cnpj?: string;
}

const CERT_BASE64 = process.env.NFE_CERT_BASE64 || '';
const CERT_PASSWORD = process.env.NFE_CERT_PASSWORD || '';

let cachedAgent: https.Agent | null = null;
let cachedInfo: CertInfo | null | undefined = undefined;

function decodeBase64ToBuffer(b64: string): Buffer | null {
  if (!b64) return null;
  return Buffer.from(b64, 'base64');
}

function tryParsePfx(buffer: Buffer, password: string): CertInfo | null {
  try {
    const binary = buffer.toString('binary');
    const asn1 = forge.asn1.fromDer(binary);
    const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);
    const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBags = bags[forge.pki.oids.certBag] || [];
    if (!certBags.length) return null;
    // take first cert
    const certObj = certBags[0].cert as forge.pki.Certificate;
    const pem = forge.pki.certificateToPem(certObj);
    const notBefore = certObj.validity.notBefore;
    const notAfter = certObj.validity.notAfter;
    // try to extract CNPJ-like value from subject or extensions
    const attrs = certObj.subject.attributes || [];
    const joined = attrs.map(a => a.value).join(' ');
    const cnpjMatch = joined.match(/(\d{14})/);
    const cnpj = cnpjMatch ? cnpjMatch[1] : undefined;
    return { pem, notBefore, notAfter, cnpj };
  } catch (err) {
    return null;
  }
}

export function getHttpsAgent(): https.Agent | null {
  if (cachedAgent !== null) return cachedAgent;
  const buf = decodeBase64ToBuffer(CERT_BASE64);
  if (!buf) {
    cachedAgent = null;
    return null;
  }
  // create agent with pfx buffer and passphrase
  cachedAgent = new https.Agent({ pfx: buf, passphrase: CERT_PASSWORD, keepAlive: true });
  return cachedAgent;
}

export function validateCertificate(): { valid: boolean; expiresAt?: Date; notBefore?: Date; cnpj?: string; reason?: string } {
  if (cachedInfo === undefined) {
    cachedInfo = null;
    const buf = decodeBase64ToBuffer(CERT_BASE64);
    if (!buf) return { valid: true }; // no cert configured
    const info = tryParsePfx(buf, CERT_PASSWORD);
    if (!info) return cachedInfo = null;
    cachedInfo = info;
  }

  if (!cachedInfo) return { valid: false, reason: 'Failed to parse certificate' };
  const now = new Date();
  if (cachedInfo.notAfter < now) return { valid: false, expiresAt: cachedInfo.notAfter, notBefore: cachedInfo.notBefore, cnpj: cachedInfo.cnpj, reason: 'Certificate expired' };
  return { valid: true, expiresAt: cachedInfo.notAfter, notBefore: cachedInfo.notBefore, cnpj: cachedInfo.cnpj };
}

export function getCertificatePem(): string | null {
  if (cachedInfo === undefined) validateCertificate();
  return cachedInfo ? cachedInfo.pem : null;
}
