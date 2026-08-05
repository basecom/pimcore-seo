import React, { useCallback, useEffect, useRef, useState } from 'react'
import { isEmpty, isNil } from 'lodash'
import { eventBus, eventTypes } from '@pimcore/studio-ui-bundle'
import {
  Alert,
  Content,
  Form,
  FormKit,
  Skeleton,
  SplitLayout,
  useMessage
} from '@pimcore/studio-ui-bundle/components'
import { useTranslation } from '@pimcore/studio-ui-bundle/app'
import { trackError, GeneralError } from '@pimcore/studio-ui-bundle/modules/app'
import { checkElementPermission, useElementContext } from '@pimcore/studio-ui-bundle/modules/element'
import {
  type PostUpdateEventPayload,
  SaveTaskType,
  useDataObjectDraft,
  useLanguageSelection
} from '@pimcore/studio-ui-bundle/modules/data-object'
import {
  fetchMetaDataConfiguration,
  saveMetaData,
  type SeoElementType,
  type SeoIntegrator,
  type SeoMetaDataConfiguration
} from '../api'
import { IntegratorPanel, IntegratorPreviewPanel } from './integrator-panel'

/** SEO meta data is stored per Pimcore element type; Studio names data objects differently. */
const toSeoElementType = (elementType: string): SeoElementType | null => {
  if (elementType === 'data-object') {
    return 'object'
  }

  return elementType === 'document' ? 'document' : null
}

const hasPreview = (integrator: SeoIntegrator): boolean => integrator.config.hasLivePreview === true

export const SeoTab = (): React.JSX.Element => {
  const { t } = useTranslation()
  const messageApi = useMessage()
  const { id, elementType } = useElementContext()
  const { dataObject, markObjectDataAsModified } = useDataObjectDraft(id)
  const { currentLanguage, hasLocalizedFields, setHasLocalizedFields } = useLanguageSelection()
  const [form] = Form.useForm<Record<string, unknown>>()

  const [configuration, setConfiguration] = useState<SeoMetaDataConfiguration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  // Reloads race: switching elements re-creates `load` while a request is in flight, and saving
  // triggers another. Only the newest request may write, or a stale payload lands in the form
  // and the next save persists it to the wrong element.
  const loadGeneration = useRef(0)

  const seoElementType = toSeoElementType(elementType)

  const load = useCallback(async (): Promise<void> => {
    if (isNil(seoElementType)) {
      return
    }

    const generation = ++loadGeneration.current
    setIsLoading(true)

    try {
      const loaded = await fetchMetaDataConfiguration(seoElementType, id)

      if (generation !== loadGeneration.current) {
        return
      }

      setConfiguration(loaded)
      form.resetFields()
      form.setFieldsValue(loaded.data)
      setLoadError(null)
    } catch (error: unknown) {
      if (generation !== loadGeneration.current) {
        return
      }

      setLoadError(error instanceof Error ? error.message : t('seo.error.load'))
    } finally {
      if (generation === loadGeneration.current) {
        setIsLoading(false)
      }
    }
  }, [form, id, seoElementType, t])

  useEffect(() => {
    void load()
  }, [load])

  const persist = useCallback(async (task: 'publish' | 'draft'): Promise<void> => {
    if (isNil(seoElementType) || isNil(configuration)) {
      return
    }

    const values = form.getFieldsValue()

    try {
      // Only enabled integrators are sent; leaving one out would keep its stored values untouched.
      const integratorValues: Record<string, unknown> = {}
      for (const integrator of configuration.integrators) {
        integratorValues[integrator.name] = values[integrator.name] ?? []
      }

      await saveMetaData(seoElementType, id, integratorValues, task)
      await load()
    } catch (error: unknown) {
      const message = error instanceof Error && error.message !== ''
        ? error.message
        : t('seo.error.save')
      if (!(error instanceof Error)) {
        trackError(new GeneralError(message))
      }
      await messageApi.error(message)
    }
  }, [configuration, form, id, load, messageApi, seoElementType, t])

  /**
   * SEO data has no save button of its own — it rides along with the element, the way the Classic
   * panel hooked `postSaveObject`. Studio publishes this event once the object is stored and
   * carries the task, so "Save draft" writes a draft and "Save & Publish" publishes.
   */
  useEffect(() => {
    if (isNil(seoElementType)) {
      return
    }

    const subscriber = eventBus.subscribe(
      { type: eventTypes['data-object:editor:post-update'], id: String(id) },
      (event) => {
        const { task } = event.payload as PostUpdateEventPayload

        if (task === SaveTaskType.AutoSave || task === SaveTaskType.Unpublish) {
          return
        }

        void persist(task === SaveTaskType.Publish ? 'publish' : 'draft')
      }
    )

    return () => {
      eventBus.unsubscribe(subscriber)
    }
  }, [id, persist, seoElementType])

  const localizedIntegrator = configuration?.integrators.some(
    (integrator) => integrator.config.useLocalizedFields === true
  ) === true

  const hasEditableLocale = (configuration?.availableLocales.length ?? 0) > 0

  /**
   * Classes without localized attributes do not get the footer language switcher by default, but
   * SEO titles are localized regardless — so ask for it, the same way the localized field controls do.
   */
  useEffect(() => {
    if (!localizedIntegrator || !hasEditableLocale || hasLocalizedFields) {
      return
    }

    setHasLocalizedFields(true)
  }, [hasEditableLocale, hasLocalizedFields, localizedIntegrator, setHasLocalizedFields])

  if (isNil(seoElementType)) {
    return (
      <Content padded>
        <Alert
          message={ t('seo.error.unsupported-element') }
          type="warning"
        />
      </Content>
    )
  }

  if (isLoading) {
    return (
      <Content padded>
        <Skeleton active />
      </Content>
    )
  }

  if (!isNil(loadError)) {
    return (
      <Content padded>
        <Alert
          message={ loadError }
          type="error"
        />
      </Content>
    )
  }

  if (isNil(configuration) || configuration.integrators.length === 0) {
    return (
      <Content padded>
        <Alert
          message={ t('seo.not-enabled') }
          type="info"
        />
      </Content>
    )
  }

  // A user without any editable language would write plain strings where the backend expects
  // locale rows — which it answers by deleting the stored entry. Read-only is the safe mode.
  const missingEditableLocale = localizedIntegrator && !hasEditableLocale

  const canSave = (checkElementPermission(dataObject?.permissions, 'save') ||
    checkElementPermission(dataObject?.permissions, 'publish')) && !missingEditableLocale

  // The footer switcher walks the object's languages, which is a superset of the SEO locales only
  // when a language was added after the SEO configuration — fall back instead of writing nowhere.
  const locale = configuration.availableLocales.includes(currentLanguage)
    ? currentLanguage
    : configuration.availableLocales[0] ?? null

  const previewIntegrators = configuration.integrators.filter(hasPreview)

  const fields = (
    <Content
      gap="small"
      overflow={ { x: 'hidden', y: 'auto' } }
      padded
    >
      { missingEditableLocale && (
        <Alert
          message={ t('seo.no-editable-locale') }
          type="warning"
        />
      ) }

      { configuration.draft && (
        <Alert
          message={ t('seo.draft-note') }
          type="info"
        />
      ) }

      { configuration.integrators.map((integrator) => (
        <IntegratorPanel
          disabled={ !canSave }
          integrator={ integrator }
          key={ integrator.name }
          locale={ integrator.config.useLocalizedFields === true ? locale : null }
        />
      )) }
    </Content>
  )

  const previews = (
    <Content
      gap="small"
      overflow={ { x: 'hidden', y: 'auto' } }
      padded
    >
      { previewIntegrators.map((integrator) => (
        <IntegratorPreviewPanel
          elementId={ id }
          elementType={ seoElementType }
          integrator={ integrator }
          key={ integrator.name }
          locale={ integrator.config.useLocalizedFields === true ? locale : null }
        />
      )) }
    </Content>
  )

  return (
    <FormKit
      formProps={ {
        form,
        disabled: !canSave,
        layout: 'vertical',
        // Marks the editor dirty so the element's own save buttons and the unsaved-changes
        // warning cover SEO edits too.
        onValuesChange: markObjectDataAsModified
      } }
      wrapInPanel={ false }
    >
      { previewIntegrators.length === 0
        ? fields
        : (
          <SplitLayout
            leftItem={ { size: 60, minSize: 30, children: fields } }
            resizeAble
            rightItem={ { size: 40, minSize: 20, children: previews } }
            withDivider
          />
          ) }
    </FormKit>
  )
}

export default SeoTab
