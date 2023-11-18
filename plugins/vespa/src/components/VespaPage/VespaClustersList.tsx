import React, { useEffect, useState } from 'react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { Link, Progress } from '@backstage/core-components';
import { makeStyles } from '@material-ui/core';
import { VespaClusterTable } from './VespaClusterTable';

const useStyles = makeStyles({
    pre: {
        fontFamily: "courier",
        color: "#229922",
    },
});

type VespaClustersListProps = {
    verbose: boolean;
};

export const VespaClustersList = ({ verbose }: VespaClustersListProps) => {
    const classes = useStyles();
    const [clusterInfo, setClusterInfo] = useState(null)
    const config = useApi(configApiRef)
    const backendUrl = config.getString('backend.baseUrl');
    useEffect(() => {
        fetch(`${backendUrl}/api/vespa/v2/clusters?verbose=${verbose}`)
            .then((result) => result.json())
            .then((data) => {
                setClusterInfo(data)
            })
    }, [verbose])
    if (clusterInfo == null) {
        return (<div>Collecting data...<Progress/></div>)
    }
    if (clusterInfo && clusterInfo["status"] === "ok") {
        return (<VespaClusterTable key={crypto.randomUUID()} clusterInfo={clusterInfo}/>)
    } else {
        return (<span className={classes.pre}>No vespa components found in Backstage catalog!</span>)
    }
}
