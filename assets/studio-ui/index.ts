import { type IAbstractPlugin } from '@pimcore/studio-ui-bundle'
import { SeoModule } from './seo-module'

export const SeoPlugin: IAbstractPlugin = {
  name: 'SeoPlugin',

  onStartup ({ moduleSystem }) {
    moduleSystem.registerModule(SeoModule)
  }
}
