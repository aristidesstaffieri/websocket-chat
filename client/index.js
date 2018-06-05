import React from 'react'
import P from 'prop-types'
import ReactDOM from 'react-dom'
import io from 'socket.io-client'

import './styles/index.css'

class Messages extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return [
      <div className="to" key="to">
        { this.props.messages.to }
      </div>,
      <div className="from" key="from">
        { this.props.messages.from }
      </div>
    ]
  }
}

class InputField extends React.Component {
  constructor(props) {
    super(props)
    this.state = { value: '' }

    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange(event) {
    this.setState({value: event.target.value})
  }

  handleSubmit(event) {
    console.log(this.state.value)
    event.preventDefault()
    this.props.onSubmit(this.state.value)
  }

  render() {
    return (
      <form onSubmit={ this.handleSubmit } className="chat_form">
        <input name="chat_input" type="text" value={ this.state.value } onChange={ this.handleChange } />
        <input type="submit" value="Send" />
      </form>
    )
  }
}

InputField.propTypes = {
  onSubmit: P.func
}

InputField.defaultProps = {
  onSubmit: () => false //no op
}

class SidePanel extends React.Component {
  constructor(props) {
    super(props)

    this.onClickItem = this.onClickItem.bind(this)
  }

  onClickItem(item) {
    this.props.onClickItem(item)
  }

  render() {
    const { activeItem } = this.props

    return (
      <div className="active_users_panel">
        <h1 className="panel_title">Active Users</h1>
        { this.props.items.map(item => {
          return (
            <h5
            className={ `panel_items ${ activeItem === item && 'active' }` }
            onClick={ this.onClickItem.bind(null, item) }
            key={ item }>
              { item }
            </h5>
          )
        }) }
      </div>
    )
  }
}

SidePanel.propTypes = {
  items: P.array,
  // activeItem: P.oneOfType([P.string, P.null]),
  onClickItem: P.func
}

SidePanel.defaultProps = {
  items: [],
  activeItem: null,
  onClickItem: () => false //no op
}

class ChatApp extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      socket: io('http://localhost:3000'),
      connections: [],
      userId: null,
      activeItem: null,
      messages: {
        to: [],
        from: []
      }
    }

    this.setActiveItem = this.setActiveItem.bind(this)
    this.sendMessage = this.sendMessage.bind(this)

    this.state.socket.on('active connections', connections => this.setState({
      connections: connections
    }))

    this.state.socket.on('userId', id => this.setState({
      userId: id
    }))

    this.state.socket.on('message::to', msg => this.setState({
      messages: Object.assign(
        {},
        this.state.messages,
        { to: this.state.messages.to.concat([msg]) }
      )
    }))
  }

  setActiveItem(item) {
    this.setState({
      activeItem: item
    })
  }

  sendMessage(msg) {
    const message = {
      id: this.state.activeItem,
      userId: this.state.userId,
      msg
    }
    this.state.socket.emit('private_msg', message)
    this.setState({
      messages: Object.assign(
        {},
        this.state.messages,
        { from: this.state.messages.from.concat([msg]) }
      )
    })
  }

  render () {
    const { connections, userId, activeItem, messages } = this.state
    return [
      <SidePanel
        key="active_users_panel"
        items={ connections.filter(id => id !== userId) }
        activeItem={ activeItem }
        onClickItem={ this.setActiveItem }
      />,
      <div className="active_chat_panel" key="active_chat_panel">
        <div className="conversation">
          <Messages messages={ messages } />
        </div>
        <InputField onSubmit={ this.sendMessage } />
      </div>
    ]
  }
}

var mountNode = document.getElementById('app')
ReactDOM.render(<ChatApp />, mountNode)
