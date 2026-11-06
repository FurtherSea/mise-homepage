# 食序 Mise website

The website of Mise, a kitchen and meal-planning app for iPhone: home, privacy policy and support, in English and Chinese. It's plain HTML, CSS and a little JavaScript with no build step. GitHub Pages serves the files as they are from the `main` branch.

| | English | Chinese |
| --- | --- | --- |
| Home | `index.html` | `zh/index.html` |
| Privacy policy | `privacy/index.html` | `zh/privacy/index.html` |
| Support | `support/index.html` | `zh/support/index.html` |

`assets/site.css` holds the styles. Its colors, type and components come from the app (Design Direction in the app repo's `agents.md`). `assets/site.js` remembers the language picked and runs the plate palette on the home page: every plate's place comes from one number, so moving, swiping and spinning all glide along the arc. English is the default: a visitor who picks Chinese is sent to the Chinese page from then on, and the choice stays in that browser.

To preview, serve the folder with any static server, for example `python3 -m http.server`.

## Changing text

Change both languages. The Chinese font is a subset, so after adding Chinese text run this, pointing at the fonts in the app repo:

```bash
python3 -I tools/subset_fonts.py <mise-app>/mise/Resources/Fonts
```

It needs `fonttools` and `brotli`, and it lists any character the source font lacks.

## The privacy policy

The policy states facts about the app, so keep it true. Before a version with analytics, ads, accounts or online features ships, update `privacy/` and `zh/privacy/`, the effective date on both, and the App Store privacy label.

## Fonts

- Chinese: Resource Han Rounded, subset in `assets/fonts`, SIL OFL 1.1 (`OFL-ResourceHanRounded.txt`).
- Latin and numbers: the system's rounded font through `ui-rounded` where there is one, otherwise Nunito, SIL OFL 1.1 (`OFL-Nunito.txt`). SF Pro Rounded is never hosted here.

## App Store badge

The files in `assets/badges` are Apple's own artwork, unmodified, from the [App Store Marketing Tools](https://toolbox.marketingtools.apple.com/app-store/). Apple's [guidelines](https://developer.apple.com/app-store/marketing/guidelines/) allow one badge per layout, at least 40 px high, with clear space of a quarter of its height, and ask for the trademark line that's in the home pages' footers.

## Moving the site

Pages link to each other with relative paths, so they work at any address. A new address needs changes in these places: the `canonical`, `alternate` and `og:` tags in each page's head, and the `/mise-homepage/` paths in `404.html`.
