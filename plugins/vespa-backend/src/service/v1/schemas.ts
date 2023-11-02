
import { CatalogApi } from '@backstage/catalog-client';
import { Response } from 'express-serve-static-core';
import { fetchJson, getEndpoint } from './utils';


export async function getVespaSchemas(catalogApi: CatalogApi, clusterName: string, response: Response) {
    // /application/v2/tenant/default/application/default/environment/prod/region/default/instance/default/content/schemas/

    // FIXME: Lookup the application config values
    // App config values
    const tenant = "default";
    const application = "default";
    const environment = "prod";
    const region = "default";
    const instance = "default";

    const schemas_path = `/application/v2/tenant/${tenant}/application/${application}/environment/${environment}/region/${region}/instance/${instance}/content/schemas/`;

    const endpoint = await getEndpoint(catalogApi, clusterName);
    if (endpoint === undefined) {
        response.status(404).json({ status: 'not-found', message: `Could not find the vespa cluster ${clusterName} in the backstage catalog!` });
        return
    }


    const url = new URL(`${endpoint}${schemas_path}`)
    fetchJson(url)
        .then(schemasRes => {

            const schemas: string[] = schemasRes.response.map(schema_url => {
                return schema_url.replace(url.toString(), "");
            });

            response.json({
                status: "ok",
                clusterName: clusterName,
                schemas: schemas,
            })
        })
}


export async function getVespaSchema(catalogApi: CatalogApi, clusterName: string, schemaName: string, response: Response) {

    // FIXME: Lookup the application config values
    // App config values
    const tenant = "default";
    const application = "default";
    const environment = "prod";
    const region = "default";
    const instance = "default";

    const schema_path = `/application/v2/tenant/${tenant}/application/${application}/environment/${environment}/region/${region}/instance/${instance}/content/schemas/${schemaName}`;

    const endpoint = await getEndpoint(catalogApi, clusterName);
    if (endpoint === undefined) {
        response.status(404).json({ status: 'not-found', message: `Could not find the vespa cluster ${clusterName} in the backstage catalog!` });
        return
    }

    const url = new URL(`${endpoint}${schema_path}`)
    fetch(url)
        .then(urlResponse => urlResponse.text())
        .then(schema => {
            response.json({
                status: "ok",
                clusterName: clusterName,
                schemaName: schemaName,
                schema: schema,
            })
        })
}