import React, { Component, Fragment } from 'react'
import { FaInfoCircle, FaGithub } from 'react-icons/fa'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import i18n from '../data/i18n.yml'

export default class Footer extends Component {
    state = {
        modal: false
    }

    toggle = () => this.setState({ modal: !this.state.modal })

    render() {
        const { lang } = this.props

        return (
            <Fragment>
                <div className="footer">
                    <span>
                        <a href="https://yliu.io">Steven Liu</a> 2020
                    </span>
                    <FaInfoCircle size={18} onClick={() => this.setState({ modal: true })} />
                    <FaGithub size={18} onClick={() => window.open('https://github.com/stevenliuyi/covid19')} />
                </div>
                <Modal isOpen={this.state.modal} centered={true} toggle={this.toggle}>
                    <ModalHeader toggle={this.toggle}>{i18n.ABOUT[lang]}</ModalHeader>
                    <ModalBody className="footer-about">
                        <div dangerouslySetInnerHTML={{ __html: i18n.ABOUT_TEXT[lang] }} />
                    </ModalBody>
                </Modal>
            </Fragment>
        )
    }
}
