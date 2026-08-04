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

use OpenApi\Attributes\Property;
use OpenApi\Attributes\Schema;
use SeoBundle\Model\ElementMetaDataInterface;
use Symfony\Component\Validator\Constraints as Assert;

#[Schema(
    schema: 'SeoSaveMetaDataParameters',
    title: 'SEO Save Meta Data Parameters',
    required: ['integratorValues'],
    type: 'object'
)]
final readonly class SaveMetaDataParameters
{
    public const string TASK_PUBLISH = 'publish';

    public const string TASK_DRAFT = 'draft';

    public const array TASKS = [self::TASK_PUBLISH, self::TASK_DRAFT];

    /**
     * @param array<string, mixed> $integratorValues
     */
    public function __construct(
        #[Assert\Type('array')]
        #[Property(
            description: 'Values per integrator, keyed by integrator name. Integrators that are left out stay untouched.',
            type: 'object'
        )]
        private array $integratorValues = [],
        #[Assert\Choice(choices: self::TASKS)]
        #[Property(description: 'Whether to publish the values or store them as draft', type: 'string', enum: self::TASKS)]
        private string $task = self::TASK_PUBLISH
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function getIntegratorValues(): array
    {
        return $this->integratorValues;
    }

    public function getReleaseType(): string
    {
        return $this->task === self::TASK_PUBLISH
            ? ElementMetaDataInterface::RELEASE_TYPE_PUBLIC
            : ElementMetaDataInterface::RELEASE_TYPE_DRAFT;
    }
}
