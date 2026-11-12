import { join } from 'node:path';
import { LANGUAGE, type Language } from '@tanuki/contracts';
import {
  EMAIL_COLORS as C,
  EMAIL_IMAGE,
  type EmailContent,
  type EmailImage,
  type EmailMessage,
} from './models';

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const getImageCid = (image: EmailImage): string => `${image}@tanuki`;

const getAttachment = (image: EmailImage): EmailContent['attachments'][number] => ({
  filename: `${image}.png`,
  path: join(__dirname, 'assets', `${image}.png`),
  cid: getImageCid(image),
  contentType: 'image/png',
  contentDisposition: 'inline',
});

const getFontFaces = (appUrl: string): string => {
  const base = escapeHtml(`${appUrl.replace(/\/+$/, '')}/mail/fonts`);
  return `
    @font-face { font-family:'Golos Text';font-weight:400;src:url('${base}/golos-text-cyrillic-400-normal.woff2') format('woff2');unicode-range:U+0400-052F; }
    @font-face { font-family:'Golos Text';font-weight:600;src:url('${base}/golos-text-cyrillic-600-normal.woff2') format('woff2');unicode-range:U+0400-052F; }
    @font-face { font-family:'Golos Text';font-weight:400;src:url('${base}/golos-text-latin-400-normal.woff2') format('woff2');unicode-range:U+0000-00FF,U+2000-206F; }
    @font-face { font-family:'Golos Text';font-weight:600;src:url('${base}/golos-text-latin-600-normal.woff2') format('woff2');unicode-range:U+0000-00FF,U+2000-206F; }
    @font-face { font-family:'Unbounded';font-weight:600;src:url('${base}/unbounded-latin-600-normal.woff2') format('woff2'); }
    @font-face { font-family:'JetBrains Mono';font-weight:400;src:url('${base}/jetbrains-mono-latin-400-normal.woff2') format('woff2'); }
  `;
};

const getFallbackLink = (language: Language, url: string): string => {
  const link = `href="${escapeHtml(url)}" class="email-link" style="color:${C.LINK};text-decoration:underline;"`;
  switch (language) {
    case LANGUAGE.RU:
      return `Если кнопка не работает, <a ${link}>откройте ссылку в браузере</a>.`;
    case LANGUAGE.EN:
      return `If the button doesn't work, <a ${link}>open the link in your browser</a>.`;
  }
};

const getAction = (action: EmailMessage['action']): string => {
  if (!action) return '';
  return `<div style="margin:0 0 12px;"><a href="${escapeHtml(action.url)}" style="display:inline-block;box-sizing:border-box;max-width:100%;padding:12px 18px;border-radius:8px;background:${C.ACCENT};color:${C.ACTION_TEXT};text-decoration:none;font-size:14px;font-weight:400;line-height:20px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="color:inherit;font:inherit;"><tr>
      <td width="20" valign="middle" style="padding-right:8px;font-size:0;line-height:0;"><img src="cid:${getImageCid(action.icon)}" width="20" height="20" alt="" style="display:block;border:0;" /></td>
      <td valign="middle" style="font-size:14px;font-weight:400;line-height:20px;">${escapeHtml(action.label)}</td>
    </tr></table>
  </a></div>`;
};

const getDetail = (detail: EmailMessage['detail']): string => {
  if (!detail) return '';
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;table-layout:fixed;"><tr><td class="email-detail" style="padding:16px;background:${C.SUBTLE};border:1px solid ${C.BORDER};border-radius:8px;">
    <p class="email-secondary" style="margin:0 0 6px;color:${C.SECONDARY};font-size:12px;">${escapeHtml(detail.label)}</p>
    <p style="margin:0;font-size:14px;${detail.monospace ? "font-family:'JetBrains Mono',monospace;font-weight:400;" : 'font-weight:600;'}">${escapeHtml(detail.value)}</p>
  </td></tr></table>`;
};

const getCode = (code: EmailMessage['code']): string => {
  if (!code) return '';
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 12px;table-layout:fixed;"><tr><td class="email-detail" style="padding:16px;background:${C.SUBTLE};border:1px solid ${C.BORDER};border-radius:8px;">
    <p style="margin:0;font-family:'JetBrains Mono',monospace;font-size:30px;line-height:1.4;letter-spacing:6px;white-space:nowrap;">${escapeHtml(code)}</p>
  </td></tr></table>`;
};

// Таблицы, inline CSS и PNG вместо Mantine/SVG нужны именно почтовым клиентам.
export const buildEmailContent = (
  language: Language,
  message: EmailMessage,
  appUrl: string,
): EmailContent => {
  const paragraphs = message.paragraphs
    .map((text) => `<p style="margin:0 0 20px;">${escapeHtml(text)}</p>`)
    .join('');
  const expiry = message.expiry
    ? `<p class="email-secondary" style="margin:0;color:${C.SECONDARY};font-size:12px;line-height:18px;">${escapeHtml(message.expiry)}</p>`
    : '';
  const fallback = message.action
    ? `<p style="margin:16px 0 0;">${getFallbackLink(language, message.action.url)}</p>`
    : '';
  return {
    subject: message.subject,
    text: [
      message.title,
      ...message.paragraphs,
      ...(message.detail ? [`${message.detail.label}: ${message.detail.value}`] : []),
      ...(message.code ? [message.code] : []),
      ...(message.action ? [`${message.action.label}: ${message.action.url}`] : []),
      ...(message.expiry ? [message.expiry] : []),
      message.explanation,
    ].join('\n\n'),
    attachments: [
      getAttachment(EMAIL_IMAGE.LOGO),
      ...(message.action ? [getAttachment(message.action.icon)] : []),
    ],
    html: `<!doctype html><html lang="${language}"><head><meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="color-scheme" content="light dark" />
      <meta name="supported-color-schemes" content="light dark" />
      <title>${escapeHtml(message.subject)}</title>
      <style>
        :root { color-scheme:light dark;supported-color-schemes:light dark; }
        ${getFontFaces(appUrl)}
        @media (prefers-color-scheme:dark) {
          .email-background { background:${C.DARK_BACKGROUND} !important;color:${C.DARK_TEXT} !important; }
          .email-card { background:${C.DARK_SURFACE} !important;border-color:${C.DARK_BORDER} !important; }
          .email-detail { background:${C.DARK_SUBTLE} !important;border-color:${C.DARK_BORDER} !important; }
          .email-secondary { color:${C.DARK_SECONDARY} !important; }
          .email-footer { color:${C.DARK_SECONDARY} !important;border-color:${C.DARK_BORDER} !important; }
          .email-link { color:${C.DARK_LINK} !important; }
        }
      </style>
      <!--[if mso]><style>body,table,td,p,h1,a { font-family:Arial,sans-serif !important; }</style><![endif]-->
      </head>
      <body class="email-background" style="margin:0;padding:0;background:${C.BACKGROUND};color:${C.TEXT};font-family:'Golos Text',Arial,sans-serif;font-size:14px;line-height:1.6;overflow-wrap:anywhere;">
        <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(message.preheader)}</div>
        <table role="presentation" class="email-background" width="100%" cellspacing="0" cellpadding="0" style="background:${C.BACKGROUND};table-layout:fixed;"><tr><td style="padding:24px 16px 32px;">
          <!--[if mso]><table role="presentation" width="560" align="center"><tr><td><![endif]-->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" align="center" style="max-width:560px;table-layout:fixed;">
            <tr><td style="padding:8px 8px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                <td style="padding-right:10px;"><img src="cid:${getImageCid(EMAIL_IMAGE.LOGO)}" width="32" height="32" alt="" style="display:block;border:0;border-radius:6px;" /></td>
                <td style="font-family:'Unbounded',Arial,sans-serif;font-size:16px;font-weight:600;line-height:24px;">Tanuki</td>
              </tr></table>
            </td></tr>
            <tr><td class="email-card" style="padding:24px;background:${C.SURFACE};border:1px solid ${C.BORDER};border-radius:12px;">
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;font-weight:600;">${escapeHtml(message.title)}</h1>
              ${paragraphs}${getDetail(message.detail)}${getCode(message.code)}${getAction(message.action)}${expiry}
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;table-layout:fixed;"><tr><td class="email-footer" style="padding-top:20px;border-top:1px solid ${C.BORDER};font-size:12px;line-height:18px;color:${C.SECONDARY};">
                <p style="margin:0;">${escapeHtml(message.explanation)}</p>${fallback}
              </td></tr></table>
            </td></tr>
          </table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td></tr></table>
      </body></html>`,
  };
};
