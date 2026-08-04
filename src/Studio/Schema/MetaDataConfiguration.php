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

namespace SeoBundle\Studio\Schema;

use OpenApi\Attributes\Items;
use OpenApi\Attributes\Property;
use OpenApi\Attributes\Schema;
use Pimcore\Bundle\StudioBackendBundle\Util\Schema\AdditionalAttributesInterface;
use Pimcore\Bundle\StudioBackendBundle\Util\Trait\AdditionalAttributesTrait;

/**
 * Everything the SEO editor tab needs for one element: which integrators are enabled,
 * their form schema, the locales the current user may edit and the stored values.
 *
 * An empty integrator list means SEO meta data is not enabled for this element.
 */
#[Schema(
    schema: 'SeoMetaDataConfiguration',
    title: 'SEO Meta Data Configuration',
    required: ['integrators', 'availableLocales', 'draft', 'data'],
    type: 'object'
)]
final class MetaDataConfiguration implements AdditionalAttributesInterface
{
    use AdditionalAttributesTrait;

    /**
     * @param array<int, array{name: string, config: array<string, mixed>}> $integrators
     * @param array<int, string>                                           $availableLocales
     * @param array<string, mixed>                                         $data
     */
    public function __construct(
        #[Property(
            description: 'Enabled integrators in rendering order, each with its form schema',
            type: 'array',
            items: new Items(type: 'object')
        )]
        private readonly array $integrators,
        #[Property(
            description: 'Locales the current user may edit. Empty for non localized elements.',
            type: 'array',
            items: new Items(type: 'string')
        )]
        private readonly array $availableLocales,
        #[Property(description: 'Whether the returned values come from an unpublished draft', type: 'boolean')]
        private readonly bool $draft,
        #[Property(description: 'Stored values, keyed by integrator name', type: 'object')]
        private readonly array $data
    ) {
    }

    /**
     * @return array<int, array{name: string, config: array<string, mixed>}>
     */
    public function getIntegrators(): array
    {
        return $this->integrators;
    }

    /**
     * @return array<int, string>
     */
    public function getAvailableLocales(): array
    {
        return $this->availableLocales;
    }

    public function isDraft(): bool
    {
        return $this->draft;
    }

    /**
     * @return array<string, mixed>
     */
    public function getData(): array
    {
        return $this->data;
    }
}
