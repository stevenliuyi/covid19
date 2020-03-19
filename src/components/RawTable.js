import React from 'react'
import { useTable, useExpanded, useSortBy, useFilters } from 'react-table'

function textFilter(rows, ids, filterValue) {
    return rows.filter((r) =>
        ids.some((id) => {
            const value = r.values[id]
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase())
        })
    )
}

// flatten filter so that the filter can match subrows
// reference: https://github.com/uqix/reactkit-table/blob/master/src/filter/flatten.js
function flatten(filter) {
    return function(rows, ids, filterValue) {
        const flatRows = treeToFlat(rows).map((r) => ({
            ...r,
            // or useFilters would recursively filter subRows
            subRows: [],
            depth: 0,
            xFlat: true
        }))
        return filter(flatRows, ids, filterValue)
    }
}

function treeToFlat(rows) {
    return [ ...rows, ...rows.map((r) => treeToFlat(r.subRows || [])).reduce((pre, cur) => [ ...pre, ...cur ], []) ]
}

const RegionFilter = (placeholderText) => ({ column: { filterValue, preFilteredRows, setFilter } }) => {
    return (
        <input
            className="data-table-input"
            value={filterValue || ''}
            onChange={(e) => {
                setFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
            }}
            placeholder={placeholderText}
        />
    )
}

export default function RawTable(props) {
    const { columns, data, initialState, onRowClick, filterPlaceholder } = props

    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
        {
            columns,
            data,
            defaultColumn: { Filter: RegionFilter(filterPlaceholder), filter: flatten(textFilter) },
            initialState,
            getResetExpandedDeps: false
        },
        useFilters,
        useSortBy,
        useExpanded
    )

    return (
        <div className="data-table-wrap">
            {headerGroups[0].headers[1].render('Filter')}
            <table className="data-table" {...getTableProps()}>
                <thead>
                    {headerGroups.map((headerGroup, i) => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column, j) => (
                                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                                    {column.render('Header')}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {rows.map((row, i) => {
                        prepareRow(row)
                        return (
                            <tr id={`table-${row.original.region}`} {...row.getRowProps()}>
                                {row.cells.map((cell, cellIdx) => {
                                    return (
                                        <td
                                            {...cell.getCellProps()}
                                            onClick={cellIdx > 0 ? () => onRowClick(row) : null}
                                        >
                                            {cell.render('Cell')}
                                        </td>
                                    )
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            <div style={{ display: 'none' }}>{rows.length} regions</div>
        </div>
    )
}
