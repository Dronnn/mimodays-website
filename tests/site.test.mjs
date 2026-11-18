// Checks over every built page, with Node's own test runner (no dependencies): `node --test tests/`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const origin = 'https://mimodays.mrmaier.com';
const languages = ['en', 'de', 'fr', 'es', 'it', 'nl', 'sv', 'pl', 'pt-BR', 'ru', 'uk', 'be', 'hy', 'ka', 'kk', 'tr', 'he', 'ar', 'zh-Hans', 'zh-Hant', 'ja', 'ko'];
const folder = (lang) => (lang === 'en' ? '' : lang.toLowerCase());

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const pages = walk(pub).filter((p) => p.endsWith('.html'));
const html = new Map(pages.map((p) => [p, readFileSync(p, 'utf8')]));
const urlPath = (file) => '/' + relative(pub, file).replace(/index\.html$/, '').replace(/\\/g, '/');
const is404 = (file) => file.endsWith('404.html');

/** The file a site path is served from, or null. */
function served(path) {
  const clean = decodeURIComponent(path.split(/[?#]/)[0]);
  const file = join(pub, clean);
  if (existsSync(file) && statSync(file).isFile()) return file;
  if (existsSync(join(file, 'index.html'))) return join(file, 'index.html');
  if (existsSync(file + '.html')) return file + '.html';
  return null;
}

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const tags = (text, name) => text.match(new RegExp(`<${name}\\b[^>]*>`, 'g')) ?? [];

test('every language has its pages', () => {
  for (const lang of languages) {
    for (const page of ['', 'privacy-policy/', 'support/', 'terms/']) {
      const path = '/' + (folder(lang) ? folder(lang) + '/' : '') + page;
      assert.ok(served(path), `missing ${path}`);
    }
  }
});

test('each page says its language and direction', () => {
  for (const [file, text] of html) {
    const top = relative(pub, file).split('/')[0];
    const lang = languages.find((l) => folder(l) === top) ?? 'en';
    const tag = tags(text, 'html')[0] ?? '';
    assert.equal(attr(tag, 'lang'), lang, `${urlPath(file)} lang`);
    const rtl = lang === 'he' || lang === 'ar';
    assert.equal(attr(tag, 'dir') === 'rtl', rtl, `${urlPath(file)} dir`);
  }
});

test('titles, descriptions and canonical links', () => {
  for (const [file, text] of html) {
    const where = urlPath(file);
    const title = text.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
    assert.ok(title, `${where} has no title`);
    if (is404(file)) continue;
    const description = tags(text, 'meta').find((t) => attr(t, 'name') === 'description');
    // Search engines show about 150 Latin letters; the same sentence is far shorter in Chinese, Japanese and Korean.
    const dense = /^\/(ja|ko|zh-hans|zh-hant)\//.test(where);
    assert.ok(description && attr(description, 'content')?.length > (dense ? 20 : 40), `${where} description`);
    const canonical = tags(text, 'link').find((t) => attr(t, 'rel') === 'canonical');
    assert.equal(attr(canonical ?? '', 'href'), origin + where, `${where} canonical`);
  }
});

test('og:locale matches the page language', () => {
  for (const [file, text] of html) {
    if (is404(file)) continue;
    const lang = attr(tags(text, 'html')[0] ?? '', 'lang');
    const locale = attr(tags(text, 'meta').find((t) => attr(t, 'property') === 'og:locale') ?? '', 'content');
    const expected = { 'zh-Hans': 'zh_CN', 'zh-Hant': 'zh_TW', 'pt-BR': 'pt_BR' }[lang] ?? lang;
    assert.ok(locale?.startsWith(expected), `${urlPath(file)} og:locale ${locale} for ${lang}`);
  }
});

test('the language redirect moves people, not search crawlers', () => {
  const script = readFileSync(join(pub, 'assets', 'lang.js'), 'utf8');
  const visit = (userAgent, languages) => {
    let target = null;
    const location = { pathname: '/support/', search: '', hash: '', replace: (url) => { target = url; } };
    const localStorage = { getItem: () => null };
    runInNewContext(script, { navigator: { userAgent, languages }, location, localStorage });
    return target;
  };
  const chrome = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
  assert.equal(visit(chrome, ['ru-RU', 'en']), '/ru/support/');
  assert.equal(visit(chrome, ['en-GB']), null);
  // The Yandex app's own browser is a person, not a crawler.
  assert.equal(visit('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 YaBrowser/24.12.1 YandexSearch/24.120 Mobile Safari/537.36', ['ru-RU']), '/ru/support/');
  for (const bot of [
    'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
    'Mozilla/5.0 (compatible; YandexRenderResourcesBot/1.0; +http://yandex.com/bots)',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/130.0.0.0 Safari/537.36',
  ]) assert.equal(visit(bot, ['ru-RU']), null, bot);
});

test('hreflang links point to every language and exist', () => {
  for (const [file, text] of html) {
    if (is404(file)) continue;
    const alternates = tags(text, 'link').filter((t) => attr(t, 'rel') === 'alternate' && attr(t, 'hreflang'));
    const langs = alternates.map((t) => attr(t, 'hreflang'));
    for (const lang of languages) assert.ok(langs.includes(lang), `${urlPath(file)} lacks hreflang ${lang}`);
    assert.ok(langs.includes('x-default'), `${urlPath(file)} lacks x-default`);
    for (const t of alternates) {
      const href = attr(t, 'href');
      assert.ok(href.startsWith(origin + '/'), href);
      assert.ok(served(href.slice(origin.length)), `${urlPath(file)}: ${href} doesn't exist`);
    }
  }
});

test('images have alt text and media have their files', () => {
  for (const [file, text] of html) {
    for (const img of tags(text, 'img')) assert.ok(attr(img, 'alt') !== undefined, `${urlPath(file)}: ${img} has no alt`);
    for (const tag of [...tags(text, 'img'), ...tags(text, 'source'), ...tags(text, 'video')]) {
      for (const name of ['src', 'poster', 'data-src']) {
        const value = attr(tag, name);
        if (value && value.startsWith('/')) assert.ok(served(value), `${urlPath(file)}: ${value} missing`);
      }
    }
  }
});

test('internal links lead somewhere', () => {
  for (const [file, text] of html) {
    for (const a of [...tags(text, 'a'), ...tags(text, 'link'), ...tags(text, 'script')]) {
      const value = attr(a, 'href') ?? attr(a, 'src');
      if (!value || value.startsWith('#') || value.startsWith('mailto:')) continue;
      if (value.startsWith(origin)) {
        assert.ok(served(value.slice(origin.length) || '/'), `${urlPath(file)}: ${value}`);
      } else if (value.startsWith('/')) {
        assert.ok(served(value), `${urlPath(file)}: ${value}`);
      } else if (/^https?:/.test(value)) {
        // Only what a visitor chooses to open; nothing loads from other hosts (the CSP forbids it anyway).
        assert.equal(a.startsWith('<a'), true, `${urlPath(file)} loads ${value} from another host`);
      }
    }
  }
});

test('no unfinished words', () => {
  for (const [file, text] of html) {
    assert.doesNotMatch(text, /\b(TODO|FIXME|TBD)\b|lorem ipsum/, urlPath(file));
    const prose = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
    assert.doesNotMatch(prose, /\{\{|\}\}/, `${urlPath(file)} has an unfilled placeholder`);
  }
});

test('the sitemap lists every page and only real ones', () => {
  const sitemap = readFileSync(join(pub, 'sitemap.xml'), 'utf8');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const loc of locs) assert.ok(served(loc.slice(origin.length)), `sitemap: ${loc}`);
  for (const file of pages.filter((f) => !is404(f))) assert.ok(locs.includes(origin + urlPath(file)), `sitemap lacks ${urlPath(file)}`);
  const robots = readFileSync(join(pub, 'robots.txt'), 'utf8');
  assert.match(robots, new RegExp(`Sitemap: ${origin}/sitemap.xml`));
});

test('security headers', () => {
  const headers = readFileSync(join(pub, '_headers'), 'utf8');
  for (const name of ['Strict-Transport-Security', 'X-Content-Type-Options: nosniff', 'Referrer-Policy', 'Permissions-Policy', 'X-Frame-Options: DENY', 'Content-Security-Policy']) {
    assert.ok(headers.includes(name), `_headers lacks ${name}`);
  }
  assert.doesNotMatch(headers, /unsafe-inline|unsafe-eval/);
});

test('every language file has every key', () => {
  const dir = join(root, 'i18n');
  // source.json is the English source with where each text sits, not a language.
  const files = readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'source.json');
  const keys = new Map(files.map((f) => [f, new Set(Object.keys(JSON.parse(readFileSync(join(dir, f), 'utf8'))))]));
  const all = new Set([...keys.values()].flatMap((s) => [...s]));
  const source = Object.keys(JSON.parse(readFileSync(join(dir, 'source.json'), 'utf8')));
  for (const k of source) all.add(k);
  for (const [f, set] of keys) {
    const missing = [...all].filter((k) => !set.has(k));
    assert.deepEqual(missing, [], `${f} lacks keys`);
  }
});
