import { CatalogApi } from '@backstage/catalog-client';
import { Response } from 'express-serve-static-core';
import { fetchJson, fetchWithTimeout, vespaContentURL } from '../utils';
const { XMLParser } = require("fast-xml-parser");
import { getDocCountsFromMetrics } from '../vespaMetrics';

export async function getDocCounts(catalogApi: CatalogApi, clusterName:string, endpoint: string, response: Response) {

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: ""
    });

    const services_xml = await fetchWithTimeout(vespaContentURL(endpoint, "services.xml"))
        .then(urlResponse => urlResponse.text())
        .then(xmlText => parser.parse(xmlText));
    const hosts_xml = await fetchWithTimeout(vespaContentURL(endpoint, "hosts.xml"))
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