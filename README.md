# 食序 Shiso website

The website of Shiso (食序 in Chinese), an app for iPhone: home, privacy policy and support, in English and Chinese. It's plain HTML, CSS and a little JavaScript with no build step. GitHub Pages serves the files as they are from the `main` branch.

| | English | Chinese |
| --- | --- | --- |
| Home | `index.html` | `zh/index.html` |
| Privacy policy | `privacy/index.html` | `zh/privacy/index.html` |
| Support | `support/index.html` | `zh/support/index.html` |

`assets/site.css` holds the styles. Its colors, type and components come from the app (Design Direction in the app repo's `agents.md`). `assets/site.js` remembers the language and the light or dark choice, puts the contact address together (see Contact below), and runs the plate palette on the home page: every plate's place comes from one number, so moving, swiping and spinning all glide along the arc. English is the default: a visitor who picks Chinese is sent to the Chinese page from then on, and the choice stays in that browser.

To preview, serve the folder with any static server, for example `python3 -m http.server`.

## Names

The app is `食序` in Chinese and `Shiso` in English, with nothing after the name: the page header, the home page's `<title>`, `og:site_name` and `og:title`, the link preview image and the privacy policy's first line all say just `Shiso`, and the other pages' titles pair it with the page, as in `Support · Shiso`. Chinese pages say `食序` everywhere; only the privacy policy's first line and its note on the name change name the English too. The slogans are `Cooking that grows with you` and `陪你越做越好`.

The English name was `Mise` until November 8, 2026. The address, this repository's name and the `mise.lang` and `mise.theme` keys in the browser's storage keep it, so links and saved choices still work.

## The first screen

The slogan stays put as the page's `h1`, set small. Under it a big title and a line take turns, one turn every four seconds. A turn is one `.hero-title`, one `.lede` and one dot, matched by `data-turn` and `data-pick`; to add one, add all three in both languages. The theme green marks the part of the title to remember, the second line as a rule (`em`).

## Changing text

Change both languages. The Chinese font is a subset, so after adding Chinese text run this, pointing at the fonts in the app repo:

```bash
python3 -I tools/subset_fonts.py <mise-app>/mise/Resources/Fonts
```

It needs `fonttools` and `brotli`, and it lists any character the source font lacks.

## The privacy policy

The policy states facts about the app, so keep it true. Before a version that sends new data, or adds ads, accounts or online features, ships, update `privacy/` and `zh/privacy/`, the effective date on both, and the App Store privacy label. What the app sends to Google Analytics is listed in `docs/usage-analytics.md` in the app repo; the policy names each action, so a new event changes the policy too.

## Fonts

- Chinese: Resource Han Rounded, subset in `assets/fonts`, SIL OFL 1.1 (`OFL-ResourceHanRounded.txt`).
- Latin and numbers: the system's rounded font through `ui-rounded` where there is one, otherwise Nunito, SIL OFL 1.1 (`OFL-Nunito.txt`). SF Pro Rounded is never hosted here.

## App Store badge

The files in `assets/badges` are Apple's own artwork, unmodified, from the [App Store Marketing Tools](https://toolbox.marketingtools.apple.com/app-store/). Apple's [guidelines](https://developer.apple.com/app-store/marketing/guidelines/) allow one badge per layout, at least 40 px high, with clear space of a quarter of its height, and ask for the trademark line that's in the home pages' footers.

## The address

The site lives at https://furthersea.org/mise-homepage/. The path is this repository's name: the domain is bound in [`FurtherSea/furthersea.github.io`](https://github.com/FurtherSea/furthersea.github.io), the organization's own site, and GitHub Pages serves every other repository's site under that domain. So this repository has no `CNAME` file and no custom domain of its own. DNS is at Cloudflare in DNS-only mode so GitHub can issue the certificate. `www.furthersea.org/mise-homepage/` and `furthersea.github.io/mise-homepage/` redirect here.

Pages link to each other with relative paths, so they work at any address. A new address, which includes renaming this repository, needs changes in these places: the `canonical`, `alternate` and `og:` tags in each page's head, and the root-relative paths in `404.html`.

## Contact

Email comes first: the support page and the privacy policy's Contact section have `Email us` and `Show address`. The address is never in the HTML in one piece, so a scraper reading the source finds no `name@domain` address and no `mailto:` link. Each `.mail` block holds it backwards in `data-mail`, with `/` in place of `@`, and `assets/site.js` puts it together only for someone who reaches for it: `Email us` gets its `mailto:` link as the pointer or the focus comes to it, and `Show address` puts the address on the page with a `Copy` button. Without JavaScript the block is hidden and the page spells the address out with at and dot. To change the address, write the new one backwards with `/` for `@` in each `data-mail`, and change the spelled-out line under it.

This repository's issues stay as the public alternative: those two pages and the footers link to them. Keep them turned on.
