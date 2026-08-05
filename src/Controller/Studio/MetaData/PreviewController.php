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
use OpenApi\Attributes\PathParameter;
use OpenApi\Attributes\QueryParameter;
use OpenApi\Attributes\Schema;
use Pimcore\Bundle\StudioBackendBundle\Controller\AbstractApiController;
use Pimcore\Bundle\StudioBackendBundle\Exception\Api\InvalidArgumentException;
use Pimcore\Bundle\StudioBackendBundle\OpenApi\Attribute\Response\Content\MediaType;
use Pimcore\Bundle\StudioBackendBundle\OpenApi\Attribute\Response\DefaultResponses;
use Pimcore\Bundle\StudioBackendBundle\OpenApi\Attribute\Response\SuccessResponse;
use Pimcore\Bundle\StudioBackendBundle\Util\Constant\HttpResponseCodes;
use SeoBundle\Studio\OpenApi\Config\Prefix;
use SeoBundle\Studio\OpenApi\Config\Tags;
use SeoBundle\Studio\Service\MetaDataService;
use SeoBundle\Studio\Service\MetaDataServiceInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryParameter;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

/**
 * Renders the live preview (SERP snippet, Facebook card, Twitter card) of a single integrator as
 * a standalone HTML document. The editor tab shows it in an iframe, which is why this endpoint
 * answers with HTML instead of JSON and takes its payload from the query string.
 */
final class PreviewController extends AbstractApiController
{
    private const string ROUTE = '/meta-data/{elementType}/{elementId}/preview';

    private const string OPEN_API_PATH = Prefix::BUNDLE . self::ROUTE;

    public function __construct(
        SerializerInterface $serializer,
        private readonly MetaDataServiceInterface $metaDataService
    ) {
        parent::__construct($serializer);
    }

    #[Route(
        path: self::ROUTE,
        name: 'pimcore_studio_api_seo_meta_data_preview',
        requirements: ['elementType' => 'object|document', 'elementId' => '\d+'],
        methods: ['GET']
    )]
    #[Get(
        path: self::OPEN_API_PATH,
        operationId: 'seo_meta_data_preview',
        description: 'seo_meta_data_preview_description',
        summary: 'seo_meta_data_preview_summary',
        tags: [Tags::Seo->value]
    )]
    #[PathParameter(
        name: 'elementType',
        description: 'Element type',
        schema: new Schema(type: 'string', enum: MetaDataService::SUPPORTED_ELEMENT_TYPES)
    )]
    #[PathParameter(name: 'elementId', description: 'Element ID', schema: new Schema(type: 'integer'))]
    #[QueryParameter(
        name: 'integrator',
        description: 'Integrator name',
        required: true,
        schema: new Schema(type: 'string')
    )]
    #[QueryParameter(
        name: 'template',
        description: 'Preview template of the integrator',
        schema: new Schema(type: 'string')
    )]
    #[QueryParameter(
        name: 'data',
        description: 'JSON encoded, not yet persisted integrator values to preview',
        schema: new Schema(type: 'string')
    )]
    #[SuccessResponse(description: 'seo_meta_data_preview_success_response', content: new MediaType('text/html'))]
    #[DefaultResponses([
        HttpResponseCodes::UNAUTHORIZED,
        HttpResponseCodes::FORBIDDEN,
        HttpResponseCodes::NOT_FOUND,
        HttpResponseCodes::UNPROCESSABLE_CONTENT,
    ])]
    public function getSeoMetaDataPreview(
        string $elementType,
        int $elementId,
        #[MapQueryParameter] string $integrator,
        #[MapQueryParameter] ?string $template = null,
        #[MapQueryParameter] ?string $data = null
    ): Response {
        $previewData = $this->metaDataService->getPreview(
            $elementType,
            $elementId,
            $integrator,
            $template,
            $this->decodeData($data)
        );

        $response = $this->render($previewData['path'], $previewData['params']);

        // The document renders metadata the editor has not published yet, and it arrives in the query
        // string because an `<iframe src>` cannot POST. Keep it out of shared and browser caches at
        // least; the URL itself still reaches access logs, which is why the payload is limited to the
        // fields being previewed. Moving it out of the URL needs a short-lived server-side token.
        $response->setPrivate();
        $response->headers->addCacheControlDirective('no-store');

        return $response;
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeData(?string $data): array
    {
        if ($data === null || $data === '') {
            return [];
        }

        try {
            $decoded = json_decode($data, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $exception) {
            throw new InvalidArgumentException('Query parameter "data" is not valid JSON', $exception);
        }

        return is_array($decoded) ? $decoded : [];
    }
}
