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

function getColumnsAndData(clusterInfo: any): [TableColumn[], any[]] {
    const classes = useStyles();

    const columns: TableColumn[] = [
        { title: 'System', field: 'name', width: "2em" },
    ];

    if (clusterInfo.verbose) {
        columns.push({ title: 'Doc-Types', field: 'docTypes', width: "4em" })
    }

    clusterInfo.regions.forEach(region => {
        columns.push({
            title: region,
            field: `details_${region}`,
            width: "2em",
        })
    });

    const rows: any[] = [];

    clusterInfo.systemNames.forEach(name => {
        const row: any = {
            id: name,
            name: name,
        };
        const sysClusters = clusterInfo.systemClusters[name];
        const docTypes = new Set<string>();

        clusterInfo.regions.forEach(region => {
            const info = sysClusters.filter(clusterName => {
                const clusterData = clusterInfo.clusters[clusterName];
                return clusterData.region === region;
            }).map(clusterName => {
                return clusterInfo.clusters[clusterName];
            }).shift();
            if (info) {

                info.doctypes?.forEach(docType => docTypes.add(docType));

                var componentName = info.name;

                // FIXME: This should be created using the backend and the vespa model and point to the main config node
                const controllerEndpoint  = info.endpoint.replace(":19071", `:19050/clustercontroller-status/v1/${info.contentId}`)

                if (info.summary) {
                    const docCountTotal = fmtNum(info.summary.docCountTotal, 1);
                    const docCountTotalTitle = `Doc-Count total: ${info.summary.docCountTotal}`;
                    const diskUsageTotal = fmtBytes(info.summary.diskUsageTotal, 1);
                    const diskUsageTotalTitle = `Disk-usage total: ${info.summary.diskUsageTotal}`;
                    const memUsageTotal = fmtBytes(info.summary.memUsageTotal, 1);
                    const memUsageTotalTitle = `Memory-usage total: ${info.summary.memUsageTotal}`;
                    row[`details_${region}`] = <div>
                        <table>
                            <tbody>
                                <tr>
                                    <td>
                                        <table>
                                            <tbody>
                                                <tr>
                                                    <td colSpan={2}>
                                                        <Link to={`./${componentName}`}>
                                                            <span title={docCountTotalTitle} className={classes.summaryCell}>
                                                                {docCountTotal}
                                                            </span>
                                                        </Link>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <Link to={`./${componentName}`}>
                                                            <span className={classes.summaryCell} title={diskUsageTotalTitle} >{diskUsageTotal}</span>
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        <Link to={`./${componentName}`}>
                                                            <span className={classes.summaryCell} title={memUsageTotalTitle} >{memUsageTotal}</span>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                    <td>
                                        {/* This is a hack for now */}
                                        <Link to={controllerEndpoint}>
                                            <SportsEsports className={classes.denseIcon} 
                                            titleAccess="Vespa Controller Page" />
                                        </Link>
                                    </td>
                                    <td>
                                        <Link to={`/catalog/default/component/${componentName}`}>
                                            <SettingsApplicationsIcon className={classes.denseIcon} 
                                            titleAccess="Backstage Component details" />
                                        </Link>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>;
                } else {
                    row[`details_${region}`] = <div>
                        <table>
                            <tbody>
                                <tr>
                                    <td>
                                        <Link to={`./${componentName}`}>
                                            <TableChart className={classes.denseIcon} 
                                            titleAccess="Vespa Cluster details" />
                                        </Link>
                                    </td>
                                    <td>
                                        {/* This is a hack for now */}
                                        <Link to={controllerEndpoint}>
                                            <SportsEsports className={classes.denseIcon} titleAccess="Vespa Controller Page" />
                                        </Link>
                                    </td>
                                    <td>
                                        <Link to={`/catalog/default/component/${componentName}`}>
                                            <SettingsApplicationsIcon className={classes.denseIcon} 
                                            titleAccess="Backstage Component details" />
                                        </Link>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                }

            }
        });
        row["docTypes"] = Array.from(docTypes.values()).sort().toString()
        rows.push(row)
    });

    return [columns, rows];
}

export const VespaClusterTable = ({ clusterInfo }) => {

    const [columns, data] = getColumnsAndData(clusterInfo);

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