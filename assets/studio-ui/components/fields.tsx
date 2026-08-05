import React from 'react'
import { isNil, isString } from 'lodash'
import {
  Alert,
  Button,
  Dropdown,
  Flex,
  Form,
  IconButton,
  ImagePicker,
  Input,
  Select,
  Space,
  TextArea
} from '@pimcore/studio-ui-bundle/components'
import { useTranslation } from '@pimcore/studio-ui-bundle/app'
import { isAllowed } from '@pimcore/studio-ui-bundle/modules/auth'
import type { ImagePickerValue } from '@pimcore/studio-ui-bundle/components'
import type {
  SeoAssetReference,
  SeoHtmlTagPreset,
  SeoIntegratorConfig,
  SeoLocaleValue,
  SeoPropertyPreset,
  SeoPropertyRow,
  SeoSchemaBlock,
  SeoTitleDescription,
  SeoValue
} from '../api'

const ADD_PERMISSION = 'seo_bundle_add_property'
const REMOVE_PERMISSION = 'seo_bundle_remove_property'

export interface FieldProps<T> {
  value?: T
  onChange?: (value: T) => void
  config: SeoIntegratorConfig
  /** Active locale, or `null` when the integrator stores plain values. */
  locale: string | null
  disabled?: boolean
}

/**
 * Locale aware values are stored as `[{locale, value}]`. Reading and writing goes through the
 * active locale only, but every locale stays in the form value so saving never drops a language.
 */
export const readLocaleValue = (value: SeoValue | undefined, locale: string | null): string => {
  if (isNil(value)) {
    return ''
  }

  if (isString(value)) {
    return value
  }

  if (Array.isArray(value)) {
    return value.find((row) => row.locale === locale)?.value ?? ''
  }

  return ''
}

const writeLocaleValue = (value: SeoValue | undefined, locale: string | null, next: string): SeoValue => {
  if (isNil(locale)) {
    return next === '' ? null : next
  }

  // An explicit null tells the backend to drop that locale instead of keeping the old value.
  const row: SeoLocaleValue = { locale, value: next === '' ? null : next }
  const rows: SeoLocaleValue[] = Array.isArray(value) ? [...value] : []
  const index = rows.findIndex((existing) => existing.locale === locale)

  if (index === -1) {
    rows.push(row)
  } else {
    rows[index] = row
  }

  return rows
}

const toImagePickerValue = (value: SeoValue | undefined): ImagePickerValue | null => {
  if (isNil(value) || isString(value) || Array.isArray(value)) {
    return null
  }

  return { type: 'asset', id: value.id, fullPath: value.fullPath ?? '' }
}

const toAssetReference = (value: ImagePickerValue | null): SeoAssetReference | null => {
  if (isNil(value)) {
    return null
  }

  return { type: 'asset', id: value.id, fullPath: value.fullPath }
}

/** `properties` rows are `[key, label, xliffExportAware]`, `types` rows are `[label, value]`. */
const propertyOptions = (config: SeoIntegratorConfig): Array<{ value: string, label: string }> =>
  (config.properties ?? []).map(([key, label]) => ({ value: key, label: label !== '' ? label : key }))

const typeOptions = (config: SeoIntegratorConfig): Array<{ value: string, label: string }> =>
  (config.types ?? []).map(([label, value]) => ({ value, label }))

export const TitleDescriptionFields = ({
  value,
  onChange,
  locale,
  disabled
}: FieldProps<SeoTitleDescription>): React.JSX.Element => {
  const { t } = useTranslation()

  const update = (field: 'title' | 'description', next: string): void => {
    onChange?.({ ...value, [field]: writeLocaleValue(value?.[field], locale, next) })
  }

  return (
    <>
      <Form.Item label={ t('seo.field.title') }>
        <Input
          disabled={ disabled }
          onChange={ (event) => {
            update('title', event.target.value)
          } }
          value={ readLocaleValue(value?.title, locale) }
        />
      </Form.Item>

      <Form.Item label={ t('seo.field.description') }>
        <TextArea
          disabled={ disabled }
          onChange={ (event) => {
            update('description', event.target.value)
          } }
          rows={ 3 }
          value={ readLocaleValue(value?.description, locale) }
        />
      </Form.Item>
    </>
  )
}

export interface PropertyRowsProps extends FieldProps<SeoPropertyRow[]> {
  /** `property` for open_graph, `name` for twitter_card. */
  rowKey: 'property' | 'name'
  /** The property whose value is picked from `config.types` (og:type, twitter:card). */
  typeProperty: string
  /** Properties whose value is an image asset (og:image, twitter:image). */
  imageProperties: string[]
}

export const PropertyRows = ({
  value,
  onChange,
  config,
  locale,
  disabled,
  rowKey,
  typeProperty,
  imageProperties
}: PropertyRowsProps): React.JSX.Element => {
  const { t } = useTranslation()
  const rows = value ?? []
  const canAdd = isAllowed(ADD_PERMISSION)
  const canRemove = isAllowed(REMOVE_PERMISSION)
  const presets = (config.presets ?? []) as SeoPropertyPreset[]

  const replaceRow = (index: number, row: SeoPropertyRow): void => {
    onChange?.(rows.map((existing, i) => (i === index ? row : existing)))
  }

  const setProperty = (index: number, property: string): void => {
    // The value shape depends on the property, so switching it always resets the value.
    replaceRow(index, { [rowKey]: property, value: null })
  }

  const renderValue = (row: SeoPropertyRow, index: number): React.JSX.Element => {
    const property = row[rowKey] ?? ''

    if (property === typeProperty) {
      return (
        <Select
          allowClear
          disabled={ disabled }
          onChange={ (next: string | undefined) => {
            replaceRow(index, { ...row, value: next ?? null })
          } }
          options={ typeOptions(config) }
          placeholder={ t('seo.field.type') }
          value={ isString(row.value) ? row.value : undefined }
        />
      )
    }

    if (imageProperties.includes(property)) {
      return (
        <ImagePicker
          allowedTypes={ ['image'] }
          disabled={ disabled }
          onChange={ (next) => {
            replaceRow(index, { ...row, value: toAssetReference(next) })
          } }
          type="add"
          value={ toImagePickerValue(row.value) }
        />
      )
    }

    return (
      <Input
        disabled={ disabled }
        onChange={ (event) => {
          replaceRow(index, { ...row, value: writeLocaleValue(row.value, locale, event.target.value) })
        } }
        placeholder={ t('seo.field.content') }
        value={ readLocaleValue(row.value, locale) }
      />
    )
  }

  return (
    <Flex
      gap="small"
      vertical
    >
      { rows.map((row, index) => (
        <Flex
          align="flex-start"
          gap="small"
          key={ `${row[rowKey] ?? 'row'}-${index}` }
          wrap
        >
          { /* Wrapping instead of a fixed width: the fields share a column with the preview, and a
               property select wide enough for `twitter:creator:id` leaves the value nothing. */ }
          <Select
            disabled={ disabled }
            onChange={ (next: string) => {
              setProperty(index, next)
            } }
            options={ propertyOptions(config) }
            placeholder={ t('seo.field.property') }
            style={ { flex: '1 1 180px' } }
            value={ row[rowKey] !== '' ? row[rowKey] : undefined }
          />

          <div style={ { flex: '2 1 220px' } }>{ renderValue(row, index) }</div>

          { canRemove && (
            <IconButton
              disabled={ disabled }
              icon={ { value: 'trash' } }
              onClick={ () => {
                onChange?.(rows.filter((_, i) => i !== index))
              } }
              title={ t('seo.action.remove') }
            />
          ) }
        </Flex>
      )) }

      { canAdd && (
        <Space size="small">
          <Button
            disabled={ disabled }
            onClick={ () => {
              onChange?.([...rows, { [rowKey]: '', value: null }])
            } }
          >
            { t('seo.action.add-property') }
          </Button>

          { presets.length > 0 && (
            <Dropdown
              menu={ {
                items: presets.map((preset, presetIndex) => ({
                  key: `${preset.label}-${presetIndex}`,
                  label: preset.label,
                  onClick: () => {
                    const added = (preset.fields ?? []).map((field) => ({
                      [rowKey]: field.property,
                      value: field.content ?? null
                    }))
                    onChange?.([...rows, ...added])
                  }
                }))
              } }
            >
              <Button disabled={ disabled }>{ t('seo.action.add-preset') }</Button>
            </Dropdown>
          ) }
        </Space>
      ) }
    </Flex>
  )
}

export const SchemaBlocks = ({
  value,
  onChange,
  config,
  locale,
  disabled
}: FieldProps<SeoSchemaBlock[]>): React.JSX.Element => {
  const { t } = useTranslation()
  const blocks = value ?? []
  const localized = config.useLocalizedFields === true
  const canAdd = isAllowed(ADD_PERMISSION)
  const canRemove = isAllowed(REMOVE_PERMISSION)
  const addedTypes = Object.entries(config.dynamicallyAddedJsonLdDataTypes ?? {})

  return (
    <Flex
      gap="small"
      vertical
    >
      <Alert
        message={ t('seo.schema.usage-note') }
        type="info"
      />

      { config.hasDynamicallyAddedJsonLdData === true && addedTypes.length > 0 && (
        <Alert
          message={ t('seo.schema.dynamic-note', {
            types: addedTypes.map(([type, count]) => `${type} (${count})`).join(', ')
          }) }
          type="warning"
        />
      ) }

      { blocks.map((block, index) => (
        <Flex
          align="flex-start"
          gap="small"
          key={ block.identifier }
        >
          <TextArea
            disabled={ disabled }
            onChange={ (event) => {
              const next = localized
                ? writeLocaleValue(block.data, locale, event.target.value)
                : event.target.value
              onChange?.(
                blocks.map((existing, i) =>
                  i === index ? { ...existing, data: next as SeoSchemaBlock['data'] } : existing
                )
              )
            } }
            rows={ 8 }
            spellCheck={ false }
            style={ { flex: 1, fontFamily: 'monospace' } }
            value={ readLocaleValue(block.data, localized ? locale : null) }
          />

          { canRemove && (
            <IconButton
              disabled={ disabled }
              icon={ { value: 'trash' } }
              onClick={ () => {
                onChange?.(blocks.filter((_, i) => i !== index))
              } }
              title={ t('seo.action.remove') }
            />
          ) }
        </Flex>
      )) }

      { canAdd && (
        <Button
          disabled={ disabled }
          onClick={ () => {
            onChange?.([
              ...blocks,
              {
                // The backend keys locale rows by identifier, so it has to be stable and unique.
                identifier: `si${Date.now()}${blocks.length}`,
                localized,
                data: localized ? [] : ''
              }
            ])
          } }
        >
          { t('seo.action.add-schema') }
        </Button>
      ) }
    </Flex>
  )
}

export const HtmlTags = ({
  value,
  onChange,
  config,
  disabled
}: FieldProps<string[]>): React.JSX.Element => {
  const { t } = useTranslation()
  const tags = value ?? []
  const presets = (config.presets ?? []) as SeoHtmlTagPreset[]
  const presetsOnly = config.presets_only_mode === true
  const canAdd = isAllowed(ADD_PERMISSION)
  const canRemove = isAllowed(REMOVE_PERMISSION)

  return (
    <Flex
      gap="small"
      vertical
    >
      { !presetsOnly && (
        <Alert
          message={ t('seo.html-tag.caution-note') }
          type="warning"
        />
      ) }

      { tags.map((tag, index) => (
        <Flex
          align="flex-start"
          gap="small"
          key={ index }
        >
          <TextArea
            disabled={ disabled }
            onChange={ (event) => {
              onChange?.(tags.map((existing, i) => (i === index ? event.target.value : existing)))
            } }
            // presets_only_mode is what keeps editors from adding arbitrary markup.
            readOnly={ presetsOnly }
            rows={ 2 }
            spellCheck={ false }
            style={ { flex: 1, fontFamily: 'monospace' } }
            value={ tag }
          />

          { canRemove && (
            <IconButton
              disabled={ disabled }
              icon={ { value: 'trash' } }
              onClick={ () => {
                onChange?.(tags.filter((_, i) => i !== index))
              } }
              title={ t('seo.action.remove') }
            />
          ) }
        </Flex>
      )) }

      { canAdd && (
        <Space size="small">
          { !presetsOnly && (
            <Button
              disabled={ disabled }
              onClick={ () => {
                onChange?.([...tags, ''])
              } }
            >
              { t('seo.action.add-html-tag') }
            </Button>
          ) }

          { presets.length > 0 && (
            <Dropdown
              menu={ {
                items: presets.map((preset, presetIndex) => ({
                  key: `${preset.label}-${presetIndex}`,
                  label: preset.label,
                  onClick: () => {
                    onChange?.([...tags, preset.value])
                  }
                }))
              } }
            >
              <Button disabled={ disabled }>{ t('seo.action.add-preset') }</Button>
            </Dropdown>
          ) }
        </Space>
      ) }
    </Flex>
  )
}
