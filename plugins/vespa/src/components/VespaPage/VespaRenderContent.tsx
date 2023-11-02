import { Progress } from '@backstage/core-components';
import { appThemeApiRef, configApiRef, useApi } from '@backstage/core-plugin-api';
import React, { useEffect, useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { androidstudio, docco } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

type VespaRenderContentProps = {
    clusterName: string;
    contentPath: string;
    language: string;
};
export const VespaRenderContent = ({ clusterName, contentPath, language }: VespaRenderContentProps) => {

    const [schemaTxt, setSchemaTxt] = useState<string | null>(null)
    const config = useApi(configApiRef)
    const backendUrl = config.getString('backend.baseUrl');
    const themeApi = useApi(appThemeApiRef)

    const themeId = themeApi.getActiveThemeId();    
    // Use dark theme as default
    var syntaxStyle = androidstudio;
    if (themeId?.toLowerCase().indexOf("light") != -1) {
        syntaxStyle = docco;
    }

    useEffect(() => {
        fetch(`${backendUrl}/api/vespa/v1/content?cluster=${clusterName}&path=${contentPath}`)
            .then((result) => result.json())
            .then((data) => {
                setSchemaTxt(data.data)
            })
    }, [contentPath])
    if (schemaTxt == null) {
        return (<Progress />)
    }

    return (
        <div key={contentPath}>
            <SyntaxHighlighter language={language} style={syntaxStyle}>
                {schemaTxt}
            </SyntaxHighlighter>
        </div>)

}