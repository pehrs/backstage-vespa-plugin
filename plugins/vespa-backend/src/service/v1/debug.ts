
import { CatalogApi } from '@backstage/catalog-client';
import { Response } from 'express-serve-static-core';
import { getEndpoint } from './utils';

export async function fetchVespaContentAsync(catalogApi: CatalogApi, clusterName: string, contentPath: string): Promise<any> {
    // FIXME: Lookup the application config values
    // App config values
    const tenant = "default";
    const application = "default";
    const environment = "prod";
    const region = "default";
    const instance = "default";

    const schema_path = `/application/v2/tenant/${tenant}/application/${application}/environment/${environment}/region/${region}/instance/${instance}/content/${contentPath}`;

    const endpoint = await getEndpoint(catalogApi, clusterName);
    if (endpoint === undefined) {
        return undefined;
    }

    const url = new URL(`${endpoint}${schema_path}`)
    return fetch(url)
}

export async function getContent(catalogApi: CatalogApi, clusterName: string, contentPath: string, response: Response) {

    // FIXME: Lookup the application config values
    // App config values
    const tenant = "default";
    const application = "default";
    const environment = "prod";
    const region = "default";
    const instance = "default";

    const schema_path = `/application/v2/tenant/${tenant}/application/${application}/environment/${environment}/region/${region}/instance/${instance}/content/${contentPath}`;

    const endpoint = await getEndpoint(catalogApi, clusterName);
    if (endpoint === undefined) {
        response.status(404).json({ status: 'not-found', message: `Could not find the vespa cluster ${clusterName} in the backstage catalog!` });
        return
    }

    const url = new URL(`${endpoint}${schema_path}`)
    fetch(url)
        .then(urlResponse => urlResponse.text())
        .then(data => {
            response.json({
                status: "ok",
                clusterName: clusterName,
                contentPath: contentPath,
                data: data,
            })
        })
}