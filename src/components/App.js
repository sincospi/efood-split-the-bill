import React from 'react';
import { Button, Icon, Collapse, Tag } from 'antd';

import InputForm from './InputForm';
import BillList from './BillList';
import buildBill, { buildUserPay } from '../lib/buildBill';

const Panel = Collapse.Panel;

class App extends React.Component {
  constructor(props) {
    super(props);
    const people = window.localStorage.getItem('people');
    this.state = {
      activeSection: 1,
      bill: [],
      parseChecksum: null,
      computedBillTotal: null,
      discount: null,
      people: people ? people.split(',').sort() : [],
      userPay: [],
      payChecksum: null,
    };
  }

  prevSection = () => {
    this.setState(({ activeSection }) => ({
      activeSection: activeSection - 1,
    }));
  };

  setPersonAssignmentToLocalStorage = () => {
    const personAssignment = this.state.bill.map(billItem => billItem.people);
    console.debug('person to bill assignment', personAssignment);
    window.localStorage.setItem('personAssignment', JSON.stringify(personAssignment));
  };

  getPersonAssignmentFromLocalStorage = () => {
    let personAssignment = window.localStorage.getItem('personAssignment');
    if (personAssignment) {
      personAssignment = JSON.parse(personAssignment);
      this.setState(({ bill }) => {
        bill.forEach((billItem, billItemIndex) => {
          billItem.people = personAssignment[billItemIndex];
        });
        return ({ bill });
      });
    }
  };

  nextSection = () => {
    this.setState(({ activeSection }) => ({
      activeSection: activeSection + 1,
    }), () => {
      if (this.state.activeSection === 2 && this.state.people.length) {
        this.getPersonAssignmentFromLocalStorage();
      }
    });
  };

  parseTextBill = textBill => {
    if (textBill) {
      const {
        bill,
        discount,
        computedBillTotal,
        parseChecksum,
      } = buildBill(textBill);
      if (bill.length) {
        this.setState(
          () => ({
            bill,
            discount,
            computedBillTotal,
            parseChecksum,
          }),
          () => this.nextSection(),
        );
      } else {
        console.error('Parsing error');
      }
    } else {
      console.error('No text bill');
    }
  };

  addPerson = name => {
    if (!this.state.people.includes(name)) {
      this.setState(
        ({ people }) => ({ people: [...people, name].sort() }),
        () => {
          console.debug('people', this.state.people);
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
        console.debug('people', this.state.people);
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
        this.setPersonAssignmentToLocalStorage();
      },
    );
  };

  computeUserPay = () => {
    const { userPay, payChecksum } = buildUserPay(
      this.state.people,
      this.state.bill,
      this.state.discount,
      this.state.computedBillTotal,
    );
    this.setState({
      userPay,
      payChecksum,
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
                    this.computeUserPay();
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
            {this.state.userPay.map(userPayItem => (
                <p key={userPayItem.user}>
                  <b>{userPayItem.user}</b>
                  {': '}
                  <i>{userPayItem.info}</i>
                  <b>
                    {` = ${userPayItem.payStr}`}
                  </b>
                </p>
              ))}
          </Panel>
        </Collapse>
      </div>
    );
  }
}

export default App;
