import { Progress } from '@backstage/core-components';
import { appThemeApiRef, configApiRef, useApi } from '@backstage/core-plugin-api';
import React, { useEffect, useRef, useState } from 'react';
import Editor, { EditorProps, Monaco } from '@monaco-editor/react';
import { monacoRegisterYqlTheme, monacoRegisterYql, monacoRegisterYqlCompletionItemProvider } from "./yql"
import { Button } from '@material-ui/core';
import Resizable from 'react-resizable-layout';

type VespaQueryEditorProps = {
    clusterName: string;
    endpoint: string;
    queryEndpoint: string;
};


export const VespaQueryEditor = ({ clusterName, endpoint, queryEndpoint }: VespaQueryEditorProps) => {
    const themeApi = useApi(appThemeApiRef)
    const themeId = themeApi.getActiveThemeId();
    // Use dark theme as default
    var editorTheme = "yql-dark";
    var btnBackground = "#005588"
    if (themeId?.toLowerCase().indexOf("light") != -1) {
        editorTheme = "yql-light";
        btnBackground = "#008888"
    }

    // We need to dispose the completionProvider once it's no longer used.
    const completionProviderRef = useRef<any | null>({});
    useEffect(() => {
        return () => {
            completionProviderRef.current && completionProviderRef.current.dispose();
            completionProviderRef.current = null;
        };
    }, []);

    // FIXME: Lookup the schema names and add them to the yql language!
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

    const editorRef = useRef<any | null>(null);

    function handleEditorWillMount(monaco) {
        // here is the monaco instance
        // do something before editor is mounted
        monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

        console.log("monaco", monaco);
        monacoRegisterYql(monaco);

        completionProviderRef.current = monacoRegisterYqlCompletionItemProvider(monaco, schemas);

        // Below does not work yet :-(
        monacoRegisterYqlTheme(monaco);
    }


    const [response, setResponse] = useState<any | null>("")
    const [queryRunning, setQueryRunning] = useState<boolean>(false)

    // curl -s "localhost:7007/api/vespa/v2/query?queryEndpoint=http://f0020407.ip.gae2.spotify.net:8080&yql=select%20%2A%20from%20album20230607%20where%20true%20limit%2010%3B"
    function runYql(yql: string) {
        console.log("RUN YQL: ", yql);
        setQueryRunning(true)
        fetch(`${backendUrl}/api/vespa/v2/query?queryEndpoint=${queryEndpoint}&yql=${yql}`)
            .then((result) => result.json())
            .then((data) => {
                setQueryRunning(false)
                setResponse(JSON.stringify(data.queryResponse, null, 2))
                localStorage.setItem('yql', yql);
            })
    }

    function onRunButtonClick(ev) {
        if (editorRef.current !== null) {
            runYql(editorRef.current.getValue());
        }
    }

    function addCustomAction(editor) {
        editor.addAction({
            // An unique identifier of the contributed action.
            id: "my-unique-id",

            // A label of the action that will be presented to the user.
            label: "My Label!!!",

            // An optional array of keybindings for the action.
            keybindings: [
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
            ],

            // A precondition for this action.
            precondition: null,

            // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
            keybindingContext: null,

            contextMenuGroupId: "navigation",

            contextMenuOrder: 1.5,

            // Method that will be executed when the action is triggered.
            // @param editor The editor instance is passed in as a convenience
            run: function (ed) {
                runYql(ed.getValue())
            },
        });
    }


    function handleEditorDidMount(editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) {
        // here is the editor instance
        // you can store it in `useRef` for further usage
        editorRef.current = editor;

        // console.log("editor", editor, "monaco", monaco)

        addCustomAction(editor);
    }


    const editorContentChange = function (content) {
        console.log("Editor changed", content)
    }

    const editorValidate = function (content) {
        console.log("onValidate", content)
    }

    if (schemas == null) {
        return (<div>Collecting data...<Progress /></div>)
    }

    const oldYql = localStorage.getItem('yql') as string;

    return (
        <div>
            <Button style={{ background: btnBackground, marginBottom: "10px" }} onClick={onRunButtonClick} title="⌘-Enter to run">Run Query</Button>
            {queryRunning && (
                <span style={{
                    color: "#888888",
                    marginLeft: "2em",
                }}>Running query...</span>
            )}

            <Resizable axis={'y'} initial={300} >
                {({ position, separatorProps }) => (
                    <div className="wrapper" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100vh',
                        overflow: 'hidden',
                    }}>
                        <div className="top-block" style={{ height: position - 245}}>
                            <Editor
                                options={{
                                    readOnly: false,
                                    automaticLayout: true,
                                }}
                                defaultLanguage="yql"
                                theme={editorTheme}
                                // onChange={editorContentChange}
                                beforeMount={handleEditorWillMount}
                                onMount={handleEditorDidMount}
                                // onValidate={editorValidate}
                                value={oldYql}
                                 />
                        </div>
                        <div style={{
                            cursor: "row-resize",
                            width: "100%", 
                            // border: "2px solid green", 
                            paddingTop: "10px",                            
                        }}  {...separatorProps}></div>
                        {/* `calc(100% - ${position}px)` */}
                        <div className="bottom-block" style={{ height: 1000 - position }}>
                            <Editor
                                options={{
                                    readOnly: true,
                                    automaticLayout: true,
                                }}
                                defaultLanguage="json"
                                theme={editorTheme}
                                value={response} />
                        </div>
                    </div>
                )
                }
            </Resizable >

        </div >
    )
}