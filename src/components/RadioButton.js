import React, { Component } from 'react'
import { Button, ButtonGroup } from 'reactstrap'

export default class RadioButton extends Component {
    render() {
        const { texts, selected, onSelect } = this.props

        return (
            <div>
                <ButtonGroup>
                    {Object.keys(texts).map((x) => (
                        <Button
                            className="radio-btn"
                            key={x}
                            color="secondary"
                            onClick={() => onSelect(x)}
                            active={selected === x}
                        >
                            {texts[x]}
                        </Button>
                    ))}
                </ButtonGroup>
            </div>
        )
    }
}
