import React from 'react';
import { Form, Button } from 'antd';

const FormItem = Form.Item;

export default class InputForm extends React.Component {
  constructor(props) {
    super(props);
    const inputText = window.localStorage.getItem('textBill') || '';
    this.state = {
      inputText,
    };
  }

  handleChange = event => {
    this.setState({ inputText: event.target.value });
  };

  handleSubmit = event => {
    window.localStorage.setItem('textBill', this.state.inputText);
    this.props.onSubmit(this.state.inputText);
    event.preventDefault();
  };

  render() {
    return (
      <Form onSubmit={this.handleSubmit}>
        <FormItem>
          <textarea
            value={this.state.inputText}
            onChange={this.handleChange}
            rows="30"
            cols="80"
            style={{ lineHeight: '1em' }}
          />
        </FormItem>
        <FormItem>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </FormItem>
      </Form>
    );
  }
}
