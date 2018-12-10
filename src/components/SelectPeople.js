import React from 'react';
import { Checkbox, Col, Row } from 'antd';

import InputName from './InputName';

export default class SelectPeople extends React.Component {
  handleCheckboxChange = ({ target }) => {
    const { value, checked } = target;
    console.log('checked = ', value, checked);
    this.props.onTogglePerson(value);
  };

  render() {
    return (
      <React.Fragment>
        <InputName onSubmit={this.props.addNewPerson} />
        {this.props.people.map(item => (
          <Row key={item}>
            <Col span={24}>
              <Checkbox
                value={item}
                checked={this.props.selectedPeople.includes(item)}
                onChange={this.handleCheckboxChange}>
                {item}
              </Checkbox>
            </Col>
          </Row>
        ))}
      </React.Fragment>
    );
  }
}
