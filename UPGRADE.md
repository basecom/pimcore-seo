# Upgrade Notes

## Unreleased (Pimcore Studio)
- **[BC BREAK]** The ExtJS/Classic editor UI has been removed. Pimcore 2026.1 dropped `PimcoreAdminBundle`,
  so `SeoBundle\Controller\Admin\MetaDataController`, `SeoBundle\EventListener\Admin\*` and everything under
  `public/js` are gone. The bundle now ships a Studio API instead of an editor; the editor itself lives in the
  Studio UI plugin of the consuming project. See [Studio UI](docs/30_StudioUi.md).
- **[BC BREAK]** The four `/admin/seo/meta-data/*` routes are replaced by three Studio API endpoints under
  `%pimcore_studio_backend.url_prefix%/seo/meta-data`. Fetching the field definitions and the stored values is
  now a single request per element.
- **[BC BREAK]** `SeoBundle\EventListener\Admin\XliffListener` moved to `SeoBundle\EventListener\XliffListener`.
- **[BC BREAK]** The config options `meta_data_integrator.integrator_rendering_type` and
  `meta_data_integrator.documents.hide_pimcore_default_seo_panel` were removed. Both only steered the Classic UI,
  and the latter referred to Pimcore's own SEO bundle, which was discontinued with 2026.1.
- **[BC BREAK]** `pimcore/studio-backend-bundle` is now a hard requirement.
- **[ENHANCEMENT]** Element permissions are now enforced: reading needs `view`, saving needs `save` on the element.
  The Classic controller only required a backend login.

## 3.2.2
- [BUGFIX] Xliff Export: pass null values as empty string

## 3.2.1
- [BUGFIX] Check published state for objects

## 3.2.0
- [LICENSE] Dual-License with GPL and Dachcom Commercial License (DCL) added
- [ENHANCEMENT] Google Worker: Use new namespaces

## 3.1.3
- **[ENHANCEMENT]** Allow no auth_config for Google Index Worker [@dpfaffenbauer](https://github.com/dachcom-digital/pimcore-seo/pull/69)
- **[BUGFIX]** Fix Migration and Installer

## 3.1.2
- **[BUGFIX]** Improve Migrations

## 3.1.1
- **[BUGFIX]** Fix installer script

## 3.1.0
- **[NEW FEATURE]** Add Release Type to allow draft/public states [@64](https://github.com/dachcom-digital/pimcore-seo/issues/64)

## 3.0.3
- Fix Symfony Console deprecation in QueuedIndexDataCommand [@NiklasBr](https://github.com/dachcom-digital/pimcore-seo/pull/63)

## 3.0.2
- Fix og:image URL for CoreShop third party og tag [@breakone ](https://github.com/dachcom-digital/pimcore-seo/pull/61)
- FAdd ext-dom to composer.json [@NiklasBr](https://github.com/dachcom-digital/pimcore-seo/pull/51)

## 3.0.1
- Skip meta data update when elementId is missing [@NiklasBr](https://github.com/dachcom-digital/pimcore-seo/pull/58)

## Migrating from Version 2.x to Version 3.0.0
- Execute: `bin/console doctrine:migrations:migrate --prefix 'SeoBundle\Migrations'`

### Global Changes
- Recommended folder structure by symfony adopted
- SEO changes are not getting persisted at auto-save events anymore

### New Features
- Xliff Import/Export Support, see [#31](https://github.com/dachcom-digital/pimcore-seo/issues/31)
    - Introduced `XliffAwareIntegratorInterface` to specify xliff translation states for given integrator
    - Properties for `OpenGraph` and `TwitterCard` integrator can be extended by an 3. argument to include/exclude them for xliff translations (Default `false`)
- Seo Document Editor Support, see [#54](https://github.com/dachcom-digital/pimcore-seo/issues/54)

***

SeoBundle 2.x Upgrade Notes: https://github.com/dachcom-digital/pimcore-seo/blob/2.x/UPGRADE.md
