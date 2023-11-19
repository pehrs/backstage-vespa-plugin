import { Progress } from '@backstage/core-components';
import { appThemeApiRef, configApiRef, useApi } from '@backstage/core-plugin-api';
import React, { useEffect, useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { androidstudio, docco } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import Editor from '@monaco-editor/react';

type VespaRenderContentProps = {
    clusterName: string;
    endpoint: string;
    contentPath: string;
    language: string;
};
export const VespaRenderContent = ({ clusterName, endpoint, contentPath, language }: VespaRenderContentProps) => {

    const [schemaTxt, setSchemaTxt] = useState<string | null>(null)
    const config = useApi(configApiRef)
    const backendUrl = config.getString('backend.baseUrl');
    const themeApi = useApi(appThemeApiRef)

    const themeId = themeApi.getActiveThemeId();    
    // Use dark theme as default
    var editorTheme = "vs-dark";
    if (themeId?.toLowerCase().indexOf("light") != -1) {
        editorTheme = "vs";
    }

    useEffect(() => {
        fetch(`${backendUrl}/api/vespa/v2/content?cluster=${clusterName}&path=${contentPath}&endpoint=${endpoint}`)
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
             <Editor
            options={{ readOnly: true }} 
            height="80vh" 
            defaultLanguage={language} 
            theme={editorTheme}
            value={schemaTxt}/>
        </div>)

}