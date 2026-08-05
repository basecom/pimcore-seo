# Studio UI

Up to Pimcore 2026.0 this bundle shipped an ExtJS editor under `public/js`. Pimcore 2026.1 removed
`PimcoreAdminBundle`, so that editor is gone. The bundle now ships the **Studio API** plus the editor as
**TypeScript sources** under [`assets/studio-ui/`](../assets/studio-ui) — deliberately *not* as a built
module federation remote: shipping a built remote from a composer package means committing build output and
registering a webpack entry point provider that hard-fails the whole Studio boot when the `entrypoints.json`
is missing from a release. Instead, the consuming project compiles the sources into its **own** Studio UI
plugin.

## Using the shipped editor

Requirements: the project has a Studio UI plugin (module federation remote) with
`@pimcore/studio-ui-bundle` pinned to the same minor as the installed composer bundles, plus `lodash` and
`i18next` (both already pulled in by the SDK setup).

The path depths below assume the common layout `<project>/assets/studio-ui/rsbuild.config.ts` with the
plugin sources in `<project>/assets/studio-ui/js/src/` and composer's `vendor/` at the project root —
adjust each relative path to where the file actually sits in your project.

1. Let the plugin build compile sources from the vendor directory. rsbuild only transpiles the project
   root by default, so include the bundle path (`rsbuild.config.ts`):

   ```ts
   source: {
     include: [path.resolve(__dirname, '../../vendor/basecom/pimcore-seo/assets/studio-ui')]
   }
   ```

   TypeScript needs the same hint (`tsconfig.json`): add the path to `include`.

2. Register the plugin (the project's `plugins.ts`):

   ```ts
   import { SeoPlugin } from '../../../vendor/basecom/pimcore-seo/assets/studio-ui'

   export { SeoPlugin }
   ```

The module registers an `SEO` tab on object and variant editors, saves with the element's own
Save draft / Save & Publish buttons (via the `data-object:editor:post-update` event) and follows the
footer language switcher. Elements of classes without enabled integrators tell the user SEO is off.

Custom integrators registered in the bundle config need their own editor — the shipped module renders a
warning for integrator names it does not know.

## Endpoints

All routes live under `%pimcore_studio_backend.url_prefix%/seo/meta-data` (`/pimcore-studio/api/seo/meta-data`
by default) and are registered from `config/pimcore/routing.yaml`.

`{elementType}` is `object` or `document`, matching the value stored in `seo_element_meta_data.elementType`.

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/{elementType}/{elementId}` | Form schema, editable locales and stored values |
| `PUT`  | `/{elementType}/{elementId}` | Save values |
| `GET`  | `/{elementType}/{elementId}/preview` | Live preview of one integrator as an HTML document |

To get the endpoints into the generated OpenAPI spec, add the bundle to `open_api_scan_paths`:

```yaml
pimcore_studio_backend:
  open_api_scan_paths:
    - "%kernel.project_dir%/vendor/basecom/pimcore-seo/src/Controller/Studio"
    - "%kernel.project_dir%/vendor/basecom/pimcore-seo/src/Studio"
```

### GET `/{elementType}/{elementId}`

```json
{
  "integrators": [
    { "name": "title_description", "config": { "hasLivePreview": true, "useLocalizedFields": true } },
    { "name": "open_graph", "config": { "properties": [["og:title", "og:title", true]], "types": [["Article", "article"]] } }
  ],
  "availableLocales": ["de", "en"],
  "draft": false,
  "data": { "title_description": { "title": [{ "locale": "de", "value": "…" }] } }
}
```

- `integrators` is ordered like `enabled_integrator` in the configuration. Each `config` is whatever the
  integrator's `getBackendConfiguration()` returns.
- **An empty `integrators` list means SEO meta data is not enabled for this element** — either the element type
  is switched off or the object's class is not listed in `objects.data_classes`. Render a hint, not an editor.
- `availableLocales` is empty for elements without localized fields.
- `draft` is `true` when the returned values come from an unpublished draft.

### PUT `/{elementType}/{elementId}`

```json
{
  "integratorValues": { "title_description": { "title": [{ "locale": "de", "value": "…" }] } },
  "task": "publish"
}
```

`task` is `publish` (default) or `draft`. Integrators left out of `integratorValues` keep their stored values.

> **Locale-aware values are replaced, not merged.** Send every locale you loaded, not just the one being
> edited — a locale that is missing from the payload is dropped. Send `{"locale": "de", "value": null}` to
> clear a single locale on purpose.

### GET `/{elementType}/{elementId}/preview`

Query parameters: `integrator` (required), `template`, `data` (JSON encoded). Answers with a standalone HTML
document meant for an `<iframe src>`, which is why the payload travels in the query string. Only integrators
whose config says `hasLivePreview: true` have one; `livePreviewTemplates` lists the available templates as
`[value, label]`.

> `data` carries metadata the editor has not published yet, and a query string reaches access logs. The
> response is sent `private, no-store` so it stays out of browser and proxy caches, and `data` should carry
> only the fields being previewed — keep that in mind before extending it. Getting the payload out of the URL
> entirely needs a short-lived server-side preview token, because an iframe cannot issue a POST.

The preview expects flat scalars for the locale being previewed, not the stored shape:

| Integrator | `data` |
|------------|--------|
| `title_description` | `{"title": "…", "description": "…"}` |
| `open_graph` | `{"title": "…", "description": "…", "image": {"id": 42}}` |
| `twitter_card` | same as `open_graph` |

## Stored value shapes

`useLocalizedFields` in the integrator config decides between a plain value and one row per locale
(`[{"locale": "de", "value": "…"}]`). It is `true` for data objects and `false` for documents.

| Integrator | Value |
|------------|-------|
| `title_description` | `{"title": <value>, "description": <value>}` |
| `open_graph` | `[{"property": "og:title", "value": <value>}, …]` |
| `twitter_card` | `[{"name": "twitter:title", "value": <value>}, …]` |
| `schema` | `[{"identifier": "si…", "localized": true, "data": <value>}, …]` |
| `html_tag` | `["<meta … />", …]` |

Exceptions inside `open_graph` / `twitter_card`:

- `og:type` / `twitter:card` hold a plain string picked from `config.types`.
- `og:image` / `twitter:image` hold an asset reference `{"type": "asset", "id": 42}`; only `id` is read.

`schema` blocks are stored, and returned, as the complete `<script type="application/ld+json">…</script>`
string. The `identifier` keys the locale rows, so it has to be stable and unique per block.

## Permissions

- Reading requires the `view`, saving the `save` element permission — enforced in the API.
- The installer creates the user permissions `seo_bundle_add_property` and `seo_bundle_remove_property`. They
  gate the add and remove buttons in the editor, not the API.
