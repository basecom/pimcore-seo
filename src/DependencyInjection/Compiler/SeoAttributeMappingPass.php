<?php

namespace SeoBundle\DependencyInjection\Compiler;

use Doctrine\ORM\Mapping\Driver\AttributeDriver;
use Doctrine\Persistence\Mapping\Driver\MappingDriverChain;
use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Definition;
use Symfony\Component\DependencyInjection\Reference;

class SeoAttributeMappingPass implements CompilerPassInterface
{
    public function process(ContainerBuilder $container): void
    {
        // Optionales Feature-Flag wie bisher
        if ($container->hasParameter('seo.persistence.doctrine.enabled')
            && !$container->getParameter('seo.persistence.doctrine.enabled')) {
            return;
        }

        // Manager aus Parameter übernehmen (string|array) – fallback: 'default'
        $managers = ['default'];
        if ($container->hasParameter('seo.persistence.doctrine.manager')) {
            $param = $container->getParameter('seo.persistence.doctrine.manager');
            $managers = is_array($param) ? $param : [$param];
        }

        // Unser AttributeDriver: NUR $paths, KEIN 2. Argument!
        $paths = [\dirname(__DIR__, 2) . '/src/Model']; // -> passe an, falls deine Entities woanders liegen
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
            // Namespace deiner Entities
            $chainDef->addMethodCall('addDriver', [new Reference($driverId), 'SeoBundle\\Model']);
        }
    }

}
