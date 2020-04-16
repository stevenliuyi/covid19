import React, { Component } from 'react'
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import { isMobile, isIPad13 } from 'react-device-detect'
import i18n from '../data/i18n.yml'

export default class NavBar extends Component {
    state = {
        langText: 'English',
        scaleText: i18n.LINEAR_SCALE.en,
        darkModeText: i18n.DARK.en
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            prevProps.scale !== this.props.scale ||
            prevProps.lang !== this.props.lang ||
            prevProps.darkMode !== this.props.darkMode
        )
            this.setTexts()
    }

    setTexts = () => {
        const { scale, lang, darkMode } = this.props
        this.setState({
            langText: i18n.LANGUAGE[lang],
            scaleText: scale === 'linear' ? i18n.LINEAR_SCALE[lang] : i18n.LOG_SCALE[lang],
            darkModeText: darkMode ? i18n.DARK[lang] : i18n.LIGHT[lang]
        })
    }

    onScaleChange = () => {
        const newScale = this.props.scale === 'linear' ? 'log' : 'linear'
        this.props.scaleToggle(newScale)
    }

    render() {
        const { scale, lang, darkMode, languageToggle } = this.props
        return (
            <div className="nav-bar">
                <UncontrolledDropdown>
                    <DropdownToggle
                        tag="div"
                        className="nav-bar-icon"
                        data-toggle="dropdown"
                        data-tip={i18n.LANGUAGE_HELP_TEXT[lang]}
                    >
                        {i18n.LANGUAGE[lang]}
                    </DropdownToggle>
                    <DropdownMenu>
                        {Object.keys(i18n.LANGUAGE).map((x) => (
                            <DropdownItem
                                key={x}
                                className={x === lang ? 'current' : ''}
                                onClick={() => languageToggle(x)}
                            >
                                {i18n.LANGUAGE[x]}
                            </DropdownItem>
                        ))}
                    </DropdownMenu>
                </UncontrolledDropdown>
                {isMobile || isIPad13 ? (
                    <div className="nav-bar-icon" onTouchStart={this.props.darkModeToggle}>
                        {darkMode ? i18n.DARK[lang] : i18n.LIGHT[lang]}
                    </div>
                ) : (
                    <div
                        className="nav-bar-icon"
                        data-tip={darkMode ? i18n.LIGHT_MODE_HELP_TEXT[lang] : i18n.DARK_MODE_HELP_TEXT[lang]}
                        onClick={this.props.darkModeToggle}
                        onMouseEnter={() =>
                            this.setState({
                                darkModeText: darkMode ? i18n.LIGHT[lang] : i18n.DARK[lang]
                            })}
                        onMouseLeave={this.setTexts}
                    >
                        {this.state.darkModeText}
                    </div>
                )}
                {isMobile || isIPad13 ? (
                    <div className="nav-bar-icon" onTouchStart={this.onScaleChange}>
                        {scale === 'linear' ? i18n.LINEAR_SCALE[lang] : i18n.LOG_SCALE[lang]}
                    </div>
                ) : (
                    <div
                        className="nav-bar-icon"
                        data-tip={
                            scale === 'linear' ? i18n.LOG_SCALE_HELP_TEXT[lang] : i18n.LINEAR_SCALE_HELP_TEXT[lang]
                        }
                        onClick={this.onScaleChange}
                        onMouseEnter={() =>
                            this.setState({
                                scaleText: scale === 'linear' ? i18n.LOG_SCALE[lang] : i18n.LINEAR_SCALE[lang]
                            })}
                        onMouseLeave={this.setTexts}
                    >
                        {this.state.scaleText}
                    </div>
                )}
                <div className="nav-bar-icon" data-tip={i18n.RESET_HELP_TEXT[lang]} onClick={this.props.reset}>
                    {i18n.RESET[lang]}
                </div>
            </div>
        )
    }
}
