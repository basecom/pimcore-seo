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

namespace SeoBundle\Controller\Studio\MetaData;

use OpenApi\Attributes\Get;
use OpenApi\Attributes\JsonContent;
use OpenApi\Attributes\PathParameter;
use OpenApi\Attributes\Schema;
use Pimcore\Bundle\StudioBackendBundle\Controller\AbstractApiController;
use Pimcore\Bundle\StudioBackendBundle\OpenApi\Attribute\Response\DefaultResponses;
use Pimcore\Bundle\StudioBackendBundle\OpenApi\Attribute\Response\SuccessResponse;
use Pimcore\Bundle\StudioBackendBundle\Util\Constant\HttpResponseCodes;
use SeoBundle\Studio\OpenApi\Config\Prefix;
use SeoBundle\Studio\OpenApi\Config\Tags;
use SeoBundle\Studio\Schema\MetaDataConfiguration;
use SeoBundle\Studio\Service\MetaDataService;
use SeoBundle\Studio\Service\MetaDataServiceInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

final class ConfigurationController extends AbstractApiController
{
    private const string ROUTE = '/meta-data/{elementType}/{elementId}';

    private const string OPEN_API_PATH = Prefix::BUNDLE . self::ROUTE;

    public function __construct(
        SerializerInterface $serializer,
        private readonly MetaDataServiceInterface $metaDataService
    ) {
        parent::__construct($serializer);
    }

    #[Route(
        path: self::ROUTE,
        name: 'pimcore_studio_api_seo_meta_data_configuration',
        requirements: ['elementType' => 'object|document', 'elementId' => '\d+'],
        methods: ['GET']
    )]
    #[Get(
        path: self::OPEN_API_PATH,
        operationId: 'seo_meta_data_configuration',
        description: 'seo_meta_data_configuration_description',
        summary: 'seo_meta_data_configuration_summary',
        tags: [Tags::Seo->value]
    )]
    #[PathParameter(
        name: 'elementType',
        description: 'Element type',
        schema: new Schema(type: 'string', enum: MetaDataService::SUPPORTED_ELEMENT_TYPES)
    )]
    #[PathParameter(name: 'elementId', description: 'Element ID', schema: new Schema(type: 'integer'))]
    #[SuccessResponse(
        description: 'seo_meta_data_configuration_success_response',
        content: new JsonContent(ref: MetaDataConfiguration::class)
    )]
    #[DefaultResponses([
        HttpResponseCodes::UNAUTHORIZED,
        HttpResponseCodes::FORBIDDEN,
        HttpResponseCodes::NOT_FOUND,
        HttpResponseCodes::UNPROCESSABLE_CONTENT,
    ])]
    public function getSeoMetaDataConfiguration(string $elementType, int $elementId): JsonResponse
    {
        return $this->jsonResponse($this->metaDataService->getConfiguration($elementType, $elementId));
    }
}
