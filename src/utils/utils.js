import addDays from 'date-fns/addDays'
import subDays from 'date-fns/subDays'
import format from 'date-fns/format'
import zhCN from 'date-fns/locale/zh-CN'
import i18n from '../data/i18n.yml'

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
    // remove parenthesis to save space for legend
    let simplified = name
    if (lang === 'en') simplified = name.split('(')[0].trim()
    if (lang === 'en') simplified = simplified.replace('United States of America', 'USA')
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
