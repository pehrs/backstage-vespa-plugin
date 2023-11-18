
import { CatalogApi } from '@backstage/catalog-client';
import { fetchJson, fetchWithTimeout, getEndpointFromCatalogData, getEsEndpointFromSvr, vespaContentURL } from '../utils';
import { XMLParser } from 'fast-xml-parser';


function getLabel(clusterData: any, labelName: string, defaultValue: string | undefined = undefined): string | undefined {
    if (clusterData === undefined || clusterData.metadata === undefined) {
        return defaultValue;
    }
    const labels = clusterData.metadata.label;
    if (labels) {
        const regionData = labels.filter(label => label[labelName] !== undefined)
            .shift();
        if (regionData) {
            return regionData[labelName]
        }
        return defaultValue;
    } else {
        return defaultValue;
    }
}

function getOrCreate(obj: object, fieldName: string): object {
    if ((fieldName in obj) === false) {
        obj[fieldName] = {};
    }
    return obj[fieldName];
}

const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: ""
});

function getServicesXml(endpoint: string, clusterName: string, region: string) {
    console.log("getServicesXml(): endpoint", endpoint);

    return fetchWithTimeout(vespaContentURL(endpoint, "services.xml"))
        .then(response => response.text())
        .then(xmlText => xmlParser.parse(xmlText))
        .then(servicesXml => {
            return {
                state: "ok",
                endpoint: endpoint,
                cluster: clusterName,
                region: region,
                response: servicesXml,
            }
        }).catch(reason => {
            return {
                state: "ERROR",
                endpoint: endpoint,
                reason: reason,
            }
        });
}

export async function getVespaClusters(catalogApi: CatalogApi, verbose: boolean, response) {

    const collectedRegions = new Set<string>();
    const clusters: any = {}
    const vespaClusters = await catalogApi.getEntities({
        // The filter is a logical OR operation
        filter: [
            { 'metadata.tags': 'vespa' }
        ],
    })

    const srvLookupPromises: Promise<any>[] = [];
    const servicesXmlPromises: Promise<any>[] = [];

    vespaClusters.items.forEach(catalogData => {
        const clusterName = catalogData.metadata.name;
        const clusterEndpoint: string | undefined = getLabel(catalogData, "vespa-plugin/endpoint");
        const clusterRegions: string | undefined = getLabel(catalogData, "vespa-plugin/regions");
        if (clusterEndpoint) {
            const cluster: any = getOrCreate(clusters, clusterName);
            // cluster.endpoint = clusterEndpoint;
            if (clusterRegions) {
                clusterRegions.split(",").forEach(regionName => {
                    collectedRegions.add(regionName);
                    const reg: any = getOrCreate(cluster, regionName);
                    var endpoint = clusterEndpoint
                        .replace("{region}", regionName);
                    if (endpoint.indexOf("srv:") != -1) {
                        // HTTP
                        // servicesXmlPromises.push(getServicesXml(endpoint, clusterName, regionName));
                        // } else {
                        // SRV lookup needed
                        endpoint = endpoint.replace("srv:", "");
                        srvLookupPromises.push(getEsEndpointFromSvr(endpoint, "http")
                            .then(endpoint => {
                                console.log("srv endpoint", endpoint);
                                if (endpoint !== undefined) {
                                    reg.endpoint = endpoint;
                                    servicesXmlPromises.push(getServicesXml(endpoint, clusterName, regionName));
                                }
                            })
                        );
                    } else {
                        reg.endpoint = endpoint;
                        servicesXmlPromises.push(getServicesXml(endpoint, clusterName, regionName));
                    }
                })
            } else {
                // No regions declared then let's use "details"
                collectedRegions.add("details");
                const reg: any = getOrCreate(cluster, "details");
                reg.endpoint = clusterEndpoint;

                const endpoint = clusterEndpoint;
                servicesXmlPromises.push(getServicesXml(endpoint, clusterName, "details"));
            }
        }
    });


    // Make sure all SRV lookups are done
    const res: any[] = (await Promise.all(srvLookupPromises));

    // Wait for services xml
    (await Promise.all(servicesXmlPromises)).forEach(result => {
        console.log("result", result);
        if (result.state === "ok") {
            const clusterName = result.cluster;
            const region = result.region;
            // const endpoint = result["endpoint"];
            const clusterData = getOrCreate(clusters, clusterName);
            if (clusterData) {
                const data: any = getOrCreate(clusterData, region);
                if (data) {
                    const servicesXml = result.response;
                    const services = servicesXml["services"];
                    if (services) {
                        const content = services["content"];
                        if (content) {
                            const contentId: string = content["id"];
                            data.contentId = contentId;
                            const endpointUrl = new URL(data.endpoint);
                            // FIXME: The port number should be looked up from the vespa model.
                            data.controllerLink = `${endpointUrl.protocol}//${endpointUrl.hostname}:19050/clustercontroller-status/v1/${contentId}`;
                        }
                    }
                }
            }
        }
    });


    const filteredClusters: any = {};

    // for (const [clusterName, cluster] of Object.entries<[string,any]>(clusters))
    for (const clusterName of Object.keys(clusters)) {
        const cluster = clusters[clusterName];
        var endpointFound = false;
        for (const region of Object.keys(cluster)) {
            const regionData = cluster[region];
            if (regionData.endpoint !== undefined) {
                endpointFound = true;
                break;
            }
        }
        if (endpointFound) {
            filteredClusters[clusterName] = cluster;
        }
    }

    const result = {
        status: "ok",
        regions: Array.from(collectedRegions.values()).sort(),
        clusters: filteredClusters,
    };
    response.status(200).json(result);

}