import { CatalogApi } from '@backstage/catalog-client';
import { Response } from 'express-serve-static-core';
import { fetchJson, fetchVespaContentAsyncDeprecated, getEndpoint } from '../utils';
const { XMLParser, XMLBuilder, XMLValidator } = require("fast-xml-parser");

function getOrCreateGroup(response: any, groupNameAndKey: any) {
    if (response.groups[groupNameAndKey.name] === undefined) {
        response.groups[groupNameAndKey.name] = {
            name: groupNameAndKey.name,
            distributionKey: groupNameAndKey.distributionKey,
            indices: {},
        }
    }
    return response.groups[groupNameAndKey.name];
}


function getOrCreateGroupIndex(group: any, indexName: string) {
    if (group === undefined) {
        return undefined;
    }
    if (group.indices[indexName] === undefined) {
        group.indices[indexName] = {
            name: indexName,
            docCount: 0,
            memUsageBytes: 0,
            diskUsageBytes: 0,
            tansactionLogUsageBytes: 0,
            matchRate: 0.0,
        }
    }
    return group.indices[indexName];
}


function getDocCountsFromMetrics(metrics: any, services_xml: any, hosts_xml: any): any {

    // const responseSample = {
    //     indexNames: [
    //         "album20230607",
    //         "artist20230607",
    //     ],
    //     groups: {
    //         "group-0-0": {
    //             name: "group-0-0",
    //             distributionKey: 0,
    //             indices: {
    //                 album20230607: {
    //                     name: "album20230607",
    //                     docCount: 9748657,
    //                     memUsageBytes: 61650000000,
    //                     diskUsageBytes: 47000000000,
    //                     tansactionLogUsageBytes: 2000000000,
    //                     matchRate: 255000,
    //                 },
    //                 artist20230607: {
    //                     name: "artist20230607",
    //                     docCount: 9748657,
    //                     memUsageBytes: 61650000000,
    //                     diskUsageBytes: 47000000000,
    //                     tansactionLogUsageBytes: 2000000000,
    //                     matchRate: 255000,
    //                 }
    //             }
    //         }
    //     }
    // }

    const response: any = {
        indexNames: [],
        groups: {},
    }

    const docTypes = new Set<string>();

    metrics.nodes.forEach(nodeData => {
        const hostname = nodeData.hostname;
        const alias = getHostAlias(hosts_xml, hostname);
        const groupNameAndKey = getAliasMainGroupNameAndKey(services_xml, alias);
        nodeData.services.forEach(service => {
            service.metrics.forEach(metric => {
                const values = metric.values;
                const dimensions = metric.dimensions;
                if (dimensions) {
                    var indexName: string | undefined = undefined;
                    if (dimensions["documenttype"]) {
                        indexName = dimensions["documenttype"];
                    }
                    if (indexName && groupNameAndKey) {
                        docTypes.add(indexName)
                        const groupData = getOrCreateGroup(response, groupNameAndKey)
                        groupData.distributionKey = groupNameAndKey.distributionKey;
                        const groupIndexData = getOrCreateGroupIndex(groupData, indexName)
                        if (values["content.proton.documentdb.documents.active.last"]) {
                            groupIndexData.docCount +=
                                parseInt(values["content.proton.documentdb.documents.active.last"]);
                        }
                        if (values["content.proton.documentdb.memory_usage.allocated_bytes.last"]) {
                            groupIndexData.memUsageBytes +=
                                parseInt(values["content.proton.documentdb.memory_usage.allocated_bytes.last"]);
                        }
                        if (values["content.proton.documentdb.disk_usage.last"]) {
                            groupIndexData.diskUsageBytes +=
                                parseInt(values["content.proton.documentdb.disk_usage.last"]);
                        }
                        if (values["content.proton.transactionlog.disk_usage.last"]) {
                            groupIndexData.tansactionLogUsageBytes +=
                                parseInt(values["content.proton.transactionlog.disk_usage.last"]);
                        }
                        if (values["content.proton.documentdb.matching.docs_matched.rate"]) {
                            groupIndexData.matchRate +=
                                parseFloat(values["content.proton.documentdb.matching.docs_matched.rate"]);
                        }
                    }

                }
            })
        })
    });

    response.indexNames = Array.from(docTypes.values()).sort();

    return response;
}

function getHostAlias(hosts_xml: any, hostname: string): string | undefined {
    return hosts_xml.hosts.host
        .filter(hostData => hostData.name === hostname)
        .map(hostData => hostData.alias)
        .shift();
}

function isIterable(obj) {
    // checks for null and undefined
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}

type VespaGroup = {
    name: string;
    distributionKey: string;
};
function getAliasMainGroupNameAndKey(services_xml: any, alias: string | undefined): VespaGroup | undefined {
    if (alias === undefined) {
        console.warn(`alias is undefined, services_xml: ${JSON.stringify(services_xml)}`);
        return undefined;
    }
    if (services_xml === undefined) {
        console.warn(`services_xml is undefined, alias: ${alias}, services_xml: ${JSON.stringify(services_xml)}`);
        return undefined;
    }
    if (services_xml.services === undefined) {
        console.warn(`services_xml.services is undefined, alias: ${alias}, services_xml: ${JSON.stringify(services_xml)}`);
        return undefined;
    }
    if (services_xml.services.content === undefined) {
        console.warn(`services_xml.services.content is undefined, alias: ${alias}, services_xml: ${JSON.stringify(services_xml)}`);
        return undefined;
    }
    if (services_xml.services.content.group === undefined) {
        console.warn(`services_xml.services.content.group is undefined, alias: ${alias}, services_xml: ${JSON.stringify(services_xml)}`);
        return undefined;
    }
    if (services_xml.services.content.group.group === undefined) {
        console.warn(`services_xml.services.content.group.group is undefined, alias: ${alias}, services_xml: ${JSON.stringify(services_xml)}`);
        return undefined;
    }
    if (isIterable(services_xml.services.content.group.group)) {
        return services_xml.services.content.group.group
            .filter(group => {
                if (isIterable(group.node)) {
                    const matches: any[] = group.node
                        .filter(node => node.hostalias === alias)
                    return matches.length > 0
                } else {
                    // Single node element then XML parser will convert to a field instead of array
                    return group.node.hostalias === alias;
                }
            })
            .map(group => {
                return {
                    name: group.name,
                    distributionKey: group["distribution-key"],
                }
            })
            .shift();
    } else {
        // Single group element then XML parser will convert to a field instead of array
        const group = services_xml.services.content.group.group;
        if (isIterable(group.node)) {
            const matches: any[] = group.node
                .filter(node => node.hostalias === alias)
            if (matches.length > 0) {
                return {
                    name: group.name,
                    distributionKey: group["distribution-key"],
                }
            }
        } else {
            // Single node element then XML parser will convert to a field instead of array
            if (group.node.hostalias === alias) {
                return {
                    name: group.name,
                    distributionKey: group["distribution-key"],
                }
            }
        }
        return undefined;
    }
}

export async function getDocCounts(catalogApi: CatalogApi, clusterName: string, response: Response) {

    const endpoint = await getEndpoint(catalogApi, clusterName);
    if (endpoint === undefined) {
        response.status(404).json({ status: 'not-found', message: `Could not find the vespa cluster ${clusterName} in the backstage catalog!` });
        return
    }
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: ""
    });

    const services_xml = await fetchVespaContentAsyncDeprecated(catalogApi, clusterName, "services.xml")
        .then(urlResponse => urlResponse.text())
        .then(xmlText => parser.parse(xmlText));
    const hosts_xml = await fetchVespaContentAsyncDeprecated(catalogApi, clusterName, "hosts.xml")
        .then(urlResponse => urlResponse.text())
        .then(xmlText => parser.parse(xmlText));

    const metricsUrl = new URL(`${endpoint}/metrics/v2/values`)
    fetchJson(metricsUrl)
        .then(result => result.response)
        .then(metrics => {
            response.json({
                status: "ok",
                clusterName: clusterName,
                docCounts: getDocCountsFromMetrics(metrics, services_xml, hosts_xml),
            })
        })
}
