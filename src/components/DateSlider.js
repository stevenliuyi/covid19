import React, { Component, Fragment } from 'react'
import { Slider, Rail, Handles, Tracks, Ticks } from 'react-compound-slider'
import format from 'date-fns/format'
import { scaleTime } from 'd3-scale'
import { timeDay } from 'd3-time'
import { parseDate, isoDate } from '../utils/utils'
import i18n from '../data/i18n.yml'

function formatTick(ms, lang) {
    return format(new Date(ms), i18n.DATE_FORMAT_1[lang])
}

export default class DateSlider extends Component {
    render() {
        const {
            date,
            lang,
            startDate,
            endDate,
            handleDateChange,
            handleTempDateChange,
            fullMap,
            fullPlot,
            plotDates
        } = this.props
        let min = parseDate(startDate)
        const max = parseDate(endDate)
        min = new Date(min.getTime() + 1000 * 60 * (max.getTimezoneOffset() - min.getTimezoneOffset()))

        const numberOfDays = (max - min) / (1000 * 3600 * 24)
        const dateTicksInterval = Math.round(numberOfDays / (!fullMap ? 10 : 15))

        const dateTicks = scaleTime()
            .domain([ min, max ])
            .ticks(
                // hack to fix unwanted behavior (https://github.com/d3/d3/issues/2240)
                timeDay.filter(function(d) {
                    return timeDay.count(0, d) % dateTicksInterval === 0
                })
            )
            .map((d) => +d)

        let values = !fullPlot ? [ date ] : plotDates
        values = values.map((x) => {
            let d = parseDate(x)
            d = new Date(d.getTime() + 1000 * 60 * (max.getTimezoneOffset() - d.getTimezoneOffset()))
            return +d
        })

        return (
            <Slider
                className="date-slider"
                mode={1}
                step={1000 * 60 * 60 * 24}
                domain={[ +min, +max ]}
                onChange={(time) => {
                    if (!fullPlot) handleDateChange(isoDate(time[0], endDate).slice(0, 10))
                }}
                onUpdate={handleTempDateChange}
                values={values}
            >
                <Rail>
                    {({ getRailProps }) => (
                        <Fragment>
                            <div className="date-slider-rail-outer" {...getRailProps()} />
                            <div className="date-slider-rail-inner" />
                        </Fragment>
                    )}
                </Rail>
                <Handles>
                    {({ handles, getHandleProps }) => (
                        <div>
                            {handles.map((handle, index) => (
                                <Fragment key={`handle-${index}`}>
                                    <div
                                        className="date-slider-handle-outer"
                                        style={{
                                            left: `${handle.percent}%`
                                        }}
                                        {...getHandleProps(handle.id)}
                                    />
                                    <div
                                        role="slider"
                                        className="date-slider-handle-inner"
                                        // eslint-disable-next-line
                                        aria-valuemin={+min}
                                        // eslint-disable-next-line
                                        aria-valuemax={+max}
                                        aria-valuenow={handle.value}
                                        style={{
                                            left: `${handle.percent}%`
                                        }}
                                    />
                                </Fragment>
                            ))}
                        </div>
                    )}
                </Handles>
                <Tracks left={!fullPlot} right={false}>
                    {({ tracks, getTrackProps }) => (
                        <div>
                            {tracks.map(({ id, source, target }) => (
                                <div
                                    key={`track-${id}`}
                                    className="date-slider-track"
                                    style={{
                                        left: `${source.percent}%`,
                                        width: `${target.percent - source.percent}%`
                                    }}
                                    {...getTrackProps()}
                                />
                            ))}
                        </div>
                    )}
                </Tracks>
                <Ticks values={dateTicks}>
                    {({ ticks }) => (
                        <div>
                            {ticks.map((tick, index) => (
                                <div key={`tick-${index}`}>
                                    <div
                                        className="date-slider-tick"
                                        style={{
                                            left: `${tick.percent}%`
                                        }}
                                    />
                                    <div
                                        className="date-slider-tick-text"
                                        style={{
                                            marginLeft: `${-(100 / ticks.length) / 2}%`,
                                            width: `${100 / ticks.length}%`,
                                            left: `${tick.percent}%`
                                        }}
                                    >
                                        {formatTick(tick.value, lang)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Ticks>
            </Slider>
        )
    }
}
