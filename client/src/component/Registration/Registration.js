// Node modules
import React, { Component } from "react";

// Components
import Navbar from "../Navbar/Navigation";
import NavbarAdmin from "../Navbar/NavigationAdmin";
import NotInit from "../NotInit";
import { NotificationManager, NotificationContainer} from "react-notifications";
// CSS
import "./Registration.css";
import 'react-notifications/lib/notifications.css';
// Contract
import getWeb3 from "../../getWeb3";
import Election from "../../contracts/Election.json";

export default class Registration extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ElectionInstance: undefined,
      web3: null,
      account: null,
      isAdmin: false,
      isElStarted: false,
      isElEnded: false,
      voterCount: undefined,
      voterName: "",
      voterPhone: "",
      voterAadhar: "",
      voters: [],
      currentVoter: {
        address: undefined,
        name: null,
        phone: null,
        aadhar: null,
        hasVoted: false,
        isVerified: false,
        isRegistered: false,
      },
    };
    this.handleReload = this.handleReload.bind(this);
  }

  // refreshing once
  componentDidMount = async () => {
    if (!window.location.hash) {
      window.location = window.location + "#loaded";
      window.location.reload();
    }
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];
      const instance = new web3.eth.Contract(
        Election.abi,
        deployedNetwork && deployedNetwork.address
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({
        web3: web3,
        ElectionInstance: instance,
        account: accounts[0],
      });

      // Admin account and verification
      const admin = await this.state.ElectionInstance.methods.getAdmin().call();
      if (this.state.account === admin) {
        this.setState({ isAdmin: true });
      }

      // Get start and end values
      const start = await this.state.ElectionInstance.methods.getStart().call();
      this.setState({ isElStarted: start });
      const end = await this.state.ElectionInstance.methods.getEnd().call();
      this.setState({ isElEnded: end });

      this.handleReload();
    } catch (error) {
      // Catch any errors for any of the above operations.
      console.error(error);
      NotificationManager.error("Failed to load web3, accounts, or contract. Check console for details.","error",10000);
    }
  };
  handleReload = async ()=>{
    // Total number of voters
    const voterCount = await this.state.ElectionInstance.methods
    .getTotalVoter()
    .call();
  this.setState({ voterCount: voterCount });

  // Loading all the voters
  for (let i = 0; i < this.state.voterCount; i++) {
    const voterAddress = await this.state.ElectionInstance.methods
      .voters(i)
      .call();
    const voter = await this.state.ElectionInstance.methods
      .voterDetails(voterAddress)
      .call();
    this.state.voters.push({
      address: voter.voterAddress,
      name: voter.name,
      phone: voter.phone,
      aadhar: voter.aadhar,
      hasVoted: voter.hasVoted,
      isVerified: voter.isVerified,
      isRegistered: voter.isRegistered,
    });
  }
  this.setState({ voters: this.state.voters });

  // Loading current voters
  const voter = await this.state.ElectionInstance.methods
    .voterDetails(this.state.account)
    .call();
  
  this.setState({
    currentVoter: {
      address: voter.voterAddress,
      name: voter.name,
      phone: voter.phone,
      aadhar: voter.aadhar,
      hasVoted: voter.hasVoted,
      isVerified: voter.isVerified,
      isRegistered: voter.isRegistered,
    },
  });
  }
  updateVoterName = (event) => {
    this.setState({ voterName: event.target.value });
  };
  updateVoterPhone = (event) => {
    this.setState({ voterPhone: event.target.value });
  };
  updateVoterAadhar = (event) => {
    this.setState({ voterAadhar: event.target.value });
  };
  // registerAsVoter = async () => {
  //   await this.state.ElectionInstance.methods
  //     .registerAsVoter(this.state.voterName, this.state.voterPhone, this.state.voterAadhar)
  //     .send({ from: this.state.account, gas: 1000000 });
  //   window.location.reload();
  // };
  registerAsVoter = async (e) => {
    // Check if the Aadhar card number is already registered
    e.preventDefault();
    const isAadharRegistered = await this.state.ElectionInstance.methods
        .isAadharRegistered(this.state.voterAadhar)
        .call();

    if (isAadharRegistered) {
      NotificationManager.error("Aadhar card number is already registered.","Alert", 5000);
        return;
    }
    

    // Proceed with registration if the Aadhar card number is not registered
    await this.state.ElectionInstance.methods
        .registerAsVoter(this.state.voterName, this.state.voterPhone, this.state.voterAadhar)
        .send({ from: this.state.account, gas: 1000000 });
        
        if(this.state.currentVoter.isRegistered){
          NotificationManager.success("Voter Detail Updated", "Updated", 5000);
        }else {
          NotificationManager.success("Voter Detail Added", "Register", 5000);
        }
        this.handleReload();
    
};
  render() {
    if (!this.state.web3) {
      return (
        <>
          {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
          <center>Loading Web3, accounts, and contract...</center>
          <NotificationContainer/>
        </>
      );
    }
    return (
      <>
        {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
        {!this.state.isElStarted && !this.state.isElEnded ? (
          <NotInit />
        ) : (
          <>
            <div className="container-item info">
              <p>Total Verified voters: {this.state.voterCount}</p>
            </div>
            {!this.state.currentVoter.isVerified &&(
            <div className="container-main">
              <h3>Registration</h3>
              <small>Register to vote.</small>
              <div className="container-item">
                <form>
                  <div className="div-li">
                    <label className={"label-r"}>
                      Account Address
                      <input
                        className={"input-r"}
                        type="text"
                        value={this.state.account}
                        style={{ width: "400px" }}
                      />{" "}
                    </label>
                  </div>
                  <div className="div-li">
                    <label className={"label-r"}>
                      Name
                      <input
                        className={"input-r"}
                        type="text"
                        placeholder="eg. Ava"
                        value={this.state.voterName}
                        onChange={this.updateVoterName}
                      />{" "}
                    </label>
                  </div>
                  <div className="div-li">
                    <label className={"label-r"}>
                      Phone number <span style={{ color: "tomato" }}>*</span>
                      <input
                        className={`input-r ${this.state.voterPhone.length !== 10 ? 'error' : ''}`}
                        type="number"
                        placeholder="eg. 9841234567"
                        value={this.state.voterPhone}
                        onChange={this.updateVoterPhone}
                      />
                      {this.state.voterPhone.length !== 10 && (
                        <span className="error-message">Phone number must be 10 digits</span>
                      )}
                    </label>
                  </div>
                  <div className="div-li">
                    <label className={"label-r"}>
                      AadharCard No. <span style={{ color: "tomato" }}>*</span>
                      <input
                        className={`input-r ${this.state.voterAadhar.length !== 16 ? 'error' : ''}`}
                        type="number"
                        placeholder="eg. 1234567890123456"
                        value={this.state.voterAadhar}
                        onChange={this.updateVoterAadhar}
                      />
                      {this.state.voterAadhar.length !== 16 && (
                        <span className="error-message">Aadhar card number must be 16 digits</span>
                      )}
                    </label>
                  </div>
                  <p className="note">
                    <span style={{ color: "tomato" }}> Note: </span>
                    <br /> Make sure your account address and Phone number are
                    correct. <br /> Admin might not approve your account if the
                    provided Phone number nub does not matches the account
                    address registered in admins catalogue.
                  </p>
                  <button
                    className="btn-add"
                    disabled={
                      this.state.voterPhone.length !== 10 ||
                      this.state.voterAadhar.length !== 16 ||
                      this.state.currentVoter.isVerified
                    }
                    onClick={this.registerAsVoter}
                  >
                    {this.state.currentVoter.isRegistered
                      ? "Update"
                      : "Register"}
                  </button>
                </form>
              </div>
            </div>)}
            <div
              className="container-main"
              style={{
                borderTop: this.state.currentVoter.isRegistered
                  ? null
                  : "1px solid",
              }}
            >
              {loadCurrentVoter(
                this.state.currentVoter,
                this.state.currentVoter.isRegistered
              )}
            </div>
            {this.state.isAdmin ? (
              <div
                className="container-main"
                style={{ borderTop: "1px solid" }}
              >
                <small>TotalVoters: {this.state.voters.length}</small>
                {loadAllVoters(this.state.voters)}
              </div>
            ) : null}
          </>
        )}
        
        <NotificationContainer/>
      </>
    );
  }
}
export function loadCurrentVoter(voter, isRegistered) {
  return (
    <>
      <div
        className={"container-item " + (isRegistered ? "success" : "attention")}
      >
        <center>Your Registered Info</center>
      </div>
      <div
        className={"container-list " + (isRegistered ? "success" : "attention")}
      >
        <table>
          <tr>
            <th>Account Address</th>
            <td>{voter.address}</td>
          </tr>
          <tr>
            <th>Name</th>
            <td>{voter.name}</td>
          </tr>
          <tr>
            <th>Phone</th>
            <td>{voter.phone}</td>
          </tr>
          <tr>
            <th>AadharCard No.</th>
            <td>{voter.aadhar}</td>
          </tr>
          <tr>
            <th>Voted</th>
            <td>{voter.hasVoted ? "True" : "False"}</td>
          </tr>
          <tr>
            <th>Verification</th>
            <td>{voter.isVerified ? "True" : "False"}</td>
          </tr>
          <tr>
            <th>Registered</th>
            <td>{voter.isRegistered ? "True" : "False"}</td>
          </tr>
        </table>
      </div>
    </>
  );
}
export function loadAllVoters(voters) {
  const renderAllVoters = (voter) => {
    return (
      <>
        <div className="container-list success">
          <table>
            <tr>
              <th>Account address</th>
              <td>{voter.address}</td>
            </tr>
            <tr>
              <th>Name</th>
              <td>{voter.name}</td>
            </tr>
            <tr>
              <th>Phone</th>
              <td>{voter.phone}</td>
            </tr>
            <tr>
              <th>AadharCard No.</th>
              <td>{voter.aadhar}</td>
            </tr>
            <tr>
              <th>Voted</th>
              <td>{voter.hasVoted ? "True" : "False"}</td>
            </tr>
            <tr>
              <th>Verified</th>
              <td>{voter.isVerified ? "True" : "False"}</td>
            </tr>
            <tr>
              <th>Registered</th>
              <td>{voter.isRegistered ? "True" : "False"}</td>
            </tr>
          </table>
        </div>
      </>
    );
  };
  return (
    <>
      <div className="container-item success">
        <center>List of voters</center>
      </div>
      {voters.map(renderAllVoters)}
    </>
  );
}
