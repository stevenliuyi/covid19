import React, { Component } from 'react'
import { MdPause, MdPlayArrow, MdChevronLeft, MdChevronRight } from 'react-icons/md'
import { nextDay, previousDay } from '../utils/utils'

export default class AminationController extends Component {
    animationLoop = () =>
        setTimeout(() => {
            if (this.props.playing) {
                this.dateForward()
                this.animationLoop()
            }
        }, 500)

    componentDidUpdate(prevProps, prevState) {
        if (this.props.playing) this.animationLoop()
    }

    shouldComponentUpdate(prevProps, prevState) {
        return !this.props.playing
    }

    dateForward = () => {
        const { date, startDate, endDate, handleDateChange } = this.props
        handleDateChange(nextDay(date, startDate, endDate))
    }

    dateBackward = () => {
        const { date, startDate, endDate, handleDateChange } = this.props
        handleDateChange(previousDay(date, startDate, endDate))
    }

    startAnimation = () => this.props.playingToggle()

    stopAnimation = () => {
        this.props.playingToggle()
        this.forceUpdate()
    }

    render() {
        const { playing } = this.props
        return (
            <div className="anime-ctrl">
                <div className={`anime-ctrl-left-right ${playing ? 'anime-ctrl-playing' : ''}`}>
                    <MdChevronLeft size={30} onClick={this.dateBackward} />
                </div>
                <div className="anime-ctrl-play">
                    {playing ? (
                        <MdPause size={30} onClick={this.stopAnimation} />
                    ) : (
                        <MdPlayArrow size={30} onClick={this.startAnimation} />
                    )}
                </div>
                <div className={`anime-ctrl-left-right ${playing ? 'anime-ctrl-playing' : ''}`}>
                    <MdChevronRight size={30} onClick={this.dateForward} />
                </div>
            </div>
        )
    }
}
