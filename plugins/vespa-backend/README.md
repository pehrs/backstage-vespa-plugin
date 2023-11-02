# vespa

Welcome to the vespa backend plugin!

For information on how to use and configur this plugin take a look at the [root README](../../README.md)

## Developer notes

### Vespa config paths

Application Id (tenant, application and instance):
`:19071/config/v1/cloud.config.application-id`

status ("{environment: .configserverConfig.environment, region: .configserverConfig.region }"):
`:19071/status`

cluster name ("episode" or "content"):
`:19071/config/v2/tenant/default/application/default/cloud.config.cluster-list`

build info:
`:19071/application/v2/tenant/default/application/default/environment/prod/region/default/instance/default/content/build-meta.json`

Admin info:
`:19071/config/v2/tenant/default/application/default/cloud.config.configserver/admin`

ApplicationStatus:
`:19071/ApplicationStatus`

Schema info:
`:19071/config/v2/tenant/default/application/default/search.config.schema-info/content/search/cluster.content`


Cluster controller status page (needs to be looked up in model, figure out which config-node is master and what the application name is (services.xml)):
`:19050/clustercontroller-status/v1/content`


Content (service.xml etc):
`:19071/application/v2/tenant/default/application/default/environment/prod/region/default/instance/default/content`


## TODO

- Add support for declaring all three config nodes in the backstage component
- Add support for (optional) SRV lookup of the config nodes
- Add sservice to browse the application content
- Make sure the services works for more "types" of installations (single node, different group setups)
- Add suport for using the `vespa-system` label instead of having to organize vespa components in systems.
- Add support for filtering on experimental/production clusters.
