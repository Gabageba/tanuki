import type { HttpClient } from '../../core/http/client';
import { parseHtml, type Doc } from '../../core/html/dom';
import type { GroupleCredentials } from '../../core/parser';
import { ParseError, SourceTokenExpiredError } from '../../errors';
import { SOURCE_ID } from '../catalog';

export const assertMultpornSession = (doc: Doc, sourceId: string) => {
  if (doc.$('body').hasClass('not-logged-in') || doc.$('form#user-login').length)
    throw new SourceTokenExpiredError('MultPorn session expired', sourceId);
  if (!doc.$('body').hasClass('logged-in'))
    throw new ParseError('MultPorn account page is malformed', sourceId);
};

/** `/user` redirects an authenticated Drupal user to their own profile. */
export const fetchMultpornViewer = async (http: HttpClient, domain: string) => {
  const doc = await http.getHtml(`https://${domain}/user`);
  assertMultpornSession(doc, SOURCE_ID.MULTPORN);
  const name = doc.$('#page-title').text().trim();
  if (!name) throw new ParseError('MultPorn profile name is missing', SOURCE_ID.MULTPORN);
  return name;
};

/** Submit the site's Drupal form with its current build id and hidden fields. */
export const loginMultporn = async (
  http: HttpClient,
  domain: string,
  credentials: GroupleCredentials,
): Promise<boolean> => {
  const url = `https://${domain}/user/login`;
  const doc = await http.getHtml(url);
  const form = doc.$('form#user-login');
  if (form.length !== 1 || form.find('input[name="form_id"]').val() !== 'user_login')
    throw new ParseError('MultPorn login form is malformed', SOURCE_ID.MULTPORN);
  const fields: Record<string, string> = {};
  form.find('input[type="hidden"]').each((_, el) => {
    const name = doc.$(el).attr('name');
    if (name) fields[name] = doc.$(el).attr('value') ?? '';
  });
  const res = await http.postForm(
    url,
    {
      ...fields,
      name: credentials.username,
      pass: credentials.password,
      persistent_login: '1',
      op: 'Log in',
    },
    { Origin: `https://${domain}`, Referer: url },
  );
  const result = parseHtml(res.text(), res.url);
  if (result.$('form#user-login, body.not-logged-in').length) return false;
  // Check the actual session, rather than trusting a redirect or a successful HTTP status.
  try {
    await fetchMultpornViewer(http, domain);
    return true;
  } catch (error) {
    if (error instanceof SourceTokenExpiredError) return false;
    throw error;
  }
};
