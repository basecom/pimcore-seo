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

use Pimcore\Bundle\StudioBackendBundle\Controller\AbstractApiController;

final class Prefix
{
    /**
     * Keep in sync with the route prefix in config/pimcore/routing.yaml.
     */
    public const string BUNDLE = AbstractApiController::PREFIX . '/seo';
}
