import React, { Component } from 'react'
import Select from 'react-select'
import { MdArrowDropDownCircle } from 'react-icons/md'
import { GoFold, GoUnfold } from 'react-icons/go'
import RegionDropdown from './RegionDropdown'
import RegionSelectOption from './RegionSelectOption'
import { formatDate, getDataFromRegion } from '../utils/utils'
import * as str from '../utils/strings'
import i18n from '../data/i18n.yml'

const selectStyles = {
    control: (provided, state) => ({
        ...provided,
        minWidth: 240,
        marginBottom: 8,
        borderRadius: 30
    }),
    menu: () => ({
        backgroundColor: 'white',
        boxShadow: '0 0 0 1px hsla(218, 50%, 10%, 0.1), 0 4px 11px hsla(218, 50%, 10%, 0.1)',
        cursor: 'pointer'
    }),
    option: (provided, state) => ({
        ...provided,
        textAlign: 'left',
        fontSize: 12,
        backgroundColor: state.isFocused ? 'var(--primary-color-5)' : state.isSelected ? '#eee' : null,
        color: state.isFocused ? '#fff' : '#000',
        cursor: 'pointer'
    })
}

export default class Region extends Component {
    state = {
        isOpen: false,
        value: undefined,
        options: [],
        countryOnly: true
    }

    componentDidMount() {
        const options = this.generateOptions([])
        this.setState({ options, value: { value: this.props.lang === 'zh' ? str.GLOBAL_ZH : str.GLOBAL_EN } })
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            prevProps.lang !== this.props.lang ||
            prevProps.metric !== this.props.metric ||
            prevProps.date !== this.props.date ||
            prevState.countryOnly !== this.state.countryOnly
        ) {
            const options = this.generateOptions([])
            this.setState({ options })
        }

        if (prevState.isOpen !== this.state.isOpen || prevState.countryOnly !== this.state.countryOnly) {
            this.props.ReactTooltip.rebuild()
        }

        if (prevProps.currentRegion !== this.props.currentRegion) {
            const { data, currentRegion, lang } = this.props
            const englishRegion = [ ...Array(currentRegion.length).keys() ]
                .map((i) => currentRegion.slice(0, i + 1))
                .map((regionList) => getDataFromRegion(data, regionList).ENGLISH)
            this.setState({ value: { value: lang === 'zh' ? currentRegion.join('') : englishRegion.join('') } })
        }
    }

    toggleOpen = () => {
        this.setState((state) => ({ isOpen: !state.isOpen }))
    }

    toggleCountryOnly = () => {
        this.props.ReactTooltip.hide(this.regionSelectMore)
        this.setState({
            countryOnly: !this.state.countryOnly
        })
    }

    onSelectChange = (selected) => {
        this.toggleOpen()
        this.setState({ value: selected })
        this.props.regionToggle(selected.region)
    }

    generateOptions = (root) => {
        const { data, lang, date, metric } = this.props
        const englishRoot = [ ...Array(root.length).keys() ]
            .map((i) => root.slice(0, i + 1))
            .map((regionList) => getDataFromRegion(data, regionList).ENGLISH)

        let options = []
        const regionData = getDataFromRegion(data, root)
        Object.keys(regionData)
            .filter((d) => ![ 'confirmedCount', 'deadCount', 'curedCount', 'ENGLISH' ].includes(d))
            .sort((a, b) => {
                const aCount = regionData[a][metric][date] ? regionData[a][metric][date] : 0
                const bCount = regionData[b][metric][date] ? regionData[b][metric][date] : 0
                return aCount > bCount ? -1 : 1
            })
            .forEach((d) => {
                options.push({
                    value: lang === 'zh' ? [ ...root, d ].join('') : [ ...englishRoot, regionData[d].ENGLISH ].join(''),
                    region: [ ...root, d ],
                    label: (
                        <RegionSelectOption
                            region={lang === 'zh' ? [ ...root, d ] : [ ...englishRoot, regionData[d].ENGLISH ]}
                            data={regionData[d]}
                            date={date}
                            metric={metric}
                        />
                    )
                })
                const childData = getDataFromRegion(data, [ ...root, d ])
                if (Object.keys(childData).length > 4 && (!this.state.countryOnly || d === str.CHINA_ZH))
                    options = [ ...options, ...this.generateOptions([ ...root, d ]) ]
            })

        return options
    }

    displayRegionName = () => {
        const { currentRegion, data, lang } = this.props

        // remove duplicates in case same region occurs at different level (e.g. Japan)
        let region = [ ...new Set(currentRegion) ]

        if (lang === 'zh') {
            region = region.join('')
            region = region !== str.CHINA_ZH ? region.replace(str.CHINA_ZH, '') : str.CHINA_ZH
            region =
                region !== str.INTL_CONVEYANCE_ZH ? region.replace(str.INTL_CONVEYANCE_ZH, '') : str.INTL_CONVEYANCE_ZH
            return region !== str.MAINLAND_CHINA_ZH ? region.replace(str.MAINLAND_CHINA_ZH, '') : str.MAINLAND_CHINA_ZH
        } else {
            if (data == null) return
            const englishRegion = [ ...Array(region.length).keys() ]
                .map((i) => currentRegion.slice(0, i + 1))
                .map((regionList) => getDataFromRegion(data, regionList).ENGLISH)
            region = englishRegion.reverse().join(', ')
            region = region !== str.CHINA_EN ? region.replace(`, ${str.CHINA_EN}`, '') : str.CHINA_EN
            region =
                region !== str.INTL_CONVEYANCE_EN
                    ? region.replace(`, ${str.INTL_CONVEYANCE_EN}`, '')
                    : str.INTL_CONVEYANCE_EN
            return region !== str.MAINLAND_CHINA_EN
                ? region.replace(`, ${str.MAINLAND_CHINA_EN}`, '')
                : str.MAINLAND_CHINA_EN
        }
    }

    displayDate = () => {
        const { lang, date } = this.props
        return formatDate(date, lang)
    }

    render() {
        const { isOpen, value, countryOnly } = this.state
        if (this.props.data == null) return

        const MoreIcon = countryOnly ? GoUnfold : GoFold

        return (
            <div className="current-region-wrap">
                <RegionDropdown
                    isOpen={isOpen}
                    onClose={this.toggleOpen}
                    target={
                        <div className="current-region" onClick={this.toggleOpen}>
                            <div>{this.displayRegionName()}</div>
                            <MdArrowDropDownCircle size={20} className="dropdown-arrow" />
                        </div>
                    }
                >
                    <Select
                        classNamePrefix={'region-select'}
                        autoFocus
                        backspaceRemovesValue={false}
                        components={{
                            DropdownIndicator: () => (
                                <span
                                    className="region-select-more"
                                    onMouseUp={this.toggleCountryOnly}
                                    onTouchEnd={this.toggleCountryOnly}
                                    onMouseEnter={() => this.props.ReactTooltip.show(this.regionSelectMore)}
                                    onMouseLeave={() => this.props.ReactTooltip.hide(this.regionSelectMore)}
                                    ref={(ref) => (this.regionSelectMore = ref)}
                                    data-tip={
                                        countryOnly ? (
                                            i18n.MORE_REGIONS_HELP_TEXT[this.props.lang]
                                        ) : (
                                            i18n.LESS_REGIONS_HELP_TEXT[this.props.lang]
                                        )
                                    }
                                >
                                    <MoreIcon size={16} color={'var(--primary-color-5)'} />
                                </span>
                            ),
                            IndicatorSeparator: null
                        }}
                        controlShouldRenderValue={false}
                        hideSelectedOptions={false}
                        isClearable={false}
                        menuIsOpen
                        onChange={this.onSelectChange}
                        options={this.state.options}
                        placeholder={`${i18n.SEARCH[this.props.lang]} ...... `}
                        styles={selectStyles}
                        tabSelectsValue={false}
                        value={value}
                        noOptionsMessage={() => i18n.NO_RESULT[this.props.lang]}
                    />
                </RegionDropdown>
                <div className="current-date">{this.displayDate()}</div>
            </div>
        )
    }
}
