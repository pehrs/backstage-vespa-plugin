import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { CatalogApi } from '@backstage/catalog-client';
import { Config } from '@backstage/config';
import { URL } from "url";
import { getStatus } from './v1/status';
import { getVespaClusters } from './v1/clusters';
import { getVespaSchema, getVespaSchemas } from './v1/schemas';
import { getContent } from './v1/debug';
import { getDocCounts } from './v1/docCount';

export interface RouterOptions {
  config: Config;
  logger: Logger;
  catalogApi: CatalogApi;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, catalogApi } = options;


  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.get('/v1/clusters', (request, response) => {
    const verbose = (request.query["verbose"] as string) === "true"
    getVespaClusters(catalogApi, verbose, response);
  });


  router.get('/v1/schemas', (request, response) => {
    const clusterName = (request.query["cluster"] as string)
    if(clusterName) {
      getVespaSchemas(catalogApi, clusterName, response);
    } else {
      response.json({ status: 'no-param', message: "Please provide the cluster query param." });
    }
  });

  router.get('/v1/schema', (request, response) => {
    const clusterName = (request.query["cluster"] as string)
    const schemaName = (request.query["schema"] as string)
    if(clusterName && schemaName) {
      getVespaSchema(catalogApi, clusterName, schemaName, response);
    } else {
      response.json({ status: 'no-param', message: "Please provide the cluster and schema query params." });
    }
  });

  router.get('/v1/content', (request, response) => {
    const clusterName = (request.query["cluster"] as string)
    const contentPath = (request.query["path"] as string)
    if(clusterName && contentPath) {
      getContent(catalogApi, clusterName, contentPath, response);
    } else {
      response.json({ status: 'no-param', message: "Please provide the cluster and path query params." });
    }
  });

  router.get('/v1/doc-counts', (request, response) => {
    const clusterName = (request.query["cluster"] as string)
    if(clusterName) {
      getDocCounts(catalogApi, clusterName, response);
    } else {
      response.json({ status: 'no-param', message: "Please provide the cluster query params." });
    }
  });

  router.use(errorHandler());
  return router;
}
