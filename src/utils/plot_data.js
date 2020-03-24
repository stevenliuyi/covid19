import { getDataFromRegion, metricText, parseDate, simplifyName } from './utils'
import * as str from './strings'
import { plotSpecificTypes } from './plot_types'
import i18n from '../data/i18n.yml'
import diseases from '../data/other_diseases_stats.yml'

export const generatePlotData = (params) => generatePlotDataFunc[params.plotSpecificType](params)

const metricColors = {
    confirmedCount: 'var(--primary-color-4)',
    deadCount: 'var(--primary-color-10)',
    curedCount: 'var(--primary-color-2)'
}

const metricColorsDark = {
    confirmedCount: 'var(--primary-color-4)',
    deadCount: 'var(--lighter-grey)',
    curedCount: 'var(--primary-color-2)'
}

const generatePlotDataTotal = (
    { data, date, currentRegion, lang, darkMode, playing, scale, plotSpecificType, plotDetails, plotDates, fullPlot },
    fullData = false
) => {
    let maxValue = 0
    let minValue = 100000

    let plotData = [ 'deadCount', 'curedCount', 'confirmedCount' ].map((metric) => {
        const counts = getDataFromRegion(data, currentRegion)[metric]
        return {
            id: metricText[metric][lang],
            color: darkMode ? metricColorsDark[metric] : metricColors[metric],
            data: Object.keys(counts)
                .sort((a, b) => (parseDate(a) > parseDate(b) ? 1 : -1))
                .filter((d) => !playing || parseDate(d) <= parseDate(date))
                .map((d) => {
                    if (counts[d] > maxValue) maxValue = counts[d]
                    if (counts[d] < minValue) minValue = counts[d]

                    return scale === 'linear' || counts[d] > 0
                        ? {
                              x: d,
                              y: counts[d]
                          }
                        : null
                })
                .filter((x) => x != null)
        }
    })

    plotData = calcMovingAverage(plotData, plotDetails.movingAverage)
    if (!fullData) plotData = applyDateRange(plotData, plotDates)

    return { plotData, ...getTickValues(scale, plotSpecificType, fullPlot, minValue, maxValue) }
}

const generatePlotDataNew = (params, fullData = false) => {
    let { plotData } = generatePlotDataTotal(params, true)

    plotData = convertTotalToNew(plotData)
    if (!fullData) plotData = applyDateRange(plotData, params.plotDates)

    return { plotData }
}

const generatePlotDataGrowthRate = (params) => {
    let { plotData } =
        params.plotSpecificType === 'growth_total'
            ? generatePlotDataTotal(params, true)
            : generatePlotDataNew(params, true)
    const metric = params.metric

    plotData.forEach((metricData) => {
        metricData.data = metricData.data.reduce(
            (s, v, i) => [
                ...s,
                metricData.data[i - 1] && metricData.data[i - 1].y > 0
                    ? { ...v, y: (v.y - metricData.data[i - 1].y) / metricData.data[i - 1].y }
                    : { ...v, y: 0 }
            ],
            []
        )
    })

    if (metric === 'confirmedCount') plotData = [ plotData[2] ]
    if (metric === 'curedCount') plotData = [ plotData[1] ]
    if (metric === 'deadCount') plotData = [ plotData[0] ]

    plotData = applyDateRange(plotData, params.plotDates)

    return { plotData }
}

const generatePlotDataRate = ({ data, currentRegion, darkMode, lang, date, playing, plotDetails, plotDates }) => {
    const confirmedCounts = getDataFromRegion(data, currentRegion)['confirmedCount']

    const metrics = plotDetails.recoveryRate === 'show' ? [ 'deadCount', 'curedCount' ] : [ 'deadCount' ]
    let plotData = metrics.map((metric) => {
        const counts = getDataFromRegion(data, currentRegion)[metric]
        const newMetric = metric === 'deadCount' ? 'fatalityRate' : 'recoveryRate'
        return {
            id: metricText[newMetric][lang],
            color: darkMode ? metricColorsDark[metric] : metricColors[metric],
            data: Object.keys(counts)
                .filter((d) => !playing || parseDate(d) <= parseDate(date))
                .map((d) => ({ d, count: confirmedCounts[d] > 0 ? counts[d] / confirmedCounts[d] : 0 }))
                .map(({ d, count }) => {
                    return {
                        x: d,
                        y: count
                    }
                })
        }
    })

    plotData = calcMovingAverage(plotData, plotDetails.movingAverage)
    plotData = applyDateRange(plotData, plotDates)

    return { plotData }
}

const generatePlotDataOneVsRest = ({
    data,
    currentRegion,
    metric,
    lang,
    date,
    playing,
    scale,
    plotSpecificType,
    plotDetails,
    plotDates,
    fullPlot
}) => {
    let maxValue = 0
    let minValue = 100000

    const currentData = getDataFromRegion(data, currentRegion)
    const counts = currentData[metric]
    let regionName = lang === 'zh' ? currentRegion[currentRegion.length - 1] : currentData.ENGLISH
    regionName = simplifyName(regionName, lang)

    const parentRegion =
        currentRegion.length === 1 ? [ str.GLOBAL_ZH ] : currentRegion.slice(0, currentRegion.length - 1)
    const parentData = getDataFromRegion(data, parentRegion)
    const parentCounts = parentData[metric]
    let parentRegionName = lang === 'zh' ? parentRegion[parentRegion.length - 1] : parentData.ENGLISH
    parentRegionName = simplifyName(parentRegionName, lang)

    let plotData = []

    const parentPlotData = {
        id: lang === 'zh' ? `${parentRegionName} (${i18n.REST[lang]})` : `${i18n.REST[lang]} of ${parentRegionName}`,
        color: 'var(--primary-color-4)',
        data: Object.keys(parentCounts)
            .filter((d) => !playing || parseDate(d) <= parseDate(date))
            .map((d) => {
                if (counts[d] == null) return null

                if (parentCounts[d] - counts[d] > maxValue) maxValue = parentCounts[d] - counts[d]
                if (parentCounts[d] - counts[d] < minValue) minValue = parentCounts[d] - counts[d]

                return scale === 'linear' || parentCounts[d] - counts[d] > 0
                    ? {
                          x: d,
                          y: parentCounts[d] - counts[d]
                      }
                    : null
            })
            .filter((x) => x != null)
    }

    const currentPlotData = {
        id: regionName,
        color: 'var(--primary-color-2)',
        data: Object.keys(counts)
            .filter((d) => !playing || parseDate(d) <= parseDate(date))
            .map((d) => {
                if (parentCounts[d] == null) return null

                if (counts[d] > maxValue) maxValue = counts[d]
                if (counts[d] < minValue) minValue = counts[d]

                return scale === 'linear' || counts[d] > 0
                    ? {
                          x: d,
                          y: counts[d]
                      }
                    : null
            })
            .filter((x) => x != null)
    }

    plotData.push(parentPlotData)
    plotData.push(currentPlotData)
    if (plotSpecificType === 'one_vs_rest_new') {
        plotData = convertTotalToNew(plotData)
    }

    plotData = calcMovingAverage(plotData, plotDetails.movingAverage)
    plotData = applyDateRange(plotData, plotDates)

    return { plotData, ...getTickValues(scale, plotSpecificType, fullPlot, minValue, maxValue) }
}

const generatePlotDataSubregionRankings = ({
    data,
    currentRegion,
    metric,
    lang,
    darkMode,
    playing,
    date,
    plotDates,
    plotSpecificType
}) => {
    const currentData = getCurrentData(data, currentRegion)
    const subregions = playing
        ? getSubregions(data, currentRegion, metric, 10)
        : getSubregions(data, currentRegion, metric, 10, date)

    let regionIndices = {}
    let dates = []

    let plotData = subregions
        .map((region, i) => {
            dates = [ ...dates, ...Object.keys(currentData[region][metric]) ]
            dates = [ ...new Set(dates) ]
            regionIndices[region] = i
            return region
        })
        .map((region, i) => {
            const id = lang === 'zh' ? region : currentData[region].ENGLISH
            const dd = Object.keys(currentData[region][metric])
                .sort((a, b) => (parseDate(a) > parseDate(b) ? 1 : -1))
                .filter((d) => parseDate(d) <= parseDate(date))
                .filter((d) => parseDate(d) <= parseDate(plotDates[1]) && parseDate(d) >= parseDate(plotDates[0]))
            const counts = dd.map((d) => currentData[region][metric][d])
            let count = counts[counts.length - 1]
            if (plotSpecificType === 'most_affected_subregions_new')
                count =
                    counts.length >= 2
                        ? counts[counts.length - 1] - counts[counts.length - 2]
                        : counts[counts.length - 1]
            return {
                id: simplifyName(id, lang),
                fullId: id,
                name: region,
                color: darkMode ? `var(--primary-color-${i < 7 ? i : i + 1})` : `var(--primary-color-${10 - i})`,
                count,
                data: []
            }
        })

    dates = dates.sort((a, b) => (parseDate(a) > parseDate(b) ? 1 : -1))

    let regionSkipped = {}
    dates
        .filter((d) => parseDate(d) <= parseDate(date))
        .filter((d) => parseDate(d) <= parseDate(plotDates[1]) && parseDate(d) >= parseDate(plotDates[0]))
        .forEach((d, i) => {
            let regionCounts = []
            plotData.forEach((region) => {
                let counts = currentData[region.name][metric][d] ? currentData[region.name][metric][d] : 0
                if (plotSpecificType === 'most_affected_subregions_new') {
                    if (i > 0 && currentData[region.name][metric][dates[i - 1]])
                        counts = counts - currentData[region.name][metric][dates[i - 1]]
                }
                regionCounts.push({
                    region: region.name,
                    counts
                })
            })
            regionCounts = regionCounts.sort((a, b) => (a.counts <= b.counts ? 1 : -1))

            regionCounts.forEach((region, i) => {
                if (region.counts === 0 && regionSkipped[region.region] == null) {
                    plotData[regionIndices[region.region]].data.push({
                        x: d,
                        y: null
                    })
                } else {
                    regionSkipped[region.region] = true
                    plotData[regionIndices[region.region]].data.push({
                        x: d,
                        y: i + 1
                    })
                }
            })
        })

    return { plotData, dates }
}

const generatePlotDataSubregionStream = ({
    data,
    currentRegion,
    lang,
    playing,
    date,
    plotDates,
    metric,
    plotSpecificType,
    fullPlot
}) => {
    const currentData = getCurrentData(data, currentRegion)
    let dates = []
    let plotData = []

    const sortBy = plotSpecificType === 'subregion_active_stream' ? 'confirmedCount' : metric
    const numOfRegions = !fullPlot ? 5 : 9
    let subregionsData = getSubregions(data, currentRegion, sortBy, numOfRegions)
        .map((region) => {
            dates = [ ...dates, ...Object.keys(currentData[region]['confirmedCount']) ]
            dates = [ ...new Set(dates) ]
            return region
        })
        .map((region) => {
            const id = lang === 'zh' ? region : currentData[region].ENGLISH
            return {
                id: simplifyName(id, lang),
                fullId: id,
                name: region
            }
        })

    let plotKeys = subregionsData.map((x) => x.id)

    // at least (numOfRegions + 1) subregions
    if (Object.keys(currentData).length >= numOfRegions + 5) plotKeys = [ ...plotKeys, i18n.OTHERS[lang] ]
    plotKeys = plotKeys.reverse()

    dates = dates.sort((a, b) => (parseDate(a) > parseDate(b) ? 1 : -1))
    dates = dates.filter((d) => parseDate(d) <= parseDate(plotDates[1]) && parseDate(d) >= parseDate(plotDates[0]))

    // no subregions
    if (subregionsData.length === 0) {
        dates = Object.keys(currentData['confirmedCount']).sort((a, b) => (parseDate(a) > parseDate(b) ? 1 : -1))
        let id = lang === 'zh' ? currentRegion[currentRegion.length - 1] : currentData.ENGLISH
        id = simplifyName(id, lang)
        plotKeys = [ id ]
    }

    dates.filter((d) => !playing || parseDate(d) <= parseDate(date)).forEach((d, i) => {
        let subregionCounts = {}
        subregionsData.forEach((region) => {
            if (plotSpecificType === 'subregion_active_stream') {
                const confirmedCount = currentData[region.name]['confirmedCount'][d]
                    ? currentData[region.name]['confirmedCount'][d]
                    : 0
                const deadCount = currentData[region.name]['deadCount'][d]
                    ? currentData[region.name]['deadCount'][d]
                    : 0
                const curedCount = currentData[region.name]['curedCount'][d]
                    ? currentData[region.name]['curedCount'][d]
                    : 0
                const remainingConfirmed = Math.max(confirmedCount - deadCount - curedCount, 0)
                subregionCounts[region.id] = remainingConfirmed
            } else {
                let count = currentData[region.name][metric][d] ? currentData[region.name][metric][d] : 0
                if (plotSpecificType === 'subregion_new_stream' && currentData[region.name][metric][dates[i - 1]])
                    count -= currentData[region.name][metric][dates[i - 1]]
                subregionCounts[region.id] = count
            }
        })

        let otherConfirmedCount = 0
        let otherDeadCount = 0
        let otherCuredCount = 0

        // compute number of remaining confirmed cases from non-top-5 subregions
        Object.keys(currentData)
            .filter(
                (region) => ![ 'confirmedCount', 'deadCount', 'curedCount', 'ENGLISH', str.GLOBAL_ZH ].includes(region)
            )
            .filter((region) => !subregionsData.map((x) => x.name).includes(region))
            .forEach((region) => {
                const confirmedCount = currentData[region]['confirmedCount'][d]
                    ? currentData[region]['confirmedCount'][d]
                    : 0
                const deadCount = currentData[region]['deadCount'][d] ? currentData[region]['deadCount'][d] : 0
                const curedCount = currentData[region]['curedCount'][d] ? currentData[region]['curedCount'][d] : 0
                otherConfirmedCount += confirmedCount
                otherDeadCount += deadCount
                otherCuredCount += curedCount
                if (plotSpecificType === 'subregion_new_stream') {
                    const confirmedCountPrevious = currentData[region]['confirmedCount'][dates[i - 1]]
                        ? currentData[region]['confirmedCount'][dates[i - 1]]
                        : 0
                    const deadCountPrevious = currentData[region]['deadCount'][dates[i - 1]]
                        ? currentData[region]['deadCount'][dates[i - 1]]
                        : 0
                    const curedCountPrevious = currentData[region]['curedCount'][dates[i - 1]]
                        ? currentData[region]['curedCount'][dates[i - 1]]
                        : 0
                    otherConfirmedCount -= confirmedCountPrevious
                    otherDeadCount -= deadCountPrevious
                    otherCuredCount -= curedCountPrevious
                }
            })
        let otherCount = 0
        if (metric === 'confirmedCount') otherCount = Math.max(otherConfirmedCount, 0)
        if (metric === 'deadCount') otherCount = Math.max(otherDeadCount, 0)
        if (metric === 'curedCount') otherCount = Math.max(otherCuredCount, 0)
        if (plotSpecificType === 'subregion_active_stream')
            otherCount = Math.max(otherConfirmedCount - otherDeadCount - otherCuredCount, 0)

        if (Object.keys(currentData).length >= 10) subregionCounts[i18n.OTHERS[lang]] = otherCount

        // no subregions
        if (subregionsData.length === 0) {
            const confirmedCount = currentData['confirmedCount'][d] ? currentData['confirmedCount'][d] : 0
            const deadCount = currentData['deadCount'][d] ? currentData['deadCount'][d] : 0
            const curedCount = currentData['curedCount'][d] ? currentData['curedCount'][d] : 0
            const remainingConfirmed = Math.max(confirmedCount - deadCount - curedCount, 0)
            let id = lang === 'zh' ? currentRegion[currentRegion.length - 1] : currentData.ENGLISH
            id = simplifyName(id, lang)
            subregionCounts[id] =
                plotSpecificType === 'subregion_active_stream'
                    ? remainingConfirmed
                    : Math.max(currentData[metric][d] ? currentData[metric][d] : 0, 0)
        }
        plotData.push(subregionCounts)
    })
    return { plotData, dates, plotKeys }
}

const generatePlotDataFatalityLine = ({ data, currentRegion, date, darkMode, lang, plotSpecificType, plotDates }) => {
    const confirmedCount = getDataFromRegion(data, currentRegion)['confirmedCount']
    const deadCount = getDataFromRegion(data, currentRegion)['deadCount']
    const plotData = [
        {
            id: 'fatality-line',
            color: darkMode ? 'var(--primary-color-2)' : 'var(--primary-color-5)',
            data: Object.keys(confirmedCount)
                .filter(
                    (d) =>
                        parseDate(d) <= parseDate(date) &&
                        confirmedCount[d] > 0 &&
                        (deadCount[d] > 0 ||
                            plotSpecificType === 'fatality_line' ||
                            plotSpecificType === 'fatality_line_only')
                )
                .filter((d) => parseDate(d) <= parseDate(plotDates[1]) && parseDate(d) >= parseDate(plotDates[0]))
                .map((d) => ({ d, cfr: deadCount[d] != null ? deadCount[d] / confirmedCount[d] : 0 }))
                .map(({ d, cfr }) => {
                    return {
                        x: confirmedCount[d],
                        y:
                            plotSpecificType === 'fatality_line' || plotSpecificType === 'fatality_line_only'
                                ? cfr
                                : deadCount[d],
                        date: d,
                        lang
                    }
                })
        }
    ]
    if (plotSpecificType === 'fatality_line' || plotSpecificType === 'fatality_line2')
        Object.keys(diseases).forEach((x) => {
            plotData.push({
                id: x,
                color: 'var(--light-grey)',
                data: [
                    {
                        x: diseases[x].confirmedCount,
                        y:
                            plotSpecificType === 'fatality_line'
                                ? diseases[x].deadCount / diseases[x].confirmedCount
                                : diseases[x].deadCount,
                        lang,
                        name: diseases[x][lang],
                        years: diseases[x].years
                    }
                ]
            })
        })
    return { plotData }
}

const generatePlotDataSubregionFatality = ({ data, currentRegion, date, lang, darkMode, plotSpecificType }) => {
    const currentData = getCurrentData(data, currentRegion)
    let plotData = []
    let maxValue = 0
    let minValue = 100000

    getSubregions(data, currentRegion)
        .reverse()
        .filter(
            (region) =>
                currentData[region]['confirmedCount'][date] > 0 &&
                currentData[region]['deadCount'][date] >= 0 &&
                (currentData[region]['deadCount'][date] > 0 ||
                    plotSpecificType === 'subregion_fatality' ||
                    plotSpecificType === 'subregion_fatality_only')
        )
        .forEach((region, i) => {
            const confirmedCount = currentData[region].confirmedCount[date]
            const deadCount = currentData[region].deadCount[date]
            maxValue = Math.max(maxValue, confirmedCount)
            minValue = Math.min(minValue, confirmedCount)

            plotData.push({
                id: region,
                color: darkMode ? 'rgba(222,73,104,0.6)' : 'rgba(183,55,121,0.5)',
                data: [
                    {
                        x: confirmedCount,
                        y:
                            plotSpecificType === 'subregion_fatality' || plotSpecificType === 'subregion_fatality_only'
                                ? deadCount / confirmedCount
                                : deadCount,
                        regionName: lang === 'zh' ? region : currentData[region].ENGLISH,
                        lang
                    }
                ]
            })
        })

    if (plotSpecificType === 'subregion_fatality' || plotSpecificType === 'subregion_fatality2')
        Object.keys(diseases).forEach((x) => {
            plotData.push({
                id: x,
                color: 'rgba(0,0,0,0)',
                data: [
                    {
                        x: diseases[x].confirmedCount,
                        y:
                            plotSpecificType === 'subregion_fatality'
                                ? diseases[x].deadCount / diseases[x].confirmedCount
                                : diseases[x].deadCount,
                        lang,
                        name: diseases[x][lang],
                        years: diseases[x].years,
                        noClick: true
                    }
                ]
            })
        })

    const { logTickMin, logTickMax } = getLogTickValues(minValue, maxValue)

    return { plotData, logTickMin, logTickMax }
}

const generatePlotDataSubregion = ({
    data,
    date,
    currentRegion,
    lang,
    darkMode,
    playing,
    scale,
    metric,
    plotSpecificType,
    plotDetails,
    plotDates,
    fullPlot
}) => {
    const currentData = getCurrentData(data, currentRegion)
    let maxValue = 0
    let minValue = 100000

    const numOfRegions = !fullPlot ? 6 : 10
    const subregions = playing
        ? getSubregions(data, currentRegion, metric, numOfRegions)
        : getSubregions(data, currentRegion, metric, numOfRegions, date)

    let plotData = subregions
        .map((region, i) => {
            const counts = currentData[region][metric]
            const id = lang === 'zh' ? region : currentData[region].ENGLISH
            return {
                id: simplifyName(id, lang),
                fullId: id,
                name: region,
                color: darkMode ? `var(--primary-color-${i < 7 ? i : i + 1})` : `var(--primary-color-${10 - i})`,
                data: Object.keys(counts)
                    .filter((d) => !playing || parseDate(d) <= parseDate(date))
                    .map((d) => {
                        if (counts[d] > maxValue) maxValue = counts[d]
                        if (counts[d] < minValue) minValue = counts[d]

                        return scale === 'linear' || counts[d] > 0
                            ? {
                                  x: d,
                                  y: counts[d],
                                  lang
                              }
                            : null
                    })
                    .filter((x) => x != null)
            }
        })
        .reverse()

    if (plotSpecificType === 'subregion_new') plotData = convertTotalToNew(plotData)

    plotData = calcMovingAverage(plotData, plotDetails.movingAverage)
    plotData = applyDateRange(plotData, plotDates)

    return { plotData, ...getTickValues(scale, plotSpecificType, fullPlot, minValue, maxValue) }
}

const getCurrentData = (data, currentRegion) => {
    const currentData =
        currentRegion.length === 1 && currentRegion[0] === str.GLOBAL_ZH ? data : getDataFromRegion(data, currentRegion)

    return currentData
}

// convert cumulative dataset to daily increasement dataset
const convertTotalToNew = (plotData) => {
    plotData.forEach((metricData) => {
        metricData.data = metricData.data.reduce(
            (s, v, i) => [ ...s, metricData.data[i - 1] ? { ...v, y: v.y - metricData.data[i - 1].y } : v ],
            []
        )
    })

    return plotData
}

// moving averages
const calcMovingAverage = (plotData, days) => {
    if (days === '3d') {
        plotData.forEach((metricData) => {
            metricData.data = metricData.data.reduce((s, v, i) => {
                let newY = v.y
                if (metricData.data[i - 1] && metricData.data[i + 1]) {
                    newY = (metricData.data[i - 1].y + v.y + metricData.data[i + 1].y) / 3
                }
                return [ ...s, { ...v, y: newY } ]
            }, [])
        })
    } else if (days === '5d') {
        plotData.forEach((metricData) => {
            metricData.data = metricData.data.reduce((s, v, i) => {
                let newY = v.y
                if (
                    metricData.data[i - 1] &&
                    metricData.data[i - 2] &&
                    metricData.data[i + 1] &&
                    metricData.data[i + 2]
                ) {
                    newY =
                        (metricData.data[i - 2].y +
                            metricData.data[i - 1].y +
                            v.y +
                            metricData.data[i + 1].y +
                            metricData.data[i + 2].y) /
                        5
                } else if (metricData.data[i - 1] && metricData.data[i + 1]) {
                    newY = (metricData.data[i - 1].y + v.y + metricData.data[i + 1].y) / 3
                }
                return [ ...s, { ...v, y: newY } ]
            }, [])
        })
    }

    return plotData
}

// apply date range
const applyDateRange = (plotData, plotDates) => {
    plotData.forEach((p) => {
        p.data = p.data.filter(
            (x) => parseDate(x.x) <= parseDate(plotDates[1]) && parseDate(x.x) >= parseDate(plotDates[0])
        )
    })

    return plotData
}

// data from top N subregions
const getSubregions = (data, currentRegion, metric = 'confirmedCount', topN = null, date = null) => {
    const currentData = getCurrentData(data, currentRegion)

    const subregions = Object.keys(currentData)
        .filter((region) => ![ 'confirmedCount', 'deadCount', 'curedCount', 'ENGLISH', str.GLOBAL_ZH ].includes(region))
        .sort((a, b) => {
            let aCounts = Math.max(...Object.values(currentData[a][metric]))
            let bCounts = Math.max(...Object.values(currentData[b][metric]))
            if (date != null) {
                aCounts = currentData[a][metric][date] ? currentData[a][metric][date] : 0
                bCounts = currentData[b][metric][date] ? currentData[b][metric][date] : 0
            }

            return aCounts <= bCounts ? 1 : -1
        })

    // top affected subregions
    return topN != null
        ? subregions.filter(
              (region, i) => i <= topN - 1 && Math.max(...Object.values(currentData[region][metric])) !== 0
          )
        : subregions
}

const getLogTickValues = (minValue, maxValue) => {
    const logTickMin = minValue <= maxValue ? Math.max(10 ** Math.floor(Math.log10(minValue)), 1) : 1
    const logTickMax = minValue <= maxValue ? Math.max(10 ** Math.ceil(Math.log10(maxValue)), 10) : 1
    const tickValues = [ ...Array(Math.log10(logTickMax / logTickMin) + 1).keys() ].map((x) => 10 ** x * logTickMin)

    return { tickValues, logTickMin, logTickMax }
}

const getTickValues = (scale, plotSpecificType, fullPlot, minValue, maxValue) => {
    return scale === 'log' && plotSpecificTypes[plotSpecificType].log
        ? getLogTickValues(minValue, maxValue)
        : { tickValues: fullPlot ? 10 : 5, logTickMin: 1, logTickMax: 1 }
}

const generatePlotDataFunc = {
    total: generatePlotDataTotal,
    new: generatePlotDataNew,
    growth_total: generatePlotDataGrowthRate,
    growth_new: generatePlotDataGrowthRate,
    fatality_recovery: generatePlotDataRate,
    one_vs_rest: generatePlotDataOneVsRest,
    one_vs_rest_new: generatePlotDataOneVsRest,
    most_affected_subregions: generatePlotDataSubregionRankings,
    most_affected_subregions_new: generatePlotDataSubregionRankings,
    subregion_active_stream: generatePlotDataSubregionStream,
    fatality_line: generatePlotDataFatalityLine,
    fatality_line2: generatePlotDataFatalityLine,
    fatality_line_only: generatePlotDataFatalityLine,
    fatality_line2_only: generatePlotDataFatalityLine,
    subregion_fatality: generatePlotDataSubregionFatality,
    subregion_fatality2: generatePlotDataSubregionFatality,
    subregion_fatality_only: generatePlotDataSubregionFatality,
    subregion_fatality2_only: generatePlotDataSubregionFatality,
    subregion_total: generatePlotDataSubregion,
    subregion_new: generatePlotDataSubregion,
    subregion_total_stream: generatePlotDataSubregionStream,
    subregion_new_stream: generatePlotDataSubregionStream
}
