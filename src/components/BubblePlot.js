import React, { Component } from 'react'
import { ResponsiveBubble } from '@nivo/circle-packing'
import { interpolateMagma } from 'd3-scale-chromatic'
import { getDataFromRegion, generateTreeData } from '../utils/utils'
import * as str from '../utils/strings'

export default class BubblePlot extends Component {
    state = {
        plotData: null,
        currentNodePath: null
    }

    // hack so that bubble plot can interact with other plots
    handleNodeClick = (node) => {
        const region = node.path === str.GLOBAL_ZH ? [ node.path ] : node.path.split('.').reverse().slice(1)
        this.props.regionToggle(region)
    }

    bringTextsToTop = () => {
        setTimeout(() => {
            document.querySelectorAll('.bubble-plot-wrap text').forEach((elem) => {
                let parentElem = elem.parentNode
                // bring texts to top
                elem.parentNode.parentNode.appendChild(parentElem)
            })
        }, 100)
    }

    componentDidUpdate() {
        this.bringTextsToTop()
    }

    componentDidMount() {
        this.bringTextsToTop()
    }

    render() {
        const { data, metric, currentRegion, date, playing, lang, darkMode, fullTree } = this.props
        if (data == null) return <div />
        let plotData = {
            name: str.GLOBAL_ZH,
            displayName: lang === 'en' ? str.GLOBAL_EN : str.GLOBAL_ZH,
            confirmedCount: data[str.GLOBAL_ZH].confirmedCount[date],
            deadCount: data[str.GLOBAL_ZH].deadCount[date],
            curedCount: data[str.GLOBAL_ZH].curedCount[date],
            children: generateTreeData(data, date, lang)
        }

        let currentNodePath =
            currentRegion[0] === str.GLOBAL_ZH ? str.GLOBAL_ZH : [ str.GLOBAL_ZH, ...currentRegion ].reverse().join('.')

        // TODO: Node does not exist when count is 0. Need to find the parent node that has non-zero count.
        const currentData = getDataFromRegion(data, currentRegion)
        const count = currentData[metric][date]
        if (
            count == null ||
            count === 0 ||
            (currentRegion[0] === str.CHINA_ZH && currentRegion.length > 3) ||
            (currentRegion[0] === str.US_ZH && currentRegion.length === 3) ||
            (currentRegion[0] === str.UK_ZH && currentRegion.length > 3) ||
            (currentRegion[0] === str.ITALY_ZH && currentRegion.length > 2) ||
            (currentRegion[0] === str.PHILIPPINES_ZH && currentRegion.length > 2)
        )
            currentNodePath = [ str.GLOBAL_ZH, ...currentRegion.slice(0, currentRegion.length - 1) ].reverse().join('.')

        let displayNodePath =
            Object.keys(currentData).length > 4
                ? currentNodePath
                : currentRegion[0] === str.GLOBAL_ZH
                  ? str.GLOBAL_ZH
                  : [ str.GLOBAL_ZH, ...currentRegion.slice(0, currentRegion.length - 1) ].reverse().join('.')

        if (currentRegion[0] === str.US_ZH && currentRegion.length > 1)
            displayNodePath = [ str.GLOBAL_ZH, str.US_ZH ].reverse().join('.')

        if (currentRegion[0] === str.UK_ZH && currentRegion.length > 2)
            displayNodePath = [ str.GLOBAL_ZH, ...currentRegion.slice(0, 2) ].reverse().join('.')

        if (currentRegion[0] === str.CHINA_ZH && currentRegion.length > 2)
            displayNodePath = [ str.GLOBAL_ZH, ...currentRegion.slice(0, 2) ].reverse().join('.')

        if (currentRegion[0] === str.ITALY_ZH && currentRegion.length > 1)
            displayNodePath = [ str.GLOBAL_ZH, str.ITALY_ZH ].reverse().join('.')

        if (currentRegion[0] === str.PHILIPPINES_ZH && currentRegion.length > 1)
            displayNodePath = [ str.GLOBAL_ZH, str.PHILIPPINES_ZH ].reverse().join('.')

        return (
            <div className="bubble-plot-wrap">
                <ResponsiveBubble
                    ref={this.bubble}
                    root={plotData}
                    theme={{
                        fontFamily: 'Saira, sans-serif',
                        fontSize: !fullTree ? 11 : 14,
                        tooltip: {
                            container: {
                                background: darkMode ? 'var(--darkest-grey)' : 'white'
                            }
                        }
                    }}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    tooltip={({ color, value, data }) => (
                        <span
                            className="plot-tooltip"
                            style={{ color: color === '#fff' && !darkMode ? '#222' : color }}
                        >
                            {data.displayName}
                            <span className="plot-tooltip-bold">{` ${data[metric]}`}</span>
                        </span>
                    )}
                    identity="name"
                    value={metric}
                    colors={[ ...[ 0.3, 0.4, 0.15 ].map((x) => interpolateMagma(1 - x)), '#fff' ]}
                    padding={3}
                    enableLabel={true}
                    label={({ data }) => data.displayName}
                    labelTextColor={'#222'}
                    labelSkipRadius={!fullTree ? 6 : 10}
                    animate={!playing}
                    motionStiffness={50}
                    motionDamping={12}
                    onClick={this.handleNodeClick}
                    defs={[
                        {
                            id: 'bubbleLines',
                            type: 'patternLines',
                            background: 'none',
                            color: 'inherit',
                            rotation: -45,
                            lineWidth: 4,
                            spacing: 5
                        }
                    ]}
                    fill={[
                        {
                            match: (d) => d.path === currentNodePath,
                            id: 'bubbleLines'
                        }
                    ]}
                    currentNodePath={displayNodePath}
                />
            </div>
        )
    }
}
