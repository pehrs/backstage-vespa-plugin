
import { CatalogApi } from '@backstage/catalog-client';

export async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 2000 } = options;

    // const controller = new AbortController();
    // const id = setTimeout(() => {
    //     console.log("WARNING: Timeout calling " + resource);
    //     controller.abort();
    // }, timeout);

    const response = fetch(resource, {
        ...options,
        // signal: controller.signal
        signal: AbortSignal.timeout(timeout)
    });
    // clearTimeout(id);

    return response;
}

export function fetchJson(endpoint: URL): Promise<any> {
    return fetchWithTimeout(endpoint)
        .then(response => response.json())
        .then(theJson => {
            return {
                state: "ok",
                endpoint: endpoint,
                response: theJson,
            }
        })
        .catch(reason => {
            return {
                state: "ERROR",
                endpoint: endpoint,
                reason: reason,
            }
        })
}

export function getEndpointFromCatalogData(clusterCatalogData: any) {
    const links = clusterCatalogData.metadata.links;
    if (links) {
        return links.filter(link => {
            return link.type === "vespa-endpoint"
        }).map(link => {
            return link.url
        }).shift();
    } else {
        return undefined;
    }
}

export async function getEndpoint(catalogApi: CatalogApi, clusterName: string) {
    const vespaCluster = await catalogApi.getEntities({
        // The filter is a logical OR operation
        filter: [
            { 'metadata.name': clusterName }
        ],
    }).then(result => result.items.shift())
    if (vespaCluster === undefined) {
        return undefined;
    }
    return getEndpointFromCatalogData(vespaCluster);
}


// FIXME: Lookup the application config values
// App config values
const tenant = "default";
const application = "default";
const environment = "prod";
const region = "default";
const instance = "default";

export const vespa_content_path_prefix = `/application/v2/tenant/${tenant}/application/${application}/environment/${environment}/region/${region}/instance/${instance}/content`;

export function vespaContentURL(endpoint: string, contentPath: string): URL {
    const url = `${endpoint}${vespa_content_path_prefix}/${contentPath}`
    return new URL(url);
}

export async function fetchVespaContentAsyncDeprecated(catalogApi: CatalogApi, clusterName: string, contentPath: string): Promise<any> {

    const endpoint = await getEndpoint(catalogApi, clusterName);
    if (endpoint === undefined) {
        return undefined;
    }
    return fetch(vespaContentURL(endpoint, contentPath))
}

export async function getEsEndpointFromSvr(srv: string, httpScheme: string) {
    var dns = require('dns');
    // console.log(`srv: ${srv}`)
    const srvLookup = new Promise((resolve, reject) => {
        dns.resolveSrv(srv, function (err, addresses) {
            if (err !== undefined && addresses) {
                console.log('addresses: ' + srv + " => " + JSON.stringify(addresses));
                resolve(addresses);
            } else {
                resolve([]);
            }
        });
    })

    const srvResult: any = await srvLookup;
    // console.log("SRV RESULT", srvResult);

    if (srvResult === undefined) {
        return "";
    }
    if (srvResult.length > 0) {
        const addr = srvResult[0];
        return `${httpScheme}://${addr.name}:${addr.port}`
    }
    return undefined;
}
