import {
    CardTab,
    Content,
    Header,
    HeaderLabel,
    Page,
    TabbedCard
} from '@backstage/core-components';
import { useRouteRefParams } from '@backstage/core-plugin-api';
import { Grid } from '@material-ui/core';
import React from 'react';
import { rootDetailsRouteRef } from '../../routes';
import { VespaDocCounts } from './VespaDocCounts';
import { VespaRenderContent } from './VespaRenderContent';
import { VespaSchemasList } from './VespaSchemas';


export const VespaDetailsPage = () => {
    const { clusterName } = useRouteRefParams(rootDetailsRouteRef);

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
                            <VespaDocCounts clusterName={clusterName}/>
                        </CardTab>
                        <CardTab label="Schemas">
                            <VespaSchemasList clusterName={clusterName} />
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
                                    <VespaRenderContent language='json' clusterName={clusterName} contentPath="build-meta.json" />
                                </CardTab>
                                <CardTab label="services.xml">
                                    <VespaRenderContent language='xml' clusterName={clusterName} contentPath="services.xml" />
                                </CardTab>
                                <CardTab label="hosts.xml">
                                    <VespaRenderContent language='xml' clusterName={clusterName} contentPath="hosts.xml" />
                                </CardTab>
                            </TabbedCard>
                        </CardTab>
                    </TabbedCard>
                </Grid>
            </Grid>
        </Content>
    </Page>);
}