import React from 'react';

export default class InputName extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputText: '',
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ inputText: event.target.value });
  }

  handleSubmit(event) {
    this.props.onSubmit(this.state.inputText);
    this.setState({ inputText: '' });
    event.preventDefault();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <input
          value={this.state.inputText}
          onChange={this.handleChange}
          required
        />
        <button type="submit">Add Person</button>
      </form>
    );
  }
}
