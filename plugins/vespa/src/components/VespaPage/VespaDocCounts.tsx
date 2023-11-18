import { Progress, Select, Table, TableColumn } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { Checkbox, FormControl, FormControlLabel } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { fmtBytes, fmtNum, formatNumber } from './utils';


type VespaDocCountsProps = {
    clusterName: string;
    endpoint: string;
};

function getDocCount(indexData: any): number {
    return indexData.docCount;
}
function getMemoryUsage(indexData: any): number {
    return indexData.memUsageBytes;
}
function getDiskUsage(indexData: any): number {
    return indexData.diskUsageBytes;
}
function getTransactionLogUsage(indexData: any): number {
    return indexData.tansactionLogUsageBytes;
}
function getMatchRate(indexData: any): number {
    return indexData.matchRate;
}

const DOC_COUNT = "Number of documents"
const MEMORY_USAGE = "Memory Usage"
const DISK_USAGE = "Disk Usage"
const TRANSACTION_LOG_USAGE = "Transaction Log Usage"
const MATCH_RATE = "Match Rate"

const FIELD_NAMES = [
    { label: DOC_COUNT, value: DOC_COUNT, },
    { label: MEMORY_USAGE, value: MEMORY_USAGE, },
    { label: DISK_USAGE, value: DISK_USAGE, },
    { label: TRANSACTION_LOG_USAGE, value: TRANSACTION_LOG_USAGE, },
    { label: MATCH_RATE, value: MATCH_RATE, },
]
// "docCount": 997400,
// "memUsageBytes": 5397233269,
// "diskUsageBytes": 3972793512,
// "tansactionLogUsageBytes": 437449987,
// "matchRate": 433677.749999
const fnLookup = new Map([
    [DOC_COUNT, getDocCount],
    [MEMORY_USAGE, getMemoryUsage],
    [DISK_USAGE, getDiskUsage],
    [TRANSACTION_LOG_USAGE, getTransactionLogUsage],
    [MATCH_RATE, getMatchRate],
]);

const fnFormat = new Map([
    [DOC_COUNT, fmtNum],
    [MEMORY_USAGE, fmtBytes],
    [DISK_USAGE, fmtBytes],
    [TRANSACTION_LOG_USAGE, fmtBytes],
    [MATCH_RATE, fmtNum],
]);

const NO_DIFF = "No diff";
const DIFF_IN_NUMBERS = "Diff in numbers";
const DIFF_IN_PERCENT = "Diff in percent";

const DIFF_NAMES = [
    { label: DIFF_IN_NUMBERS, value: DIFF_IN_NUMBERS, },
    { label: DIFF_IN_PERCENT, value: DIFF_IN_PERCENT, },
    { label: NO_DIFF, value: NO_DIFF, },
]


function getColumnsAndData(docCounts: any, selectedField: string, formatValues: boolean, diffType: string): [TableColumn[], any[]] {

    const columns: TableColumn[] = [
        { title: 'Group', field: 'groupName', width: "1em", },
        { title: 'Dist-Key', field: 'distributionKey', width: "1em" },
    ];

    docCounts.indexNames.forEach(indexName => {
        columns.push(
            { title: indexName, field: `value_${indexName}`, width: "2em" }
        )
    });


    const groups: any[] = Object.entries(docCounts.groups)
        .map(pair => {
            const [index, group]: any[] = pair;
            return group;
        })
        .sort((a, b) => a.distributionKey - b.distributionKey)


    let getValueFn = fnLookup.get(selectedField)
    const fmtFn = fnFormat.get(selectedField)
    const indexMax = {};
    groups.map(group => {
        const name = group.name;
        const indices = group.indices;

        docCounts.indexNames.forEach(indexName => {
            if (getValueFn) {
                const value = getValueFn(indices[indexName])
                if (indexMax[indexName]) {
                    indexMax[indexName] = Math.max(value, indexMax[indexName]);
                } else {
                    indexMax[indexName] = value;
                }
            }
        });

    })
    const rows: any[] = groups.map(group => {
        const name = group.name;
        const res: any = {
            id: name,
            key: name,
            groupName: name,
            distributionKey: group.distributionKey,
        }

        const indices = group.indices;
        // "docCount": 997400,
        // "memUsageBytes": 5397233269,
        // "diskUsageBytes": 3972793512,
        // "tansactionLogUsageBytes": 437449987,
        // "matchRate": 433677.749999
        docCounts.indexNames.forEach(indexName => {
            if (getValueFn) {
                const maxValue = indexMax[indexName];
                const value = getValueFn(indices[indexName]);
                const diff = value - maxValue;
                var fmtValue = formatNumber(value)
                // fmtValue = fmtNum(value, 1)
                var diffFmt = formatNumber(diff)
                if (fmtFn && formatValues) {
                    fmtValue = fmtFn(value, 1)
                    diffFmt = fmtFn(diff, 1)
                }
                if (diffType !== NO_DIFF && Math.abs(diff) > 0) {
                    if (diffType === DIFF_IN_PERCENT) {
                        diffFmt = (diff / maxValue).toFixed(2) + "%";
                    }
                    res[`value_${indexName}`] = <div>
                        <span title={"" + value} style={{ display: "flow" }}>{fmtValue}</span>
                        <span title={"" + diff} style={{ fontSize: "0.8em", color: "red" }}>({diffFmt})</span>
                    </div>
                } else {
                    res[`value_${indexName}`] = <span title={"" + value}>{fmtValue}</span>
                }
            }
        });

        return res;
    })

    return [columns, rows];
}

const VespaDocCountsTable = ({ docCounts, selectedField, formatValues, diffType }) => {

    const [columns, data] = getColumnsAndData(docCounts.docCounts, selectedField, formatValues, diffType);

    return (<Table
        key={crypto.randomUUID()}
        title={
            <span>Content details</span>
        }
        options={{
            showTitle: true,
            header: true,
            search: false,
            padding: 'dense',
            paging: false,
            columnResizable: true,
            tableLayout: 'fixed'
        }}
        columns={columns}
        data={data}
    />)
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

export const VespaDocCounts = ({ clusterName, endpoint }: VespaDocCountsProps) => {
    const [docCounts, setDocCounts] = useState(null)
    const config = useApi(configApiRef)
    const backendUrl = config.getString('backend.baseUrl');
    const [selectedField, setSelectedField] = useState<string>(DOC_COUNT)
    const [formatValues, setFormatValues] = useState<boolean>(true)
    const [diffType, setDiffType] = useState<string>(DIFF_IN_NUMBERS)

    useEffect(() => {
        fetch(`${backendUrl}/api/vespa/v2/doc-counts?cluster=${clusterName}&endpoint=${endpoint}`)
            .then((result) => result.json())
            .then((data) => {
                setDocCounts(data)
            })
    }, [clusterName, selectedField])
    if (docCounts == null) {
        return (<div>Collecting data...<Progress /></div>)
    }

    const handleFormatCheckbox = (event: any) => {
        setFormatValues(event.target.checked);
    }

    if (docCounts && docCounts["status"] === "ok") {
        return (<div key={clusterName}>
            <FormControl style={flexContainer}>
                <div style={labelStyle}>
                    <span style={labelSpanStyle}>Options:</span>
                </div>
                <Select
                    key={Math.random()}
                    label=""
                    selected={selectedField}
                    items={FIELD_NAMES}
                    onChange={(value) => { setSelectedField("" + value); }}
                />
                <span style={{ marginLeft: "1em" }}></span>
                <Select
                    key={Math.random()}
                    label=""
                    onChange={(value) => { setDiffType("" + value) }}
                    selected={diffType}
                    items={DIFF_NAMES}
                />
                <FormControlLabel style={{ marginLeft: "0.5em" }} control={
                    <Checkbox key={Math.random()}
                        value="formatValues" checked={formatValues}
                        onChange={(event) => handleFormatCheckbox(event)} />
                } label="SI Formatted Values" />
            
            </FormControl>
            <VespaDocCountsTable
                docCounts={docCounts}
                selectedField={selectedField}
                formatValues={formatValues}
                diffType={diffType}
            />
        </div>)
    } else {
        return (<span style={{ fontFamily: "courier" }}>Could not get doc-counts for {clusterName}!</span>)
    }
}