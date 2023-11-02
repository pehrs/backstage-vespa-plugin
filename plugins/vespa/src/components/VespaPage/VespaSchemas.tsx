import { CardTab, Progress, TabbedCard } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import React, { useEffect, useState } from 'react';
import { VespaRenderContent } from './VespaRenderContent';

type VespaSchemasListProps = {
    clusterName: string;
};

export const VespaSchemasList = ({ clusterName }: VespaSchemasListProps) => {

    const [schemas, setSchemas] = useState<string[] | null>(null)
    const config = useApi(configApiRef)
    const backendUrl = config.getString('backend.baseUrl');
    // console.log("backeverndUrl", backendUrl)
    useEffect(() => {
        fetch(`${backendUrl}/api/vespa/v1/schemas?cluster=${clusterName}`)
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
            <VespaRenderContent language='yaml' clusterName={clusterName} contentPath={`schemas/${schemaName}`} />
        </CardTab>;
    })

    return (<TabbedCard key="schemas">
        {schemaCards}
    </TabbedCard>)
}