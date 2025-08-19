<?php

namespace SeoBundle\DependencyInjection\Compiler;

use Doctrine\ORM\Mapping\Driver\AttributeDriver;
use Doctrine\Persistence\Mapping\Driver\MappingDriverChain;
use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Definition;
use Symfony\Component\DependencyInjection\Reference;

final class SeoAttributeMappingPass implements CompilerPassInterface
{
    public function process(ContainerBuilder $container): void
    {
        // Feature-Flag
        if ($container->hasParameter('seo.persistence.doctrine.enabled')
            && !$container->getParameter('seo.persistence.doctrine.enabled')) {
            return;
        }

        // use configured manager or default
        $managers = ['default'];
        if ($container->hasParameter('seo.persistence.doctrine.manager')) {
            $param = $container->getParameter('seo.persistence.doctrine.manager');
            $managers = is_array($param) ? $param : [$param];
        }

        $paths = [\dirname(__DIR__, 2) . '/Model'];
        $driverDef = new Definition(AttributeDriver::class, [$paths]);
        $driverId  = 'seo.attribute_metadata_driver';
        $container->setDefinition($driverId, $driverDef);

        foreach ($managers as $em) {
            $chainId = $em === 'default'
                ? 'doctrine.orm.default_metadata_driver'
                : sprintf('doctrine.orm.%s_metadata_driver', $em);

            if (!$container->hasDefinition($chainId)) {
                continue;
            }

            $chainDef = $container->getDefinition($chainId); /** @var Definition $chainDef */
            // Entity Namespace
            $chainDef->addMethodCall('addDriver', [new Reference($driverId), 'SeoBundle\\Model']);
        }
    }

}
