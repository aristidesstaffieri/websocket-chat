import React from 'react'
import P from 'prop-types'
import ReactDOM from 'react-dom'
import io from 'socket.io-client'

import './styles/index.css'

class SidePanel extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div className="active_users_panel">
        <h1 className="panel_title">Active Users</h1>
        { this.props.items.map(item => <h5 className="panel_items" key={ item }>{ item }</h5>) }
      </div>
    )
  }
}

SidePanel.propTypes = {
  items: P.array
}

SidePanel.defaultProps = {
  items: []
}

class ChatApp extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      socket: io('http://localhost:3000'),
      connections: []
    }

    this.state.socket.on('active connections', connections => this.setState({
      connections: connections
    }))
  }

  render () {
    const { connections } = this.state
    console.log(connections)
    return [
      <SidePanel
        key="active_users_panel"
        items={ connections }
      />,
      <div className="active_chat_panel" key="active_chat_panel">

      </div>
    ]
  }
}

var mountNode = document.getElementById('app')
ReactDOM.render(<ChatApp />, mountNode)
