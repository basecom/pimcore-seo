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

use Pimcore\Bundle\StudioBackendBundle\Exception\Api\ForbiddenException;
use Pimcore\Bundle\StudioBackendBundle\Exception\Api\InvalidArgumentException;
use Pimcore\Bundle\StudioBackendBundle\Exception\Api\NotFoundException;
use Pimcore\Bundle\StudioBackendBundle\Exception\Api\UserNotFoundException;
use SeoBundle\Studio\Schema\MetaDataConfiguration;
use SeoBundle\Studio\Schema\SaveMetaDataParameters;

interface MetaDataServiceInterface
{
    /**
     * @throws ForbiddenException|InvalidArgumentException|NotFoundException|UserNotFoundException
     */
    public function getConfiguration(string $elementType, int $elementId): MetaDataConfiguration;

    /**
     * @throws ForbiddenException|InvalidArgumentException|NotFoundException|UserNotFoundException
     */
    public function save(string $elementType, int $elementId, SaveMetaDataParameters $parameters): void;

    /**
     * Returns the twig template path and its parameters for the live preview of a single integrator.
     *
     * @param array<string, mixed> $data
     *
     * @return array{path: string, params: array<string, mixed>}
     *
     * @throws ForbiddenException|InvalidArgumentException|NotFoundException|UserNotFoundException
     */
    public function getPreview(
        string $elementType,
        int $elementId,
        string $integratorName,
        ?string $template,
        array $data
    ): array;
}
