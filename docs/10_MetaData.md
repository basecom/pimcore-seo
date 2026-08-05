# Metadata Section
There are two important things within the metadata section: integrators and extractors.

## Integrators
Integrator allows you to define metadata in backend context. There are several pre-configured integrators, but it's also possible to add your own.
It's possible to enable metadata editing on documents and/or objects.

Enable metadata on documents/objects:

```yaml
seo:
    meta_data_configuration:
        meta_data_integrator:
            documents:
                enabled: true
            objects:
                enabled: true
                data_classes:
                    - MyObjectClass
```

The enabled integrators are what the [Studio API](./30_StudioUi.md) reports as the form schema for an
element, so this configuration decides which fields the editor renders and which elements it covers at all.
Since 4.x the bundle no longer ships the editor itself — a Studio UI module in your project does.

Read more about integrators and how to use them [here](./MetaData/10_Integrator.md).

## Extractors
Every extractor will extract structured data from a given object/document.
Read more about integrators and how to use them [here](./MetaData/20_Extractors.md).
 
## More Information
- [Integrators](./MetaData/10_Integrator.md)
  - [Title & Description Integrator](./MetaData/Integrator/10_TitleDescriptionIntegrator.md)
  - [Open Graph Integrator](./MetaData/Integrator/11_OpenGraphIntegrator.md)
  - [Twitter Card Integrator](./MetaData/Integrator/12_TwitterCardIntegrator.md)
  - [Schema Integrator](./MetaData/Integrator/13_SchemaIntegrator.md)
  - [HTML-Tag Integrator](./MetaData/Integrator/14_HtmlTagIntegrator.md)
- [Studio UI](./30_StudioUi.md)
- [Extractors](./MetaData/20_Extractors.md)
  - [Custom Extractor](./MetaData/Extractor/10_CustomExtractor.md)
  
  
## Full Configuration Example

```yaml
seo:
    meta_data_configuration:
        meta_data_provider:
            auto_detect_documents: true
        meta_data_integrator:
            documents:
                enabled: true
            objects:
                enabled: true
                data_classes:
                    - MyObjectClass
            enabled_integrator:
                -   integrator_name: title_description
                -   integrator_name: open_graph
                    integrator_config:
                        facebook_image_thumbnail: 'socialThumb'
                -   integrator_name: html_tag
```