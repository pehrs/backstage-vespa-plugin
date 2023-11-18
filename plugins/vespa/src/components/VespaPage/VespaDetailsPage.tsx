import {
    CardTab,
    Content,
    Header,
    HeaderLabel,
    Page,
    TabbedCard,
    useQueryParamState
} from '@backstage/core-components';
import { useRouteRef, useRouteRefParams } from '@backstage/core-plugin-api';
import { Grid } from '@material-ui/core';
import React from 'react';
import { rootDetailsRouteRef } from '../../routes';
import { VespaDocCounts } from './VespaDocCounts';
import { VespaRenderContent } from './VespaRenderContent';
import { VespaSchemasList } from './VespaSchemas';


export const VespaDetailsPage = () => {
    const { clusterName } = useRouteRefParams(rootDetailsRouteRef);
    const params = useQueryParamState("endpoint")

    const endpoint:string = params[0] as string;

    return (<Page themeId="tool">
        <Header title={clusterName} type="vespa" typeLink="/vespa" >
            <HeaderLabel
                url="https://github.com/pehrs/backstage-vespa-plugin"
                label="Github"
                value="@pehrs" />
            <HeaderLabel label="Lifecycle" value="alpha" />
        </Header>
        <Content>

            <Grid container spacing={3} direction="column">
                <Grid item>
                    <TabbedCard>
                        <CardTab label="Content details">
                            <VespaDocCounts endpoint={endpoint} clusterName={clusterName}/>
                        </CardTab>
                        <CardTab label="Schemas">
                            <VespaSchemasList endpoint={endpoint} clusterName={clusterName} />
                        </CardTab>                
                        {/* 
                        // FIXME:
                        <CardTab label="Query">
                            <div>Query dialog here</div>
                        </CardTab> 
                        */}
                        <CardTab label="Debug">
                            <TabbedCard>
                                <CardTab label="build-meta.json">
                                    <VespaRenderContent language='json' endpoint={endpoint} clusterName={clusterName} contentPath="build-meta.json" />
                                </CardTab>
                                <CardTab label="services.xml">
                                    <VespaRenderContent language='xml' endpoint={endpoint} clusterName={clusterName} contentPath="services.xml" />
                                </CardTab>
                                <CardTab label="hosts.xml">
                                    <VespaRenderContent language='xml' endpoint={endpoint} clusterName={clusterName} contentPath="hosts.xml" />
                                </CardTab>
                            </TabbedCard>
                        </CardTab>
                    </TabbedCard>
                </Grid>
            </Grid>
        </Content>
    </Page>);
}