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
import React, { ReactNode } from 'react';
import { rootDetailsRouteRef } from '../../routes';
import { VespaDocCounts } from './VespaDocCounts';
import { VespaRenderContent } from './VespaRenderContent';
import { VespaSchemasList } from './VespaSchemas';
import { VespaQueryEditor } from './VespaQueryEditor';

const Conditional = ({ showWhen, children }: {
    showWhen: boolean,
    children: ReactNode,
}) => {
    if (showWhen) return children;
    return <></>;
}


export const VespaDetailsPage = () => {
    const { clusterName } = useRouteRefParams(rootDetailsRouteRef);
    const endpoint: string = useQueryParamState("endpoint")[0] as string;
    const queryEndpoint: string | undefined = useQueryParamState("queryEndpoint")[0] as string | undefined;

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
                            <VespaDocCounts endpoint={endpoint} clusterName={clusterName} />
                        </CardTab>
                        <CardTab label="Schemas">
                            <VespaSchemasList endpoint={endpoint} clusterName={clusterName} />
                        </CardTab>

                        {(queryEndpoint !== undefined) &&
                            <CardTab label="Query">
                                <VespaQueryEditor 
                                endpoint={endpoint} queryEndpoint={queryEndpoint} clusterName={clusterName} />
                            </CardTab>
                        }
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