import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { CatalogApi } from '@backstage/catalog-client';
import { Config } from '@backstage/config';
import { URL } from "url";
import { getStatus } from './v1/status';
import { getVespaClusters as getVespaClustersV1 } from './v1/clusters';
import { getVespaClusters as getVespaClustersV2 } from './v2/clusters';
import { getVespaSchema as getVespaSchemaV1, getVespaSchemas as getVespaSchemasV1 } from './v1/schemas';
import { getVespaSchema as getVespaSchemaV2, getVespaSchemas as getVespaSchemasV2 } from './v2/schemas';
import { getContent as getContentV1 } from './v1/debug';
import { getContent as getContentV2 } from './v2/content';
import { getDocCounts as getDocCountsV1 } from './v1/docCount';
import { getDocCounts as getDocCountsV2 } from './v2/docCounts';

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
    getVespaClustersV1(catalogApi, verbose, response);
  });


  router.get('/v1/schemas', (request, response) => {
    const clusterName = (request.query["cluster"] as string)
    if (clusterName) {
      getVespaSchemasV1(catalogApi, clusterName, response);
    } else {
      response.json({ status: 'no-param', message: "Please provide the cluster query param." });
    }
  });

  router.get('/v1/schema', (request, response) => {
    const clusterName = (request.query["cluster"] as string)
    const schemaName = (request.query["schema"] as string)
    if (clusterName && schemaName) {
      getVespaSchemaV1(catalogApi, clusterName, schemaName, response);
    } else {
      response.json({ status: 'no-param', message: "Please provide the cluster and schema query params." });
    }
  });

  router.get('/v1/content', (request, response) => {
    const clusterName = (request.query["cluster"] as string)
    const contentPath = (request.query["path"] as string)
    if (clusterName && contentPath) {
      getContentV1(catalogApi, clusterName, contentPath, response);
    } else {
      response.json({ status: 'no-param', message: "Please provide the cluster and path query params." });
    }
  });

  router.get('/v1/doc-counts', (request, response) => {
    const clusterName = (request.query["cluster"] as string)
    if (clusterName) {
      getDocCountsV1(catalogApi, clusterName, response);
    } else {
      response.json({ status: 'no-param', message: "Please provide the cluster query params." });
    }
  });

  // V2

  router.get('/v2/clusters', (request, response) => {
    const verbose = (request.query["verbose"] as string) === "true"
    getVespaClustersV2(catalogApi, verbose, response);
  });

  router.get('/v2/doc-counts', (request, response) => {
    const clusterName = (request.query["cluster"] as string)
    const endpoint = (request.query["endpoint"] as string)
    if (endpoint) {
      getDocCountsV2(catalogApi, clusterName, endpoint, response);
    } else {
      response.json({ status: 'no-param', message: "Please provide the cluster and endpoint query params." });
    }
  });


  router.get('/v2/schemas', (request, response) => {
    const clusterName = (request.query["cluster"] as string)
    const endpoint = (request.query["endpoint"] as string)
    if (clusterName && endpoint) {
      getVespaSchemasV2(catalogApi, clusterName, endpoint, response);
    } else {
      response.json({ status: 'no-param', message: "Please provide the cluster and endpoint query params." });
    }
  });

  router.get('/v1/schema', (request, response) => {
    const clusterName = (request.query["cluster"] as string)
    const endpoint = (request.query["endpoint"] as string)
    const schemaName = (request.query["schema"] as string)
    if (clusterName && endpoint && schemaName) {
      getVespaSchemaV2(catalogApi, clusterName, endpoint, schemaName, response);
    } else {
      response.json({ status: 'no-param', message: "Please provide the cluster, endpoint and schema query params." });
    }
  });
  
  router.get('/v2/content', (request, response) => {
    const clusterName = (request.query["cluster"] as string)
    const endpoint = (request.query["endpoint"] as string)
    const contentPath = (request.query["path"] as string)
    if (clusterName && contentPath) {
      getContentV2(catalogApi, clusterName, endpoint, contentPath, response);
    } else {
      response.json({ status: 'no-param', message: "Please provide the cluster, endpoint and path query params." });
    }
  });

  router.use(errorHandler());
  return router;
}

