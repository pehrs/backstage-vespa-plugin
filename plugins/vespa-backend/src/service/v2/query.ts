import { CatalogApi } from '@backstage/catalog-client';
import { Response } from 'express-serve-static-core';
import { fetchJson, fetchWithTimeout, vespaContentURL } from '../utils';
const { XMLParser } = require("fast-xml-parser");
import { getDocCountsFromMetrics } from '../vespaMetrics';

export async function runQuery(queryEndpoint: string, yql: string, response: Response) {

    // curl -s "http://f0020407.ip.gae2.spotify.net:8080/search/" 
    // -X POST 
    // -H "content-type:application/json" 
    // -d '{"yql": "SELECT * from album20230607 where true limit 5;"}'
    const queryUrl = new URL(`${queryEndpoint}/search/`)
    fetchWithTimeout(queryUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            yql: yql,
        })
    })
        .then((result:globalThis.Response) => result.json())
        .then(yqlQueryResponse => {
            response.json({
                status: "ok",
                // clusterName: clusterName,
                queryResponse: yqlQueryResponse,
            })
        })

}