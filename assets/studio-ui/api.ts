import { isNil, isString } from 'lodash'
import i18next from 'i18next'
import { appConfig } from '@pimcore/studio-ui-bundle/app'
import { trackError, ApiError, GeneralError } from '@pimcore/studio-ui-bundle/modules/app'

/**
 * Endpoints are provided by basecom/pimcore-seo (SeoBundle\Controller\Studio\MetaData).
 * The bundle owns the data model, this module only renders it. The prefix follows
 * `pimcore_studio_backend.url_prefix`, so a project that reconfigures it stays functional.
 */
const BASE_URL = `${appConfig.apiPrefix}/seo/meta-data`

export type SeoElementType = 'object' | 'document'

/** `[key, label, xliffExportAware]` */
export type SeoPropertyDefinition = [string, string, boolean]

/** `[label, value]` — the order `typeOptions` consumes. */
export type SeoTypeDefinition = [string, string]

/** `[template, label]` */
export type SeoPreviewTemplate = [string, string]

export interface SeoPropertyPreset {
  label: string
  fields?: Array<{ property: string, content: string | null }>
}

export interface SeoHtmlTagPreset {
  label: string
  value: string
}

export interface SeoIntegratorConfig {
  hasLivePreview?: boolean
  livePreviewTemplates?: SeoPreviewTemplate[]
  useLocalizedFields?: boolean
  properties?: SeoPropertyDefinition[]
  types?: SeoTypeDefinition[]
  presets?: Array<SeoPropertyPreset | SeoHtmlTagPreset>
  presets_only_mode?: boolean
  hasDynamicallyAddedJsonLdData?: boolean
  dynamicallyAddedJsonLdDataTypes?: Record<string, number>
}

export interface SeoIntegrator {
  name: string
  config: SeoIntegratorConfig
}

export interface SeoMetaDataConfiguration {
  integrators: SeoIntegrator[]
  availableLocales: string[]
  draft: boolean
  data: Record<string, unknown>
}

/** `null` for a locale means "clear this locale", the backend drops those rows. */
export interface SeoLocaleValue {
  locale: string
  value: string | null
}

export interface SeoAssetReference {
  type: 'asset'
  id: number
  fullPath?: string
}

/** Either a plain value (documents, selects, assets) or one row per locale (objects). */
export type SeoValue = string | null | SeoAssetReference | SeoLocaleValue[]

export interface SeoPropertyRow {
  /** `property` for open_graph, `name` for twitter_card. */
  property?: string
  name?: string
  value: SeoValue
}

export interface SeoSchemaBlock {
  identifier: string
  localized: boolean
  data: string | SeoLocaleValue[]
}

export interface SeoTitleDescription {
  title?: SeoValue
  description?: SeoValue
}

const resolveApiErrorMessage = (data: unknown, fallback: string): string => {
  if (isNil(data) || typeof data !== 'object') {
    return fallback
  }

  const record = data as Record<string, unknown>
  for (const key of ['detail', 'message', 'title']) {
    const value = record[key]
    if (isString(value) && value !== '') {
      return value
    }
  }

  return fallback
}

const request = async (url: string, init: RequestInit, fallbackKey: string): Promise<Response> => {
  let res: Response

  try {
    res = await fetch(url, { credentials: 'same-origin', ...init })
  } catch {
    const message = i18next.t('seo.error.network')
    trackError(new GeneralError(message))
    throw new Error(message)
  }

  if (!res.ok) {
    let data: unknown
    try {
      data = await res.json()
    } catch {
      // Fatal backend errors answer with an HTML error page, so there is no message to unwrap —
      // surface the status instead of falling through to a generic "something went wrong".
      data = { message: `HTTP ${res.status} ${res.statusText}` }
    }
    trackError(new ApiError({ data, status: res.status }))
    throw new Error(resolveApiErrorMessage(data, i18next.t(fallbackKey)))
  }

  return res
}

export const fetchMetaDataConfiguration = async (
  elementType: SeoElementType,
  elementId: number
): Promise<SeoMetaDataConfiguration> => {
  const res = await request(
    `${BASE_URL}/${elementType}/${elementId}`,
    { method: 'GET', headers: { Accept: 'application/json' } },
    'seo.error.load'
  )

  return await res.json() as SeoMetaDataConfiguration
}

export const saveMetaData = async (
  elementType: SeoElementType,
  elementId: number,
  integratorValues: Record<string, unknown>,
  task: 'publish' | 'draft' = 'publish'
): Promise<void> => {
  await request(
    `${BASE_URL}/${elementType}/${elementId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ integratorValues, task })
    },
    'seo.error.save'
  )
}

/**
 * The preview is a standalone HTML document rendered by the bundle and shown in an iframe,
 * so it is addressed by URL instead of being fetched.
 */
export const buildPreviewUrl = (
  elementType: SeoElementType,
  elementId: number,
  integrator: string,
  template: string | null,
  data: Record<string, unknown>
): string => {
  const params = new URLSearchParams({ integrator, data: JSON.stringify(data) })

  if (!isNil(template) && template !== '') {
    params.set('template', template)
  }

  return `${BASE_URL}/${elementType}/${elementId}/preview?${params.toString()}`
}
