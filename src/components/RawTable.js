import React from 'react'
import { useTable, useExpanded, useSortBy } from 'react-table'

export default function RawTable(props) {
    const { columns, data, initialState, onRowClick } = props

    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
        {
            columns,
            data,
            initialState,
            getResetExpandedDeps: false
        },
        useSortBy,
        useExpanded
    )

    return (
        <div className="data-table-wrap">
            <table className="data-table" {...getTableProps()}>
                <thead>
                    {headerGroups.map((headerGroup) => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => (
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
