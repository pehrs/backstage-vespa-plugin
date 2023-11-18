import {
    Content,
    Header,
    HeaderLabel,
    Page
} from '@backstage/core-components';
import { Checkbox, FormControl, FormControlLabel, FormGroup, Grid } from '@material-ui/core';
import React, { useState } from 'react';
import { VespaClustersList } from './VespaClustersList';


export const VespaPage = () => {
    const [verbose, setVerbose] = useState(false)

    const handleSetVerboseCheckbox = (event: any) => {
        setVerbose(event.target.checked);
    }

    const flexContainer: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'row',
    };

    const labelStyle: React.CSSProperties = {
        textAlign: 'center',
        display: 'table',
        marginRight: "1em",
    };

    const labelSpanStyle: React.CSSProperties = {
        verticalAlign: 'middle',
        display: 'table-cell',
        fontSize: "1.2em",
        fontWeight: "bold",
    };


    return (
        <Page themeId="tool">
            <Header title="Your Vespa clusters">
                <HeaderLabel
                    url="https://github.com/pehrs/backstage-vespa-plugin"
                    label="Github"
                    value="@pehrs" />
                <HeaderLabel label="Lifecycle" value="alpha" />
            </Header>
            <Content>
                <Grid container spacing={3} direction="column">
                    {/* <Grid item>
                        <FormControl style={flexContainer}>
                            <div style={labelStyle}>
                                <span style={labelSpanStyle}>Options:</span>
                            </div>
                            <FormGroup>
                                <FormControlLabel control={
                                    <Checkbox value="verbose" onChange={(event) => handleSetVerboseCheckbox(event)} />
                                } label="Verbose" />
                            </FormGroup>
                        </FormControl>
                    </Grid> */}
                    <Grid item>
                        <VespaClustersList key={verbose.toString()} verbose={verbose} />
                    </Grid>
                </Grid>
            </Content>
        </Page>
    )
};
