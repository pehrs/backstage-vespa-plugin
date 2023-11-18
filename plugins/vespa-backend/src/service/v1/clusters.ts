
import { CatalogApi } from '@backstage/catalog-client';
import { fetchJson, fetchWithTimeout, getEndpointFromCatalogData, vespaContentURL } from '../utils';
import { XMLParser } from 'fast-xml-parser';

function getSystemName(clusterData: any) {
    const relations = clusterData.relations;
    if (relations) {
        return relations.filter(relation => {
            return relation.target.kind === "system"
        }).map(relation => {
            return relation.target.name
        }).shift();
    } else {
        return undefined;
    }
}


function getRegion(clusterData: any) {
    const labels = clusterData.metadata.label;
    if (labels) {
        const regionData = labels.filter(label => label["vespa-region"] !== undefined)
            .shift();
        if (regionData) {
            return regionData["vespa-region"]
        }
        return undefined;
    } else {
        return undefined;
    }
}

// clusterData[cluster.metadata.name] = {
//     name: cluster.metadata.name,
//     region: region,
//     endpoint: endpoint,
//     systemName: systemName,
// }
function findEndpointData(clusterData: any, endpointHostname: string): any {
    for (const clusterName in clusterData) {
        const data = clusterData[clusterName];
        const ep: URL = new URL(data.endpoint);
        if (ep.hostname === endpointHostname) {
            return data;
        }
    }
    return undefined;
}

function getSummary(data: any): any {
    const sum = (...arr: number[]) => [...arr].reduce((acc, val) => acc + val, 0);

    // const docCountTotal = sum(...data.nodes.flatMap(nodeData => {
    //     return nodeData.services.flatMap(service => {
    //         return service.metrics.map(metric => {
    //             const values = metric.values;
    //             const dimensions = metric.dimensions;
    //             if(dimensions && values["content.proton.documentdb.documents.total.last"]) {
    //                 return parseInt(values["content.proton.documentdb.documents.total.last"]);
    //             } else {
    //                 return 0;
    //             }
    //         })
    //     })
    // }));
    var docCountTotal = 0;
    var diskUsageTotal = 0;
    var memUsageTotal = 0;

    data.nodes.forEach(nodeData => {
        nodeData.services.forEach(service => {
            service.metrics.forEach(metric => {
                const values = metric.values;
                const dimensions = metric.dimensions;
                if (dimensions) {
                    if (values["content.proton.documentdb.documents.total.last"]) {
                        docCountTotal += parseInt(values["content.proton.documentdb.documents.total.last"]);
                    }
                    if (values["content.proton.transactionlog.disk_usage.last"]) {
                        diskUsageTotal += parseInt(values["content.proton.transactionlog.disk_usage.last"]);
                    }
                    if (values["content.proton.documentdb.memory_usage.allocated_bytes.last"]) {
                        memUsageTotal += parseInt(values["content.proton.documentdb.memory_usage.allocated_bytes.last"])
                    }
                }
            })
        })
    });
    return {
        docCountTotal: docCountTotal,
        diskUsageTotal: diskUsageTotal,
        memUsageTotal: memUsageTotal,
    }
}


function getDocTypes(data: any): any {

    const docTypes = new Set<string>();

    data.nodes.forEach(nodeData => {
        nodeData.services.forEach(service => {
            service.metrics.forEach(metric => {
                const values = metric.values;
                const dimensions = metric.dimensions;
                if (dimensions && dimensions["documenttype"]) {
                    docTypes.add(dimensions["documenttype"])
                }
            })
        })
    });
    return Array.from(docTypes.values()).sort();
}

export async function getVespaClusters(catalogApi: CatalogApi, verbose: boolean, response) {

    const vespaClusters = await catalogApi.getEntities({
        // The filter is a logical OR operation
        filter: [
            { 'metadata.tags': 'vespa' }
        ],
    })

    const metricPromises: Promise<any>[] = [];
    const servicesXmlPromises: Promise<any>[] = [];

    const clusterNames: string[] = [];
    const systemClusters: any = {};
    //const clusterEndpoints: any = {};
    const clusterData: any = {};
    const regions = new Set<string>();
    const systemNames = new Set<string>();

    vespaClusters.items.forEach(clusterCatalogData => {
        const systemName = getSystemName(clusterCatalogData);
        if (systemName) {
            systemNames.add(systemName);
        }

        const endpoint = getEndpointFromCatalogData(clusterCatalogData);
        // clusterEndpoints[cluster.metadata.name] =  endpoint

        if (endpoint) {

            if (verbose) {
                metricPromises.push(fetchJson(new URL(`${endpoint}/metrics/v2/values`)))
            }

            const parser = new XMLParser({
                ignoreAttributes: false,
                attributeNamePrefix: ""
            });

            servicesXmlPromises.push(fetchWithTimeout(vespaContentURL(endpoint, "services.xml"))
                .then(response => response.text())
                .then(xmlText => parser.parse(xmlText))
                .then(servicesXml => {
                    return {
                        state: "ok",
                        endpoint: endpoint,
                        cluster: clusterCatalogData.metadata.name,
                        response: servicesXml,
                    }
                }).catch(reason => {
                    return {
                        state: "ERROR",
                        endpoint: endpoint,
                        reason: reason,
                    }
                }));

            clusterNames.push(clusterCatalogData.metadata.name)
            if (systemName) {
                var sysClusterNames = systemClusters[systemName];
                if (sysClusterNames === undefined) {
                    sysClusterNames = [];
                }
                sysClusterNames.push(clusterCatalogData.metadata.name);
                systemClusters[systemName] = sysClusterNames;
            }

            const region = getRegion(clusterCatalogData);
            if (region) {
                regions.add(region);
            }
            clusterData[clusterCatalogData.metadata.name] = {
                name: clusterCatalogData.metadata.name,
                region: region,
                endpoint: endpoint,
                systemName: systemName,
            }
        }
    });

    (await Promise.all(metricPromises)).forEach(result => {
        if (result.status === "ok") {
            const endpoint = result["endpoint"];
            const data = findEndpointData(clusterData, endpoint.hostname)
            if (data) {
                data["summary"] = getSummary(result.response)
                data["doctypes"] = getDocTypes(result.response)
            }
        }
    });

    (await Promise.all(servicesXmlPromises)).forEach(result => {
        if (result.status === "ok") {
            const endpoint = new URL(result["endpoint"]);
            const data = findEndpointData(clusterData, endpoint.hostname)
            if (data) {
                const servicesXml = result.response;
                const services = servicesXml["services"];
                if (services) {
                    const content = services["content"];
                    if (content) {
                        const contentId: string = content["id"];
                        data["contentId"] = contentId;
                    }
                }
            }
        }
    });

    const result = {
        status: "ok",
        verbose: verbose,
        regions: Array.from(regions.values()).sort(),
        systemNames: Array.from(systemNames.values()).sort(),
        systemClusters: systemClusters,
        clusterNames: clusterNames.sort(),
        clusters: clusterData,
    };
    response.status(200).json(result);
}