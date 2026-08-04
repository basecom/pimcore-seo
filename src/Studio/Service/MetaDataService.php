<?php

declare(strict_types=1);

/*
 * This source file is available under two different licenses:
 *   - GNU General Public License version 3 (GPLv3)
 *   - DACHCOM Commercial License (DCL)
 * Full copyright and license information is available in
 * LICENSE.md which is distributed with this source code.
 *
 * @copyright  Copyright (c) DACHCOM.DIGITAL AG (https://www.dachcom-digital.com)
 * @license    GPLv3 and DCL
 */

namespace SeoBundle\Studio\Service;

use Pimcore\Bundle\StudioBackendBundle\Element\Service\ElementServiceInterface;
use Pimcore\Bundle\StudioBackendBundle\Exception\Api\InvalidArgumentException;
use Pimcore\Bundle\StudioBackendBundle\Security\Service\SecurityServiceInterface;
use Pimcore\Bundle\StudioBackendBundle\Util\Constant\ElementPermissions;
use Pimcore\Model\DataObject;
use Pimcore\Model\Document;
use Pimcore\Model\Element\ElementInterface;
use SeoBundle\Manager\ElementMetaDataManagerInterface;
use SeoBundle\Studio\Schema\MetaDataConfiguration;
use SeoBundle\Studio\Schema\SaveMetaDataParameters;
use SeoBundle\Tool\LocaleProviderInterface;

final readonly class MetaDataService implements MetaDataServiceInterface
{
    /**
     * Element types the SEO meta data integrators can be attached to.
     * These are also the values persisted in `seo_element_meta_data.elementType`.
     */
    public const array SUPPORTED_ELEMENT_TYPES = ['object', 'document'];

    public function __construct(
        private ElementServiceInterface $elementService,
        private SecurityServiceInterface $securityService,
        private ElementMetaDataManagerInterface $elementMetaDataManager,
        private LocaleProviderInterface $localeProvider
    ) {
    }

    public function getConfiguration(string $elementType, int $elementId): MetaDataConfiguration
    {
        $element = $this->getAllowedElement($elementType, $elementId);
        $integrators = $this->getIntegrators($element);

        if (count($integrators) === 0) {
            return new MetaDataConfiguration(integrators: [], availableLocales: [], draft: false, data: []);
        }

        $elementBackendData = $this->elementMetaDataManager->getElementDataForBackend($elementType, $elementId);

        return new MetaDataConfiguration(
            integrators: $integrators,
            availableLocales: $element instanceof DataObject\AbstractObject
                ? $this->localeProvider->getAllowedLocalesForObject($element)
                : [],
            draft: $elementBackendData['isDraft'] === true,
            data: $elementBackendData['data']
        );
    }

    public function save(string $elementType, int $elementId, SaveMetaDataParameters $parameters): void
    {
        $element = $this->getAllowedElement($elementType, $elementId);

        $this->securityService->hasElementPermission(
            $element,
            $this->securityService->getCurrentUser(),
            ElementPermissions::SAVE_PERMISSION
        );

        $enabledIntegratorNames = $this->getEnabledIntegratorNames($element);
        $integratorValues = $parameters->getIntegratorValues();

        // validate the whole payload first, a rejected integrator must not leave half of it persisted
        foreach ($integratorValues as $integratorName => $integratorData) {
            if (!in_array($integratorName, $enabledIntegratorNames, true)) {
                throw new InvalidArgumentException(sprintf('Meta data integrator "%s" is not enabled', $integratorName));
            }

            // Values are stored with merging disabled, so coercing a malformed payload to an empty
            // array would delete everything held for that integrator instead of rejecting the call.
            if (!is_array($integratorData)) {
                throw new InvalidArgumentException(sprintf('Values for meta data integrator "%s" must be an array, %s given', $integratorName, get_debug_type($integratorData)));
            }
        }

        foreach ($integratorValues as $integratorName => $integratorData) {
            $this->elementMetaDataManager->saveElementData(
                $elementType,
                $elementId,
                $integratorName,
                $integratorData,
                false,
                $parameters->getReleaseType()
            );
        }
    }

    public function getPreview(
        string $elementType,
        int $elementId,
        string $integratorName,
        ?string $template,
        array $data
    ): array {
        $element = $this->getAllowedElement($elementType, $elementId);

        if (!in_array($integratorName, $this->getEnabledIntegratorNames($element), true)) {
            throw new InvalidArgumentException(sprintf('Meta data integrator "%s" is not enabled', $integratorName));
        }

        $previewData = $this->elementMetaDataManager->generatePreviewDataForElement(
            $elementType,
            $elementId,
            $integratorName,
            $template,
            $data
        );

        if (!isset($previewData['path'])) {
            throw new InvalidArgumentException(sprintf('Meta data integrator "%s" has no live preview', $integratorName));
        }

        return $previewData;
    }

    private function getAllowedElement(string $elementType, int $elementId): ElementInterface
    {
        if (!in_array($elementType, self::SUPPORTED_ELEMENT_TYPES, true)) {
            throw new InvalidArgumentException(sprintf('Unsupported element type "%s"', $elementType));
        }

        return $this->elementService->getAllowedElementById(
            $elementType,
            $elementId,
            $this->securityService->getCurrentUser()
        );
    }

    /**
     * @return array<int, array{name: string, config: array<string, mixed>}>
     */
    private function getIntegrators(ElementInterface $element): array
    {
        $enabledIntegratorNames = $this->getEnabledIntegratorNames($element);

        if (count($enabledIntegratorNames) === 0) {
            return [];
        }

        $backendConfiguration = $this->elementMetaDataManager->getMetaDataIntegratorBackendConfiguration($element);

        $integrators = [];
        foreach ($enabledIntegratorNames as $integratorName) {
            $integrators[] = [
                'name'   => $integratorName,
                'config' => $backendConfiguration[$integratorName] ?? []
            ];
        }

        return $integrators;
    }

    /**
     * Empty as soon as the element is not covered by the bundle configuration – the editor tab
     * uses that to tell the user SEO meta data is switched off for this element.
     *
     * @return array<int, string>
     */
    private function getEnabledIntegratorNames(ElementInterface $element): array
    {
        $configuration = $this->elementMetaDataManager->getMetaDataIntegratorConfiguration();

        if (!$this->isEnabledForElement($element, $configuration)) {
            return [];
        }

        return array_column($configuration['enabled_integrator'], 'integrator_name');
    }

    /**
     * @param array<string, mixed> $configuration
     */
    private function isEnabledForElement(ElementInterface $element, array $configuration): bool
    {
        // mirrors the checks the removed ExtJS plugin did before it attached a panel
        if ($element instanceof Document) {
            return ($configuration['documents']['enabled'] ?? false) === true && $element->getType() === 'page';
        }

        if ($element instanceof DataObject\Concrete) {
            return ($configuration['objects']['enabled'] ?? false) === true
                && in_array($element->getClassName(), $configuration['objects']['data_classes'] ?? [], true);
        }

        return false;
    }
}
