import React, { Component } from 'react'
import { AiFillCaretRight, AiFillCaretDown } from 'react-icons/ai'
import RawTable from './RawTable'
import { generateTreeData } from '../utils/utils'
import * as str from '../utils/strings'
import i18n from '../data/i18n.yml'

export default class Table extends Component {
    onRowClick = (row) => {
        this.props.regionToggle(row.original.region.split('.'))
    }

    highlightCurrentRegion = () => {
        document.querySelectorAll('.data-table tr').forEach((x) => x.classList.remove('current'))
        // hack
        setTimeout(() => {
            const elem = document.getElementById(`table-${this.props.currentRegion.join('.')}`)
            const tbodyElem = document.querySelector('.data-table tbody')

            // scroll into view if the row is not visible
            if (elem != null && tbodyElem != null) {
                elem.classList.add('current')
                const bounding = elem.getBoundingClientRect()
                const tableBounding = tbodyElem.getBoundingClientRect()
                const isInViewPort = bounding.top >= tableBounding.top && bounding.bottom <= tableBounding.bottom

                if (!isInViewPort) tbodyElem.scrollTop = elem.offsetTop - tbodyElem.offsetTop
            }
        }, 200)
    }

    getInitialSate = (tableData) => {
        const { currentRegion, playing } = this.props
        if (currentRegion[0] === str.GLOBAL_ZH && playing) return {}

        let indices = []
        currentRegion.slice(0, currentRegion.length - 1).forEach((r) => {
            const regionData = indices.reduce((s, x) => (Array.isArray(s) ? s[x] : s.subRows[x]), tableData)
            const subregions = Array.isArray(regionData) ? regionData : regionData.subRows
            const newIdx = subregions.findIndex((x) => x.name === r)
            indices.push(newIdx)
        })
        const expanded = indices.map((x, i) => indices.slice(0, i + 1).join('.')).reduce((s, x) => {
            s[x] = true
            return s
        }, {})

        return {
            expanded
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.currentRegion.join('.') !== this.props.currentRegion.join('.')) this.highlightCurrentRegion()
    }

    componentDidMount() {
        this.highlightCurrentRegion()
    }

    shouldComponentUpdate(nextProps) {
        return (
            nextProps.lang !== this.props.lang ||
            nextProps.date !== this.props.date ||
            nextProps.currentRegion !== this.props.currentRegion
        )
    }

    render() {
        const { data, lang, date } = this.props
        if (data == null) return <div />
        const tableData = generateTreeData(data, date, lang, 'subRows', 'confirmedCount')

        const columns = [
            {
                // Build our expander column
                id: 'expander', // Make sure it has an ID
                Header: ({ getToggleAllRowsExpandedProps, isAllRowsExpanded }) => (
                    <span {...getToggleAllRowsExpandedProps()}>
                        {isAllRowsExpanded ? <AiFillCaretDown size={14} /> : <AiFillCaretRight size={14} />}
                    </span>
                ),
                Cell: ({ row }) =>
                    // Use the row.canExpand and row.getToggleRowExpandedProps prop getter
                    // to build the toggle for expanding a row
                    row.canExpand ? (
                        <span
                            {...row.getToggleRowExpandedProps({
                                style: {
                                    // We can even use the row.depth property
                                    // and paddingLeft to indicate the depth
                                    // of the row
                                    paddingLeft: 0
                                }
                            })}
                        >
                            {row.isExpanded ? <AiFillCaretDown size={14} /> : <AiFillCaretRight size={14} />}
                        </span>
                    ) : null
            },
            {
                Header: i18n.REGION[lang],
                Cell: ({ row }) => {
                    return (
                        <span>{`${[ ...Array(row.depth + 1).keys() ].map((x) => '　').join('')}${row.original
                            .displayName}`}</span>
                    )
                },
                accessor: 'displayName'
            },
            {
                Header: i18n.CONFIRMED[lang],
                accessor: 'confirmedCount'
            },
            {
                Header: i18n.RECOVERED[lang],
                accessor: 'curedCount'
            },
            {
                Header: i18n.DEATHS[lang],
                accessor: 'deadCount'
            }
        ]

        const initialState = this.getInitialSate(tableData)

        return (
            <div style={{ height: '100%' }}>
                <RawTable columns={columns} data={tableData} initialState={initialState} onRowClick={this.onRowClick} />
            </div>
        )
    }
}
