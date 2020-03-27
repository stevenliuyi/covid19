import addDays from 'date-fns/addDays'
import subDays from 'date-fns/subDays'
import format from 'date-fns/format'
import zhCN from 'date-fns/locale/zh-CN'
import i18n from '../data/i18n.yml'
import * as str from './strings'

export const parseDate = (date) => {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

export const nextDay = (date, startDate, endDate) => {
    const newDay = addDays(parseDate(date), 1)
    const lastDay = parseDate(endDate)
    return newDay <= lastDay ? format(newDay, 'yyyy-MM-dd') : startDate
}

export const previousDay = (date, startDate, endDate) => {
    const newDay = subDays(parseDate(date), 1)
    const firstDay = parseDate(startDate)
    return newDay >= firstDay ? format(newDay, 'yyyy-MM-dd') : endDate
}

export const formatDate = (date, lang) => {
    if (lang === 'zh') {
        return format(parseDate(date), 'yyyy年MMMd日', { locale: zhCN })
    } else {
        return format(parseDate(date), 'MMM d, yyyy')
    }
}

export const metricText = {
    confirmedCount: i18n.CONFIRMED,
    deadCount: i18n.DEATHS,
    curedCount: i18n.RECOVERED,
    fatalityRate: i18n.FATALITY_RATE,
    recoveryRate: i18n.RECOVERY_RATE
}

export const getDataFromRegion = (data, region) => [ data, ...region ].reduce((s, x) => s[x])

export const simplifyName = (name, lang) => {
    let simplified = name
    // remove parenthesis to save space for legend
    if (lang === 'en') simplified = name.split('(')[0].trim()

    if (lang === 'en') simplified = simplified.replace('United States of America', 'USA')
    if (lang === 'en') simplified = simplified.replace('United Kingdom', 'UK')
    if (lang === 'en') simplified = simplified.replace('International Conveyance', "Int'l Conveyance")
    if (lang === 'en') simplified = simplified.replace(' District', '')
    if (lang === 'en') simplified = simplified.replace(' County', '')
    if (lang === 'zh') simplified = simplified.replace('（来自钻石公主号）', '').trim()

    return simplified
}

export const updateDarkMode = (isDarkMode) => {
    document.body.style.background = !isDarkMode ? '#fff' : 'var(--darker-grey)'
    if (isDarkMode) {
        document.body.classList.add('dark')
    } else {
        document.body.classList.remove('dark')
    }
}

export const generateTreeData = (
    obj,
    date,
    lang,
    simplified = true,
    childrenLabel = 'children',
    sortBy = null,
    rootRegion = str.GLOBAL_ZH,
    moreCounts = false
) => {
    const preDate = previousDay(date, '2019-09-01', '2050-01-01')

    let data = Object.entries(obj)
        .filter(([ k, v ]) => ![ 'confirmedCount', 'deadCount', 'curedCount', 'ENGLISH', str.GLOBAL_ZH ].includes(k))
        .map(([ k, v ]) => {
            const currentRegion = rootRegion === str.GLOBAL_ZH ? k : `${rootRegion}.${k}`
            let newdata = {
                name: k,
                displayName: lang === 'zh' ? k : v.ENGLISH,
                region: currentRegion,
                confirmedCount:
                    Object.keys(v.confirmedCount).length === 0
                        ? NaN
                        : v.confirmedCount[date] ? v.confirmedCount[date] : 0,
                deadCount: Object.keys(v.deadCount).length === 0 ? NaN : v.deadCount[date] ? v.deadCount[date] : 0,
                curedCount: Object.keys(v.curedCount).length === 0 ? NaN : v.curedCount[date] ? v.curedCount[date] : 0
            }

            if (moreCounts) {
                const preConfirmedCount =
                    preDate in v.confirmedCount ? v.confirmedCount[preDate] : newdata.confirmedCount
                const preDeadCount = preDate in v.deadCount ? v.deadCount[preDate] : newdata.deadCount

                newdata = {
                    ...newdata,
                    active: newdata.confirmedCount - newdata.deadCount - newdata.curedCount,
                    newConfirmed: newdata.confirmedCount - preConfirmedCount,
                    newDead: newdata.deadCount - preDeadCount,
                    fatalityRate: newdata.deadCount / newdata.confirmedCount,
                    recoveryRate: newdata.curedCount / newdata.confirmedCount
                }
            }

            // remove some regions for the simplicity of bubble plot
            if (
                simplified &&
                (k === str.LONDON_EN ||
                    (obj.ENGLISH === str.NETHERLANDS_EN && k === str.NETHERLANDS_ZH) ||
                    obj.ENGLISH === str.MAINLAND_CHINA_EN ||
                    obj.ENGLISH === str.US_EN)
            ) {
                return newdata
            }

            if (Object.keys(v).length > 4) {
                newdata[childrenLabel] = generateTreeData(
                    v,
                    date,
                    lang,
                    simplified,
                    childrenLabel,
                    sortBy,
                    currentRegion,
                    moreCounts
                )
            }
            return newdata
        })

    return sortBy ? data.sort((a, b) => (a[sortBy] < b[sortBy] ? 1 : -1)) : data
}
