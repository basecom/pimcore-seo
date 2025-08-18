<?php

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

namespace SeoBundle\Model;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'seo_queue_entry')]
class QueueEntry implements QueueEntryInterface
{
    #[ORM\Id]
    #[ORM\Column(name: 'uuid', type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    protected string $uuid;
    #[ORM\Column(name: '`type`', type: 'string', nullable: false)]
    protected string $type;
    #[ORM\Column(name: 'data_type', type: 'string', nullable: false)]
    protected string $dataType;
    #[ORM\Column(name: 'data_id', type: 'integer', nullable: false)]
    protected int $dataId;
    #[ORM\Column(name: 'data_url', type: 'text', nullable: false)]
    protected string $dataUrl;
    #[ORM\Column(name: 'worker', type: 'string', nullable: false)]
    protected string $worker;
    #[ORM\Column(name: 'resource_processor', type: 'string', nullable: false)]
    protected string $resourceProcessor;
    #[ORM\Column(name: 'creation_date', type: 'datetime', nullable: false)]
    protected \DateTime $creationDate;

    public function setUuid(string $uuid): void
    {
        $this->uuid = $uuid;
    }

    public function getUuid(): string
    {
        return $this->uuid;
    }

    public function setType(string $type): void
    {
        $this->type = $type;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function setDataId($dataId): void
    {
        $this->dataId = $dataId;
    }

    public function getDataId(): int
    {
        return $this->dataId;
    }

    public function setDataType(string $dataType): void
    {
        $this->dataType = $dataType;
    }

    public function getDataType(): string
    {
        return $this->dataType;
    }

    public function setDataUrl(string $dataUrl): void
    {
        $this->dataUrl = $dataUrl;
    }

    public function getDataUrl(): string
    {
        return $this->dataUrl;
    }

    public function setWorker(string $worker): void
    {
        $this->worker = $worker;
    }

    public function getWorker(): string
    {
        return $this->worker;
    }

    public function setResourceProcessor(string $resourceProcessor): void
    {
        $this->resourceProcessor = $resourceProcessor;
    }

    public function getResourceProcessor(): string
    {
        return $this->resourceProcessor;
    }

    public function setCreationDate(\DateTime $date): void
    {
        $this->creationDate = $date;
    }

    public function getCreationDate(): \DateTime
    {
        return $this->creationDate;
    }
}
