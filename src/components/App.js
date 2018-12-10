import React from 'react';
import { Button, Icon, Collapse, Tag } from 'antd';

import InputForm from './InputForm';
import BillList from './BillList';
import buildBill, { buildUserBill } from '../lib/buildBill';

const Panel = Collapse.Panel;

class App extends React.Component {
  constructor(props) {
    super(props);
    const people = window.localStorage.getItem('people');
    this.state = {
      activeSection: 1,
      bill: [],
      totalBeforeDiscountEuro: 0,
      totalAfterDiscountEuro: 0,
      discount: 0,
      discountEuro: 0,
      people: people ? people.split(',').sort() : [],
      checkSumIsValid: false,
      perUserBill: null,
    };
  }

  prevSection = () => {
    this.setState(({ activeSection }) => ({
      activeSection: activeSection - 1,
    }));
  };

  nextSection = () => {
    this.setState(({ activeSection }) => ({
      activeSection: activeSection + 1,
    }));
  };

  parseTextBill = textBill => {
    if (textBill) {
      const {
        bill,
        totalAfterDiscountEuro,
        totalBeforeDiscountEuro,
        discount,
      } = buildBill(textBill);
      if (bill.length) {
        this.setState(
          () => ({
            bill,
            totalAfterDiscountEuro,
            totalBeforeDiscountEuro,
            discount,
          }),
          () => {
            this.nextSection();
            console.debug('The bill', this.state.bill);
          },
        );
      } else {
        console.log('Parsing error');
      }
    } else {
      console.log('No text bill');
    }
  };

  addPerson = name => {
    if (!this.state.people.includes(name)) {
      this.setState(
        ({ people }) => ({ people: [...people, name].sort() }),
        () => {
          console.log('people', this.state.people);
          window.localStorage.setItem('people', this.state.people);
        },
      );
    }
  };

  removePerson = name => {
    const notName = person => person !== name;
    this.setState(
      ({ people, bill }) => {
        bill.forEach(billItem => {
          if (billItem.people && billItem.people.length) {
            billItem.people = billItem.people.filter(notName);
          }
        });
        return {
          people: people.filter(notName),
          bill,
        };
      },
      () => {
        console.log('people', this.state.people);
        window.localStorage.setItem('people', this.state.people);
      },
    );
  };

  togglePersonToBillItem = (billItemIndex, person) => {
    this.setState(
      ({ bill }) => {
        let billItemPeople = bill[billItemIndex].people || [];
        const index = billItemPeople.indexOf(person);
        if (index > -1) {
          billItemPeople.splice(index, 1);
        } else {
          billItemPeople.push(person);
        }
        bill[billItemIndex].people = billItemPeople.sort();
        return { bill };
      },
      () => {
        console.log('the bill', this.state.bill);
      },
    );
  };

  computePerUserBill = () => {
    this.setState({
      perUserBill: buildUserBill(
        this.state.people,
        this.state.bill,
        this.state.discount,
      ),
    });
  };

  areAllBillItemsAssociated() {
    if (!this.state.bill) return false;
    return this.state.bill.every(
      billItem => billItem.people && billItem.people.length,
    );
  }

  // componentDidMount() {}

  render() {
    return (
      <div className="App">
        <h1>E-food Split the bill</h1>

        <Collapse
          defaultActiveKey={['1']}
          activeKey={[this.state.activeSection.toString()]}>
          <Panel
            header={
              <span
                onClick={() =>
                  this.state.activeSection > 1 &&
                  this.setState({ activeSection: 1 })
                }>
                Input the bill you received via email - as plain text
                (copy/paste){' '}
                {this.state.activeSection > 1 ? (
                  <Icon
                    type="check-circle"
                    theme="twoTone"
                    twoToneColor="#52c41a"
                  />
                ) : null}
              </span>
            }
            showArrow={this.state.activeSection === 1}
            key="1">
            <InputForm onSubmit={this.parseTextBill} />
          </Panel>

          <Panel
            header={
              <span
                onClick={() =>
                  this.state.activeSection > 2 &&
                  this.setState({ activeSection: 2 })
                }>
                Distribute bill items between people{' '}
                {this.state.activeSection > 2 ? (
                  <Icon
                    type="check-circle"
                    theme="twoTone"
                    twoToneColor="#52c41a"
                  />
                ) : null}
              </span>
            }
            showArrow={this.state.activeSection === 2}
            key="2">
            <br />
            <br />
            <div>
              <span>
                {this.state.people.length
                  ? 'All people:'
                  : 'No people assigned yet'}
              </span>{' '}
              {this.state.people.map((name, personIndex) => (
                <Tag
                  closable
                  key={name}
                  onClick={this.removePerson.bind(this, name)}>
                  {name}
                </Tag>
              ))}
            </div>
            <br />
            <br />
            <BillList
              bill={this.state.bill}
              people={this.state.people}
              addPerson={this.addPerson}
              togglePersonToBillItem={this.togglePersonToBillItem}
            />
            <br />
            <br />
            <div>
              {this.areAllBillItemsAssociated() ? (
                <Button
                  type="primary"
                  onClick={() => {
                    this.nextSection();
                    this.computePerUserBill();
                  }}>
                  <Icon type="down" /> Next <Icon type="down" />
                </Button>
              ) : (
                <p>Note: Associate all bill items to proceed</p>
              )}
            </div>
          </Panel>

          <Panel
            header={
              <span>
                Itemized Bill{' '}
                {this.state.activeSection === 3 ? (
                  <Icon
                    type="check-circle"
                    theme="twoTone"
                    twoToneColor="#52c41a"
                  />
                ) : null}
              </span>
            }
            showArrow={this.state.activeSection === 3}
            key="3">
            <br />
            <br />
            {this.state.perUserBill &&
              Object.keys(this.state.perUserBill).map(person => (
                <p key={person}>
                  <b>{person}</b>
                  {': '}
                  <i>{this.state.perUserBill[person].items.join(' + ')}</i>
                  <span>
                    {`= ${this.state.perUserBill[person].payBeforeDiscount}`}
                  </span>
                  <span>
                    {'. '}
                    After discount
                    {': '}
                    <b>{this.state.perUserBill[person].payAfterDiscount}</b>
                  </span>
                </p>
              ))}
          </Panel>
        </Collapse>
      </div>
    );
  }
}

export default App;
