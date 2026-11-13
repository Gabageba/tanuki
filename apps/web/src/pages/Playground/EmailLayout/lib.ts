import type { MantineTheme } from '@mantine/core';
import GOLOS_CYRILLIC from '@fontsource/golos-text/files/golos-text-cyrillic-400-normal.woff2?url';
import GOLOS_CYRILLIC_SEMIBOLD from '@fontsource/golos-text/files/golos-text-cyrillic-600-normal.woff2?url';
import GOLOS_LATIN from '@fontsource/golos-text/files/golos-text-latin-400-normal.woff2?url';
import GOLOS_LATIN_SEMIBOLD from '@fontsource/golos-text/files/golos-text-latin-600-normal.woff2?url';
import BRAND_LATIN from '@fontsource/unbounded/files/unbounded-latin-600-normal.woff2?url';
import MONO_LATIN from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2?url';
import { COLOR_SCHEME } from '@tanuki/contracts';
import { PRIMARY_COLOR, PRIMARY_COLOR_SHADES, PRIMARY_SHADE } from '@/shared/lib/palette';
import CONFIRM_ICON from './assets/confirm.png';
import PASSWORD_ICON from './assets/password.png';
import RESTORE_ICON from './assets/restore.png';
import {
  EMAIL_KIND,
  EMAIL_LAYOUT,
  EMAIL_REVISION,
  type EmailKind,
  type EmailPalette,
  type EmailPreviewOptions,
  type EmailSample,
  type EmailScheme,
} from './models';

export const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll(/'/g, '&#39;');

// HTML письма не наследует CSS-переменные приложения. Цвета берём из его Mantine theme и
// подставляем готовыми значениями: внутри iframe остаётся самостоятельный почтовый HTML.
export const getEmailPalette = (theme: MantineTheme, scheme: EmailScheme): EmailPalette => {
  const accent = theme.colors[PRIMARY_COLOR] ?? PRIMARY_COLOR_SHADES;
  const shared = {
    accent: accent[PRIMARY_SHADE],
    actionText: theme.black,
  };
  switch (scheme) {
    case COLOR_SCHEME.LIGHT:
      return {
        ...shared,
        background: theme.colors.gray[0],
        surface: theme.white,
        subtle: theme.colors.gray[1],
        text: theme.colors.dark[6],
        secondary: theme.colors.gray[8],
        border: theme.colors.gray[3],
        link: accent[9],
      };
    case COLOR_SCHEME.DARK:
      return {
        ...shared,
        background: theme.colors.dark[7],
        surface: theme.colors.dark[6],
        subtle: theme.colors.dark[5],
        text: theme.colors.dark[0],
        secondary: theme.colors.dark[2],
        border: theme.colors.dark[4],
        link: accent[4],
      };
  }
};

const getFontFaces = () => `
  @font-face { font-family: 'Golos Text'; font-weight: 400; src: url('${GOLOS_CYRILLIC}') format('woff2'); unicode-range: U+0400-052F; }
  @font-face { font-family: 'Golos Text'; font-weight: 600; src: url('${GOLOS_CYRILLIC_SEMIBOLD}') format('woff2'); unicode-range: U+0400-052F; }
  @font-face { font-family: 'Golos Text'; font-weight: 400; src: url('${GOLOS_LATIN}') format('woff2'); unicode-range: U+0000-00FF,U+2000-206F; }
  @font-face { font-family: 'Golos Text'; font-weight: 600; src: url('${GOLOS_LATIN_SEMIBOLD}') format('woff2'); unicode-range: U+0000-00FF,U+2000-206F; }
  @font-face { font-family: 'Unbounded'; font-weight: 600; src: url('${BRAND_LATIN}') format('woff2'); }
  @font-face { font-family: 'JetBrains Mono'; font-weight: 400; src: url('${MONO_LATIN}') format('woff2'); }
`;

// PNG экспортированы из EnvelopeSimpleIcon, KeyIcon и ArrowCounterClockwiseIcon
// @phosphor-icons/react: в почтовом HTML не полагаемся на inline SVG.
const getActionIcon = (kind: EmailKind) => {
  switch (kind) {
    case EMAIL_KIND.VERIFICATION:
      return CONFIRM_ICON;
    case EMAIL_KIND.PASSWORD_RESET:
      return PASSWORD_ICON;
    case EMAIL_KIND.EMAIL_CHANGED:
    case EMAIL_KIND.DELETION:
      return RESTORE_ICON;
    case EMAIL_KIND.CHANGE_CODE:
      return null;
  }
};

const getAlignedAction = (
  action: NonNullable<EmailSample['action']>,
  icon: string | null,
  palette: EmailPalette,
  padding: number,
): string =>
  `<div style="margin:0 0 12px;"><a href="${escapeHtml(action.url)}" style="display:inline-block;box-sizing:border-box;max-width:100%;padding:${padding}px 18px;border-radius:8px;background:${palette.accent};color:${palette.actionText};text-decoration:none;font-size:14px;font-weight:400;line-height:20px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="color:inherit;font:inherit;"><tr>
      <td width="20" valign="middle" style="padding-right:8px;font-size:0;line-height:0;"><img src="${icon}" width="20" height="20" alt="" style="display:block;border:0;" /></td>
      <td valign="middle" style="font-size:14px;font-weight:400;line-height:20px;">${escapeHtml(action.label)}</td>
    </tr></table>
  </a></div>`;

const getAction = (sample: EmailSample, options: EmailPreviewOptions): string => {
  if (!sample.action) {
    return '';
  }
  const { palette: p, revision } = options;
  const icon = getActionIcon(sample.kind);
  switch (revision) {
    case EMAIL_REVISION.ORIGINAL:
      return `<p style="margin:0 0 12px;"><a href="${escapeHtml(sample.action.url)}" style="display:inline-block;box-sizing:border-box;max-width:100%;padding:12px 16px;border-radius:8px;background:${p.accent};color:${p.actionText};text-decoration:none;font-size:14px;font-weight:600;line-height:20px;"><img src="${icon}" width="16" height="16" alt="" style="vertical-align:-3px;margin-right:8px;border:0;" />${escapeHtml(sample.action.label)}</a></p>`;
    case EMAIL_REVISION.COMPACT_ACTION:
      return getAlignedAction(sample.action, icon, p, 8);
    case EMAIL_REVISION.LARGE_ACTION:
      return getAlignedAction(sample.action, icon, p, 12);
  }
};

const getBody = (sample: EmailSample, options: EmailPreviewOptions): string => {
  const { palette: p, layout, brandedFonts } = options;
  const mono = brandedFonts ? 'JetBrains Mono, monospace' : 'monospace';
  const boxed = layout !== EMAIL_LAYOUT.PLAIN;
  const detailStyle = boxed
    ? `padding:16px;background:${p.subtle};border:1px solid ${p.border};border-radius:8px;`
    : 'padding:0;';
  const paragraphs = sample.paragraphs
    .map((text) => `<p style="margin:0 0 20px;">${escapeHtml(text)}</p>`)
    .join('');
  const detail = sample.detail
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;table-layout:fixed;"><tr><td style="${detailStyle}">
      <p style="margin:0 0 6px;color:${p.secondary};font-size:12px;">${escapeHtml(sample.detail.label)}</p>
      <p style="margin:0;font-size:14px;font-weight:600;${sample.kind === EMAIL_KIND.EMAIL_CHANGED ? `font-family:${mono};font-weight:400;` : ''}">${escapeHtml(sample.detail.value)}</p>
    </td></tr></table>`
    : '';
  // Код остаётся одной строкой без пробелов: копирование вставляет ровно шесть цифр.
  const code = sample.code
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 12px;table-layout:fixed;"><tr><td style="${detailStyle}">
      <p style="margin:0;font-family:${mono};font-size:30px;line-height:1.4;letter-spacing:6px;white-space:nowrap;">${escapeHtml(sample.code.replaceAll(' ', ''))}</p>
    </td></tr></table>`
    : '';
  const action = getAction(sample, options);
  const expiry = sample.expiry
    ? `<p style="margin:0;color:${p.secondary};font-size:12px;line-height:18px;">${escapeHtml(sample.expiry)}</p>`
    : '';
  return `<h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;font-weight:600;">${escapeHtml(sample.title)}</h1>${paragraphs}${detail}${code}${action}${expiry}`;
};

const getFooter = (sample: EmailSample, options: EmailPreviewOptions): string => {
  const { palette: p } = options;
  const explanation = `<p style="margin:0;">${escapeHtml(sample.explanation)}</p>`;
  if (!sample.action) {
    return explanation;
  }
  switch (options.revision) {
    case EMAIL_REVISION.ORIGINAL:
      return `${explanation}<p style="margin:16px 0 6px;">Если кнопка не работает, откройте эту ссылку в браузере:</p>
        <p style="margin:0;overflow-wrap:anywhere;word-break:break-all;"><a href="${escapeHtml(sample.action.url)}" style="color:${p.link};text-decoration:underline;">${escapeHtml(sample.action.url)}</a></p>`;
    case EMAIL_REVISION.COMPACT_ACTION:
    case EMAIL_REVISION.LARGE_ACTION:
      return `${explanation}<p style="margin:16px 0 0;">Если кнопка не работает, <a href="${escapeHtml(sample.action.url)}" style="color:${p.link};text-decoration:underline;">откройте ссылку в браузере</a>.</p>`;
  }
};

// Это локальные HTML-макеты писем, а не UI приложения: таблицы и inline CSS намеренно
// повторяют ограничения почтовой верстки. Производственные шаблоны API не меняются.
export const getEmailHtml = (sample: EmailSample, options: EmailPreviewOptions): string => {
  const { layout, palette: p, scheme, brandedFonts } = options;
  if (layout === EMAIL_LAYOUT.CURRENT) {
    return sample.current.html;
  }
  const font = brandedFonts ? 'Golos Text, Arial, sans-serif' : 'Arial, sans-serif';
  const brandFont = brandedFonts ? 'Unbounded, Arial, sans-serif' : 'Arial, sans-serif';
  const brand = `<table role="presentation" cellspacing="0" cellpadding="0"><tr>
    <td style="padding-right:10px;"><img src="/icon-192.png" width="32" height="32" alt="" style="display:block;border:0;border-radius:6px;" /></td>
    <td style="font-family:${brandFont};font-size:16px;font-weight:600;line-height:24px;">Tanuki</td>
  </tr></table>`;
  const footer = getFooter(sample, options);
  const body = getBody(sample, options);
  const getContent = () => {
    switch (layout) {
      case EMAIL_LAYOUT.CARD:
        return `<tr><td style="padding:8px 8px 24px;">${brand}</td></tr>
          <tr><td style="padding:24px;background:${p.surface};border:1px solid ${p.border};border-radius:12px;">
            ${body}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;table-layout:fixed;"><tr><td style="padding-top:20px;border-top:1px solid ${p.border};font-size:12px;line-height:18px;color:${p.secondary};">${footer}</td></tr></table>
          </td></tr>`;
      case EMAIL_LAYOUT.SHEET:
        return `<tr><td style="padding:8px 8px 24px;border-bottom:1px solid ${p.border};">${brand}</td></tr>
          <tr><td style="padding:28px 8px 24px;">${body}</td></tr>
          <tr><td style="padding:20px 8px 0;border-top:1px solid ${p.border};font-size:12px;line-height:18px;color:${p.secondary};">${footer}</td></tr>`;
      case EMAIL_LAYOUT.PLAIN:
        return `<tr><td style="padding:8px 8px 32px;">${brand}</td></tr>
          <tr><td style="padding:0 8px;">${body}</td></tr>
          <tr><td style="padding:28px 8px 0;font-size:12px;line-height:18px;color:${p.secondary};">${footer}</td></tr>`;
    }
  };
  const background = layout === EMAIL_LAYOUT.CARD ? p.background : p.surface;
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="${scheme}" /><title>${escapeHtml(sample.subject)}</title>
    <style>${brandedFonts ? getFontFaces() : ''}</style></head>
    <body style="margin:0;padding:0;background:${background};color:${p.text};font-family:${font};font-size:14px;line-height:1.6;overflow-wrap:anywhere;">
      <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(sample.preheader)}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${background};table-layout:fixed;"><tr><td style="padding:24px 16px 32px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" align="center" style="max-width:560px;table-layout:fixed;">${getContent()}</table>
      </td></tr></table>
    </body></html>`;
};
