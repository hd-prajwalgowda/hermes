// React Import
import React, { Component } from "react";
import { Redirect } from "react-router-dom";
// antd imports
import {
  Layout,
  Menu,
  Icon,
  Row,
  Col,
  Button,
  Spin,
  Card,
  Modal,
  Drawer,
  Tabs,
  Select
} from "antd";
import moment from "moment";

// Socket.io imports
import io from "socket.io-client";
import { IP, KEY } from "./../config";

// Scroll to bottom import
import ScrollToBottom from "react-scroll-to-bottom";

// Emoji picker import
import { Picker } from "emoji-mart";

// Coponents imports
import Messages from "../Messages/Message";
import Request from "./Request";

// css imports
import "emoji-mart/css/emoji-mart.css";
import "./Landing.css";

// Image Import
import user_circle from "./user-circle-solid.svg";
import sign_out_alt from "./sign-out-alt-solid.svg";
import user_plus from "./user-plus-solid.svg";
import { ReactComponent as ChatImg } from "./undraw_manage_chats_ylx0 (1).svg";

// antd consts
const { Content, Sider } = Layout;
const { TabPane } = Tabs;
// antd loading icon
const antIcon = <Icon type="loading" style={{ fontSize: 64 }} spin />;
const jwt = require("jsonwebtoken");

// Emoji picker styles
const styles = {
  getEmojiButton: {
    cssFloat: "center",
    border: "none",
    margin: "0px",
    cursor: "pointer",
    width: "24px",
    height: "24px"
  },
  emojiPicker: {
    position: "absolute",
    bottom: 10,
    right: 0,
    cssFloat: "right",
    marginLeft: "200px"
  }
};

// Landing component
class Landing extends Component {
  constructor(props) {
    super(props);
    this.state = {
      uid: jwt.decode(localStorage.getItem("token")).UID,
      msg: [],
      selectedRoom: "0",
      messageField: "",
      showEmojis: false,
      userDetails: "",
      drawerVisible: false,
      modalVisible: false,
      requestData: {},
      roomsList: []
    };
    console.log(this.state);
    this.socket = io(
      `http://${IP}:4000/?token=${localStorage.getItem("token")}`
    );
    fetch(`http://${IP}:4000/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{
          userID(UID:"${jwt.decode(localStorage.getItem("token")).UID}"){
            roomsList{
              RID
              name
            }
          }
        }`
      })
    })
      .then(res => res.json())
      .then(res => {
        console.log(res.data.userID.roomsList);
        this.setState({ roomsList: res.data.userID.roomsList });
      });
  }

  componentDidMount = () => {
    this.socket.on("request", async data => {
      let reqData = data;
      console.log("data recieved", reqData);
      await this.setState({
        requestData: reqData
      });
      console.log(this.state);
    });
    this.socket.on("chat", data => {
      console.log(data);
      if (data.toID === this.state.selectedRoom) {
        this.setState({
          msg: [...this.state.msg, data]
        });
      }
    });
  };

  // handle message change
  handleChange = async value => {
    await this.setState({
      messageField: value
    });
    console.log(this.state.messageField);
  };

  // handle message submit
  handleSubmit = async () => {
    let chatMsg = {
      fromIDDetails: {
        UID: jwt.decode(localStorage.getItem("token")).UID,
        name: ""
      },
      toID: this.state.selectedRoom,
      message: `${this.state.messageField}`,
      createdAt: moment().format("YYYY/MM/DD hh:mm:ss")
    };
    await this.setState({
      msg: [...this.state.msg, chatMsg]
    });
    this.socket.emit("chat", {
      uid: jwt.decode(localStorage.getItem("token")).UID,
      toID: this.state.selectedRoom,
      message: this.state.messageField
    });
    console.log({
      uid: jwt.decode(localStorage.getItem("token")).UID,
      toID: this.state.selectedRoom,
      msg: this.state.messageField
    });
    this.setState({ messageField: "" });
  };

  // Select user change
  selectRoom = async key => {
    console.log(key.key);
    await this.setState({
      selectedRoom: `${key.key}`,
      userDetails: "@prajwalGowda",
      msg: []
    });
    let rawResponse = await fetch(`http://${IP}:4000/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{
          chats(UID:"${
            jwt.decode(localStorage.getItem("token")).UID
          }",roomID:"${this.state.selectedRoom}"){
            MID
            fromIDDetails{
              UID
              name
            }
            toID
            message
            createdAt
          }
        }`
      })
    });
    let res = await rawResponse.json();
    let chats = [];
    // console.log(res.data.chats);
    if (res.data.chats.length === 0) {
      chats.push({
        MID: "0",
        fromID: this.state.selectedRoom,
        toID: this.state.selectedRoom,
        message: "Hello from Server"
      });
      this.setState({ msg: chats });
    } else {
      // let x = [];
      // res.data.chats.map(each => {
      //   x.unshift(each);
      // });
      this.setState({ msg: res.data.chats });
    }
    // .then(response => response.json())
    // .then(json => {
    //   let chats = [];
    //   // console.log(json.data);
    //   // json.data.chats.push({
    //   //   MID: "0",
    //   //   fromID: this.state.selectedRoom,
    //   //   toID: this.state.selectedRoom,
    //   //   message: "Hello"
    //   // });
    //   if (json.data.chats === null) {
    //     chats.push({
    //       MID: "0",
    //       fromID: this.state.selectedRoom,
    //       toID: this.state.selectedRoom,
    //       message: "Hello from Server"
    //     });
    //     this.setState({ msg: chats });
    //   } else {
    //     this.setState({ msg: json.data.chats });
    //   }
    // });
  };

  // Select emoji and add it to input field
  addEmoji = e => {
    console.log(e.native);
    let emoji = e.native;
    this.setState({
      messageField: this.state.messageField + emoji
    });
  };

  // Show emoji picker
  showEmojis = e => {
    this.setState(
      {
        showEmojis: true
      },
      () => document.addEventListener("click", this.closeMenu)
    );
  };

  // Close emoji picker
  closeMenu = e => {
    console.log(this.emojiPicker);
    if (this.emojiPicker !== null && !this.emojiPicker.contains(e.target)) {
      this.setState(
        {
          showEmojis: false
        },
        () => document.removeEventListener("click", this.closeMenu)
      );
    }
  };

  // Show Drawer
  handleAccountDelete = () => {
    return <Redirect to="/" />;
  };

  // Close Drawer
  onClose = () => {
    this.setState({
      drawerVisible: false
    });
  };

  showModal = () => {
    this.setState({
      modalVisible: true
    });
  };

  handleModalCancel = e => {
    this.setState({
      modalVisible: false
    });
  };

  render() {
    return (
      <div>
        <div
          style={{
            background: "#0B132B",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <div
            className="box"
            style={{ width: "95%", height: "95vh", padding: "10px" }}
          >
            <nav
              className="navbar"
              role="navigation"
              aria-label="main navigation"
              style={{ height: "40px" }}
            >
              <div className="navbar-brand">
                {" "}
                <h1 className="title">Hermes</h1>
              </div>
              <div className="navbar-end">
                <div className="navbar-item">
                  <div className="buttons">
                    <button className="button is-white">
                      <img
                        src={sign_out_alt}
                        alt="Sign Out"
                        style={{ height: "20px", width: "20px" }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </nav>
            <hr
              style={{
                display: "block",
                borderStyle: "inset",
                borderWidth: "1px",
                margin: "5px 0px"
              }}
            />
            <Layout>
              <Sider width={150} style={{ background: "#fff" }}>
                <Menu
                  onClick={this.selectRoom}
                  style={{ width: "150px", height: "81vh" }}
                  defaultSelectedKeys={["0"]}
                  mode="inline"
                >
                  {this.state.roomsList.length > 0 ? (
                    this.state.roomsList.map((each, index) => {
                      return <Menu.Item key={each.RID}>{each.name}</Menu.Item>;
                    })
                  ) : (
                    <div>No contacts</div>
                  )}
                </Menu>
                {/* <div style={{ width: "150px", height: "81vh" }}>
                  <Select
                    style={{ width: "150px" }}
                    placeholder="Select room"
                    onChange={this.selectRoom}
                  ></Select>
                </div> */}
                <div className="navbar-start">
                  <div className="navbar-item">
                    <div className="buttons">
                      {/* <button
                        className="button is-white"
                        onClick={this.showModal}
                      >
                        <img
                          src={user_plus}
                          alt="User"
                          style={{ height: "20px", width: "20px" }}
                        />
                      </button> */}
                      <Button
                        className="button is-white"
                        onClick={this.showModal}
                        icon="user"
                      >
                        {" "}
                        Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </Sider>
              <Content>
                {this.state.selectedRoom === "0" ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "87vh"
                    }}
                  >
                    {" "}
                    <ChatImg />
                  </div>
                ) : this.state.msg.length > 0 ? (
                  <div>
                    <Row>
                      <Col span={24}>
                        <ScrollToBottom className="messages">
                          {this.state.msg.map((ms, index) => {
                            return <Messages key={index} data={ms} />;
                          })}
                        </ScrollToBottom>
                      </Col>
                    </Row>
                    <Row>
                      <Col span={24}>
                        <Row gutter={12} type="flex" justify="center">
                          <Col span={23}>
                            <input
                              placeholder="Type Somthing..."
                              value={this.state.messageField}
                              onKeyPress={event =>
                                event.key === "Enter"
                                  ? this.handleSubmit()
                                  : null
                              }
                              onChange={({ target: { value } }) =>
                                this.handleChange(value)
                              }
                              style={{
                                width: "100%",
                                height: "30px",
                                borderRadius: "10px",
                                background: "#e6e6ea",
                                border: "#000",
                                padding: "10px",
                                fontSize: "1.1em",
                                fontWeight: "normal",
                                color: "black",
                                marginLeft: "10px"
                              }}
                            />
                          </Col>
                          <Col span={1}>
                            {this.state.showEmojis ? (
                              <span
                                style={styles.emojiPicker}
                                ref={el => (this.emojiPicker = el)}
                              >
                                <Picker
                                  onSelect={this.addEmoji}
                                  emojiTooltip={true}
                                  title="Hermes"
                                />
                              </span>
                            ) : (
                              <p
                                style={styles.getEmojiButton}
                                onClick={this.showEmojis}
                              >
                                {String.fromCodePoint(0x1f60a)}
                              </p>
                            )}
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center"
                    }}
                  >
                    <Spin
                      size="large"
                      style={{ height: "95vh" }}
                      indicator={antIcon}
                    />
                  </div>
                )}
              </Content>
            </Layout>
          </div>
        </div>
        <Modal
          title="Profile"
          visible={this.state.modalVisible}
          onCancel={this.handleModalCancel}
          footer={null}
          width="70%"
        >
          <Request
          // sock={this.socket}
          // requests={this.state.requestData}
          // uid={this.state.uid}
          />
        </Modal>
      </div>
    );
  }
}

export default Landing;
