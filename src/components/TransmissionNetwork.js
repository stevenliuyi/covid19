import React, { Component } from 'react'
import { Graph } from 'react-d3-graph'
import { scaleSequential, scaleLog, scaleLinear } from 'd3-scale'
import { interpolateMagma } from 'd3-scale-chromatic'
import transmissions from '../data/transmissions.yml'
import maps from '../data/maps.yml'
import { parseDate, getDataFromRegion } from '../utils/utils'
import * as str from '../utils/strings'

const CountryNode = ({ node }) => {
    return (
        <div
            className={`country-node ${node.selected || node.highlighted ? 'selected' : ''}`}
            data-tip={`${node.displayName} <span class="plot-tooltip-bold">${node.count}</span>`}
            style={{
                backgroundColor: node.color ? node.color : '#eee',
                fontSize: node.fontSize
            }}
        >
            <style>
                {node.selected ? (
                    `#${node.id} text {font-weight: bold; font-size: 14px; }`
                ) : node.highlighted ? (
                    `#${node.id} text {font-size: 11px; }`
                ) : (
                    `#${node.id} text {font-size: ${node.labelFontSize}px;}`
                )}
            </style>
        </div>
    )
}

export default class TransmissionNetwork extends Component {
    componentDidMount() {
        setTimeout(() => {
            this.props.tooltipRebuild()
        }, 100)
    }

    getRegion = (id) => {
        const region = [ str.MAINLAND_CHINA_ZH, str.HONGKONG_ZH, str.MACAO_ZH, str.TAIWAN_ZH ].includes(id)
            ? [ str.CHINA_ZH, id ]
            : id === str.DIAMOND_PRINCESS_ZH ? [ str.INTL_CONVEYANCE_ZH, str.DIAMOND_PRINCESS_ZH ] : [ id ]

        return region
    }

    getCount = (id) => {
        const { data, date, metric } = this.props
        const regionData = getDataFromRegion(data, this.getRegion(id))
        const count = regionData[metric][date] ? regionData[metric][date] : 0

        return count
    }

    getColor = (id) => {
        const count = this.getCount(id)
        const currentScale = this.getScale()
        const colorScale = scaleSequential((d) => interpolateMagma(1 - currentScale(d)))

        return colorScale(count)
    }

    getScale = () => {
        const { scale, metric } = this.props
        const currentScale = scale === 'linear' ? scaleLinear : scaleLog
        return currentScale().domain([ 1, maps[str.TRANSMISSION][`maxScale_${metric}`] ])
    }

    getDisplayName = (id) => {
        const { lang, data } = this.props
        return lang === 'zh' ? id : getDataFromRegion(data, this.getRegion(id)).ENGLISH
    }

    render() {
        const { mapDimensions, date, regionToggle, currentRegion, currentMap } = this.props

        if (currentMap !== str.TRANSMISSION) return <div />

        const networkConfig = {
            directed: true,
            automaticRearrangeAfterDropNode: true,
            panAndZoom: true,
            focusAnimationDuration: 0.4,
            nodeHighlightBehavior: true,
            width: mapDimensions.width,
            height: mapDimensions.height,
            highlightOpacity: 0.2,
            d3: {
                gravity: -40,
                linkLength: mapDimensions.width * 0.2
            },
            link: {
                color: '#eee',
                highlightColor: 'var(--primary-color-5)',
                strokeWidth: 1,
                mouseCursor: 'default'
            },
            node: {
                labelProperty: 'displayName',
                viewGenerator: (node) => <CountryNode node={node} />
            }
        }

        let nodes = {}
        transmissions.forEach((trans) => {
            if (parseDate(trans.date) > parseDate(date)) return

            if (trans.from in nodes) {
                nodes[trans.from] += 1
            } else {
                nodes[trans.from] = 1
            }
            if (trans.to in nodes) {
                nodes[trans.to] += 0
            } else {
                nodes[trans.to] = 0
            }
        })

        const data = {
            nodes: Object.keys(nodes).map((x) => ({
                id: x,
                displayName: this.getDisplayName(x),
                size: Math.max(Math.min(nodes[x] * 15, 230), 100),
                count: this.getCount(x),
                color: this.getColor(x),
                labelFontSize: nodes[x] > 3 ? 11 : 0,
                selected: currentRegion[currentRegion.length - 1] === x ? true : false
            })),
            links: transmissions
                .filter((trans) => parseDate(trans.date) <= parseDate(date))
                .map((trans) => ({ source: trans.from, target: trans.to }))
        }

        return (
            <Graph
                id="transmission-network" // id is mandatory, if no id is defined rd3g will throw an error
                data={data}
                config={networkConfig}
                onClickNode={(id) => regionToggle(this.getRegion(id))}
            />
        )
    }
}
