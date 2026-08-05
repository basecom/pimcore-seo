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

namespace SeoBundle\Studio\OpenApi\Config;

use OpenApi\Attributes\Tag;

#[Tag(
    name: Tags::Seo->value,
    description: 'seo_tag_description',
)]
enum Tags: string
{
    case Seo = 'SEO';
}
