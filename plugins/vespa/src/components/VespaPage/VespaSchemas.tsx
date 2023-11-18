import { CardTab, Progress, TabbedCard } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import React, { useEffect, useState } from 'react';
import { VespaRenderContent } from './VespaRenderContent';

type VespaSchemasListProps = {
    clusterName: string;
    endpoint: string;
};

export const VespaSchemasList = ({ clusterName, endpoint }: VespaSchemasListProps) => {

    const [schemas, setSchemas] = useState<string[] | null>(null)
    const config = useApi(configApiRef)
    const backendUrl = config.getString('backend.baseUrl');
    useEffect(() => {
        fetch(`${backendUrl}/api/vespa/v2/schemas?cluster=${clusterName}&endpoint=${endpoint}`)
            .then((result) => result.json())
            .then((data) => {
                setSchemas(data.schemas)
            })
    }, [])
    if (schemas == null) {
        return (<div>Collecting data...<Progress/></div>)
    }

    const schemaCards: any[] = schemas.map(schemaName => {
        return <CardTab key={schemaName} label={schemaName}>
            <VespaRenderContent language='yaml' clusterName={clusterName} endpoint={endpoint} contentPath={`schemas/${schemaName}`} />
        </CardTab>;
    })

    return (<TabbedCard key="schemas">
        {schemaCards}
    </TabbedCard>)
}