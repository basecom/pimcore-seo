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

use OpenApi\Attributes\PathParameter;
use OpenApi\Attributes\Put;
use OpenApi\Attributes\Schema;
use Pimcore\Bundle\StudioBackendBundle\Controller\AbstractApiController;
use Pimcore\Bundle\StudioBackendBundle\OpenApi\Attribute\Request\ReferenceRequestBody;
use Pimcore\Bundle\StudioBackendBundle\OpenApi\Attribute\Response\DefaultResponses;
use Pimcore\Bundle\StudioBackendBundle\OpenApi\Attribute\Response\SuccessResponse;
use Pimcore\Bundle\StudioBackendBundle\Util\Constant\HttpResponseCodes;
use SeoBundle\Studio\OpenApi\Config\Prefix;
use SeoBundle\Studio\OpenApi\Config\Tags;
use SeoBundle\Studio\Schema\SaveMetaDataParameters;
use SeoBundle\Studio\Service\MetaDataService;
use SeoBundle\Studio\Service\MetaDataServiceInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

final class SaveController extends AbstractApiController
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
        name: 'pimcore_studio_api_seo_meta_data_save',
        requirements: ['elementType' => 'object|document', 'elementId' => '\d+'],
        methods: ['PUT']
    )]
    #[Put(
        path: self::OPEN_API_PATH,
        operationId: 'seo_meta_data_save',
        description: 'seo_meta_data_save_description',
        summary: 'seo_meta_data_save_summary',
        tags: [Tags::Seo->value]
    )]
    #[PathParameter(
        name: 'elementType',
        description: 'Element type',
        schema: new Schema(type: 'string', enum: MetaDataService::SUPPORTED_ELEMENT_TYPES)
    )]
    #[PathParameter(name: 'elementId', description: 'Element ID', schema: new Schema(type: 'integer'))]
    #[ReferenceRequestBody(SaveMetaDataParameters::class)]
    #[SuccessResponse(description: 'seo_meta_data_save_success_response')]
    #[DefaultResponses([
        HttpResponseCodes::UNAUTHORIZED,
        HttpResponseCodes::FORBIDDEN,
        HttpResponseCodes::NOT_FOUND,
        HttpResponseCodes::UNPROCESSABLE_CONTENT,
    ])]
    public function saveSeoMetaData(
        string $elementType,
        int $elementId,
        #[MapRequestPayload] SaveMetaDataParameters $parameters
    ): Response {
        $this->metaDataService->save($elementType, $elementId, $parameters);

        return new Response();
    }
}
