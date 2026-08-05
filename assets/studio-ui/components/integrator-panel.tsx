import React, { useEffect, useState } from 'react'
import { isNil } from 'lodash'
import type { TFunction } from 'i18next'
import { Alert, Flex, Form, FormKit, Iframe, Select } from '@pimcore/studio-ui-bundle/components'
import { useTranslation } from '@pimcore/studio-ui-bundle/app'
import {
  buildPreviewUrl,
  type SeoElementType,
  type SeoIntegrator,
  type SeoPropertyRow,
  type SeoTitleDescription
} from '../api'
import {
  HtmlTags,
  PropertyRows,
  readLocaleValue,
  SchemaBlocks,
  TitleDescriptionFields
} from './fields'

const PREVIEW_DEBOUNCE_MS = 600

/** Integrators registered in the bundle but unknown here still get a readable heading. */
const integratorLabel = (t: TFunction, integrator: SeoIntegrator): string =>
  t(`seo.integrator.${integrator.name}`, { defaultValue: integrator.name })

/**
 * Which property holds the type select and which ones hold an image. This used to live in the
 * ExtJS integrator subclasses; the values themselves come from the bundle configuration.
 */
const PROPERTY_INTEGRATORS: Record<string, {
  rowKey: 'property' | 'name'
  typeProperty: string
  imageProperties: string[]
  previewFields: Record<string, 'title' | 'description' | 'image'>
}> = {
  open_graph: {
    rowKey: 'property',
    typeProperty: 'og:type',
    imageProperties: ['og:image'],
    previewFields: { 'og:title': 'title', 'og:description': 'description', 'og:image': 'image' }
  },
  twitter_card: {
    rowKey: 'name',
    typeProperty: 'twitter:card',
    imageProperties: ['twitter:image'],
    previewFields: {
      'twitter:title': 'title',
      'twitter:description': 'description',
      'twitter:image': 'image'
    }
  }
}

/** The preview templates expect flat scalars for the active locale, not the stored row shape. */
const buildPreviewData = (
  integratorName: string,
  value: unknown,
  locale: string | null
): Record<string, unknown> => {
  if (integratorName === 'title_description') {
    const titleDescription = (value ?? {}) as SeoTitleDescription
    return {
      title: readLocaleValue(titleDescription.title, locale),
      description: readLocaleValue(titleDescription.description, locale)
    }
  }

  const definition = PROPERTY_INTEGRATORS[integratorName]

  if (isNil(definition) || !Array.isArray(value)) {
    return {}
  }

  const data: Record<string, unknown> = {}

  for (const row of value as SeoPropertyRow[]) {
    const property = row[definition.rowKey] ?? ''
    const previewField = definition.previewFields[property]

    if (isNil(previewField)) {
      continue
    }

    data[previewField] = previewField === 'image' ? row.value : readLocaleValue(row.value, locale)
  }

  return data
}

interface IntegratorFieldsProps {
  integrator: SeoIntegrator
  locale: string | null
  disabled?: boolean
  value?: unknown
  onChange?: (value: unknown) => void
}

const IntegratorFields = ({
  integrator,
  locale,
  disabled,
  value,
  onChange
}: IntegratorFieldsProps): React.JSX.Element => {
  const { t } = useTranslation()
  const shared = { config: integrator.config, disabled, locale }

  if (integrator.name === 'title_description') {
    return (
      <TitleDescriptionFields
        { ...shared }
        onChange={ onChange }
        value={ value as SeoTitleDescription | undefined }
      />
    )
  }

  if (integrator.name === 'schema') {
    return (
      <SchemaBlocks
        { ...shared }
        onChange={ onChange }
        value={ value as Parameters<typeof SchemaBlocks>[0]['value'] }
      />
    )
  }

  if (integrator.name === 'html_tag') {
    return (
      <HtmlTags
        { ...shared }
        onChange={ onChange }
        value={ value as string[] | undefined }
      />
    )
  }

  const definition = PROPERTY_INTEGRATORS[integrator.name]

  if (!isNil(definition)) {
    return (
      <PropertyRows
        { ...shared }
        imageProperties={ definition.imageProperties }
        onChange={ onChange }
        rowKey={ definition.rowKey }
        typeProperty={ definition.typeProperty }
        value={ value as SeoPropertyRow[] | undefined }
      />
    )
  }

  // Custom integrators can be registered in the bundle, but they need their own editor here.
  return (
    <Alert
      message={ t('seo.integrator.unsupported', { integrator: integrator.name }) }
      type="warning"
    />
  )
}

export interface IntegratorPreviewPanelProps {
  integrator: SeoIntegrator
  elementType: SeoElementType
  elementId: number
  locale: string | null
}

/**
 * Lives in its own column next to the fields rather than inside the panel it belongs to: the
 * previews are what the editor watches while typing, and a 280px iframe between two form panels
 * pushes everything below it off screen.
 */
export const IntegratorPreviewPanel = ({
  integrator,
  elementType,
  elementId,
  locale
}: IntegratorPreviewPanelProps): React.JSX.Element => {
  const { t } = useTranslation()
  const value = Form.useWatch(integrator.name)
  const templates = integrator.config.livePreviewTemplates ?? []
  const [template, setTemplate] = useState<string | null>(templates[0]?.[0] ?? null)
  const [url, setUrl] = useState<string | null>(null)

  const nextUrl = buildPreviewUrl(
    elementType,
    elementId,
    integrator.name,
    template,
    buildPreviewData(integrator.name, value, locale)
  )

  // Typing in the form would otherwise reload the iframe on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setUrl(nextUrl)
    }, PREVIEW_DEBOUNCE_MS)

    return () => {
      clearTimeout(timeout)
    }
  }, [nextUrl])

  return (
    <FormKit.Panel
      collapsed={ false }
      collapsible
      title={ `${integratorLabel(t, integrator)} — ${t('seo.preview.title')}` }
    >
      <Flex
        gap="small"
        vertical
      >
        { templates.length > 1 && (
          <Select
            onChange={ (next: string) => {
              setTemplate(next)
            } }
            options={ templates.map(([templateValue, label]) => ({ value: templateValue, label })) }
            style={ { maxWidth: 240 } }
            value={ template ?? undefined }
          />
        ) }

        { !isNil(url) && (
          <Iframe
            src={ url }
            style={ { width: '100%', height: 300, border: 0 } }
            title={ t('seo.preview.title') }
          />
        ) }
      </Flex>
    </FormKit.Panel>
  )
}

export interface IntegratorPanelProps {
  integrator: SeoIntegrator
  locale: string | null
  disabled?: boolean
}

export const IntegratorPanel = ({
  integrator,
  locale,
  disabled
}: IntegratorPanelProps): React.JSX.Element => {
  const { t } = useTranslation()

  return (
    <FormKit.Panel
      collapsed={ false }
      collapsible
      title={ integratorLabel(t, integrator) }
    >
      <Form.Item
        name={ integrator.name }
        noStyle
      >
        <IntegratorFields
          disabled={ disabled }
          integrator={ integrator }
          locale={ locale }
        />
      </Form.Item>
    </FormKit.Panel>
  )
}
