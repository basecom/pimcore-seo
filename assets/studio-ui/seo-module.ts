import React from 'react'
import { type AbstractModule, container } from '@pimcore/studio-ui-bundle'
import { serviceIds } from '@pimcore/studio-ui-bundle/app'
import { Icon } from '@pimcore/studio-ui-bundle/components'
import { componentConfig, type ComponentRegistry } from '@pimcore/studio-ui-bundle/modules/app'
import { type ObjectTabManager } from '@pimcore/studio-ui-bundle/modules/data-object'
import SeoTab from './components/seo-tab'
import SeoLanguageSwitcher, { SEO_TAB_KEY } from './components/seo-language-switcher'

export const SeoModule: AbstractModule = {
  onInit: (): void => {
    const tab = {
      key: SEO_TAB_KEY,
      label: 'SEO',
      icon: React.createElement(Icon, { value: 'seo' }),
      children: React.createElement(SeoTab),
      // The tab tells the user itself when SEO is switched off for the class, because whether an
      // element is covered is bundle configuration the frontend does not know up front.
      workspacePermission: 'view'
    }

    container
      .get<ObjectTabManager>(serviceIds['DataObject/Editor/ObjectTabManager'])
      .register(tab)

    // VariantTabManager is not re-exported by the SDK, but it is the same TabManager shape.
    container
      .get<ObjectTabManager>(serviceIds['DataObject/Editor/VariantTabManager'])
      .register(tab)

    container
      .get<ComponentRegistry>(serviceIds['App/ComponentRegistry/ComponentRegistry'])
      // Between Studio's own language switcher (200) and the language comparison button (300).
      .registerToSlot(componentConfig.dataObject.editor.toolbar.slots.left.name, {
        name: 'seoLanguageSelection',
        component: SeoLanguageSwitcher,
        priority: 250
      })
  }
}
