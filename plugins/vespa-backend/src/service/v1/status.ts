import { CatalogApi } from '@backstage/catalog-client';
import { fetchJson } from '../utils';

// @deprecated: should not be used
export async function getStatus(catalogApi: CatalogApi, endpoint: URL, response) {

    const vespaClusters = await catalogApi.getEntities({
        // The filter is a logical OR operation
        filter: [ 
            { 'metadata.tags': 'vespa' }
        ],
    })
    const appIdPromise = fetchJson(new URL(`${endpoint.toString()}/config/v1/cloud.config.application-id`));
    const statusPromise = fetchJson(new URL(`${endpoint.toString()}/status`));

    // FIXME: Error handling!
    const appId = (await appIdPromise).response;
    const status = (await statusPromise).response;

    appId["env"] = status["configserverConfig"]["environment"]
    appId["region"] = status["configserverConfig"]["region"]

    const tenant = appId.tenant;
    const app = appId.application;
    const instance = appId.instance;
    const env = appId.env;
    const region = appId.region;

    const clusterListPromise = fetchJson(new URL(`${endpoint.toString()}/config/v2/tenant/${tenant}/application/${app}/cloud.config.cluster-list`))
    const buildInfoPromise = fetchJson(new URL(`${endpoint.toString()}/application/v2/tenant/${tenant}/application/${app}/environment/${env}/region/${region}/instance/${instance}/content/build-meta.json`))

    const buildInfo = (await buildInfoPromise).response;
    const clusterList = (await clusterListPromise).response;

    const clusterInfoPromises = clusterList.storage.map(clusterInfo => {
        const clusterId = clusterInfo["configid"];
        return [clusterId, fetchJson(new URL(`${endpoint.toString()}/config/v2/tenant/default/application/default/search.config.schema-info/${clusterId}/search/cluster.content`))]
    })
    const clusterInfos = (await Promise.all(clusterInfoPromises))

    const result = {
        status: "ok",
        endpoint: endpoint,
        appId: appId,
        clusterList: clusterList,
        buildInfo: buildInfo,
    };

    response.status(200).json(result);
}