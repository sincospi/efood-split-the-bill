import React from 'react';
import { Button, List, Row, Col, Popover, Tag } from 'antd';

import SelectPeople from './SelectPeople';
import toCurrencyStr from '../lib/toCurrencyStr';

export default function BillList({
  bill,
  people,
  addPerson,
  togglePersonToBillItem,
}) {
  return (
    <List
      bordered
      dataSource={bill}
      renderItem={(item, index) => (
        <List.Item key={index}>
          <Row style={{ width: '100%' }}>
            <Col span={1}>{item.quantity}</Col>
            <Col span={1}>x</Col>
            <Col span={2}>{toCurrencyStr(item.price)}</Col>
            <Col span={12}>
              <i>{item.description}</i>
            </Col>
            <Col span={8}>
              <Popover
                trigger="click"
                title="Associate people"
                content={
                  <SelectPeople
                    people={people}
                    selectedPeople={item.people || []}
                    onTogglePerson={person =>
                      togglePersonToBillItem(index, person)
                    }
                    addNewPerson={addPerson}
                  />
                }>
                {bill[index].people && bill[index].people.length ? (
                  bill[index].people.map(user => <Tag key={user}>{user}</Tag>)
                ) : (
                  <Button type="primary">Assign People</Button>
                )}
              </Popover>
            </Col>
          </Row>
        </List.Item>
      )}
    />
  );
}
