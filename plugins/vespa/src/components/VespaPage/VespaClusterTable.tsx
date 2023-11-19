import React, { useState } from 'react';
import {
    Link,
    Table,
    TableColumn,
} from '@backstage/core-components';
import { Checkbox, FormControlLabel, FormGroup, Icon, makeStyles } from '@material-ui/core';
import Info from '@material-ui/icons/Info';
import SettingsApplicationsIcon from '@material-ui/icons/SettingsApplications';
import SportsEsports from '@material-ui/icons/SportsEsports';
import TableChart from '@material-ui/icons/TableChart';
import { fmtBytes, fmtNum } from "./utils"

const useStyles = makeStyles({
    pre: {
        fontFamily: "courier",
    },
    clusterName: {
        border: "none",
    },
    summaryCell: {
        fontSize: "0.8em",
    },
    docType: {
        fontSize: "0.8em",
    },
    denseIcon: {
        marginRight: "0.2em",
    }
});

function renderRegionData(regionData: any, componentName: string) {
    const classes = useStyles();

    const endpoint = regionData.endpoint;
    const queryEndpoint = regionData.queryEndpoint;
    const controllerLink = regionData.controllerLink;
    return <div>
        <table>
            <tbody>
                <tr>
                    <td>
                        <Link to={`./${componentName}?endpoint=${endpoint}&queryEndpoint=${queryEndpoint}`}>
                            <TableChart className={classes.denseIcon}
                                titleAccess="Vespa Cluster details" />
                        </Link>
                    </td>
                    <td>
                        {/* This is a hack for now */}
                        <Link to={controllerLink}>
                            <SportsEsports className={classes.denseIcon} titleAccess="Vespa Controller Page" />
                        </Link>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>;
}

function getData(clusterInfo: any): any[] {
    const classes = useStyles();

    const data: any[] = [];

    const clusters = clusterInfo.clusters;

    const clusterNames: string[] = Object.keys(clusters).sort();
    for (const clusterName of clusterNames) {
        const cluster = clusters[clusterName];
        const res: any = {
            name: <Link key={clusterName} id={clusterName} to={`/catalog/default/component/${clusterName}`}>
                {clusterName}
            </Link>,
        }
        for (const [region, regionData] of Object.entries<any>(cluster)) {
            if (regionData.endpoint !== undefined) {
                res[`details_${region}`] = renderRegionData(regionData, clusterName);
            }
        }
        data.push(res);
    };

    return data;
}

export const VespaClusterTable = ({ clusterInfo }) => {

    const columns: TableColumn[] = [
        { title: 'Cluster', field: 'name', width: "2em" },
    ];
    clusterInfo.regions.forEach(region => {
        columns.push({
            title: region,
            field: `details_${region}`,
            width: "2em",
        })
    });
    const data: any[] = getData(clusterInfo);

    return (<Table
        key={crypto.randomUUID()}
        title={
            <span>Vespa Clusters</span>
        }
        options={{
            search: true,
            padding: 'dense',
            paging: false,
            columnResizable: true,
            tableLayout: 'fixed'
        }}
        columns={columns}
        data={data}
    />)
}