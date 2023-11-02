import { Progress } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import React, { useEffect, useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

type VespaRenderSchemaProps = {
    clusterName: string;
    schemaName: string;
};
export const VespaRenderSchema = ({ clusterName, schemaName }: VespaRenderSchemaProps) => {

    const [schemaTxt, setSchemaTxt] = useState<string | null>(null)
    const config = useApi(configApiRef)
    const backendUrl = config.getString('backend.baseUrl');
    // console.log("backeverndUrl", backendUrl)
    useEffect(() => {
        fetch(`${backendUrl}/api/vespa/v1/content?cluster=${clusterName}&path=schemas/${schemaName}`)
            .then((result) => result.json())
            .then((data) => {
                // console.log("data", data);
                setSchemaTxt(data.data)
            })
    }, [schemaName])
    if (schemaTxt == null) {
        return (<Progress />)
    }

    return (
        <div key={schemaName}>
            <SyntaxHighlighter language="yaml" style={docco}>
                {schemaTxt}
            </SyntaxHighlighter>
        </div>)

}