import React, { useContext } from 'react'
import {
  DataObjectContext,
  LanguageSelection,
  useDataObjectDraft
} from '@pimcore/studio-ui-bundle/modules/data-object'

export const SEO_TAB_KEY = 'seo.meta-data'

/**
 * Studio puts the language switcher in the editor footer, but its own entry only renders on the
 * `edit`, `listing` and `variants` tabs — a hardcoded list a plugin tab cannot join. Registering the
 * same component for our tab keeps one switcher visible at all times, and it drives the shared
 * language state, so switching on the SEO tab and on the Edit tab is the same switch.
 */
export const SeoLanguageSwitcher = (): React.JSX.Element => {
  const { id } = useContext(DataObjectContext)
  const { activeTab } = useDataObjectDraft(id)

  if (activeTab !== SEO_TAB_KEY) {
    return <></>
  }

  return <LanguageSelection />
}

export default SeoLanguageSwitcher
