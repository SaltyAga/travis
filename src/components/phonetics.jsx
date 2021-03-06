import React, { Component } from 'react';
import axios from 'axios';
import { Container, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Input, Form } from 'reactstrap';
import { MdSwapHoriz, MdFlag } from "react-icons/md";
import Keyboard from './Keyboard';
import data from '../keyboardObj';

export default class Phonetics extends Component {
  constructor(props) {
    super(props);
    this.state = {
      keyboard: [],
      dict: {},
      queue: '',
      finalizedSymbols: '',
      display: '',
      translation: '',
      improvedTranslation: '',
      TigrinyaToEnglish: true,
      improveTranslation: false,
      readOnlyDisplay: false,
      keyboardSet: 0,
      shift: false,
      show: true,
      target: null,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg2Mzg0NDFiLWYzYTgtNDIyNC05ZmRiLWI2YWMxYzdmMmI5OSIsImVtYWlsIjoiaGVsbG9AdHJhdmlzLmZvdW5kYXRpb24iLCJmdWxsX25hbWUiOiJUcmF2aXMgRm91bmRhdGlvbiIsInJvbGUiOiJhcGktY2xpZW50IiwiaWF0IjoxNTUxMzA2MjMzLCJuYmYiOjE1NTEzMDYxNzMsImV4cCI6MTU4Mjg2MzgzMywiaXNzIjoiaHR0cDovL3RyYXZpcy5mb3VuZGF0aW9uIiwic3ViIjoiaGVsbG9AdHJhdmlzLmZvdW5kYXRpb24iLCJqdGkiOiJ0cmF2aXMtZm91bmRhdGlvbi10cmFuc2xhdGlvbi1hcGkifQ.TUjINnAwQAC3LOVTZOti1IoGf9Wi730e2jFEqdOxkkQ'
    }
    this.improveTranslation = this.improveTranslation.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.switchTranslations = this.switchTranslations.bind(this);
    this.englishInput = this.englishInput.bind(this);
    this.translate = this.translate.bind(this);
    this.handlePaste = this.handlePaste.bind(this);
    this.tigrinyaToEnglish = this.tigrinyaToEnglish.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleClickTgr = this.handleClickTgr.bind(this);
  };

  componentDidMount() {
    const { token } = this.state;

    if (data) {
      this.setState({
        keyboard: data.keyData
      });
    };

    const config = {
      headers: { 'Authorization': `bearer ${token}` }
    }
    axios.get('http://localhost:8080/api/lang', config)
      .then(response => this.setState({ dict: response.data }));
  };

  componentDidUpdate(prevProps, prevState) {
    const { display } = this.state;
    if (prevState.display !== display) {
      this.translate();
    }
  }

  tigrinyaToEnglish(e) {

    if (e.nativeEvent.inputType === "insertFromPaste") return;

    const { finalizedSymbols, queue, dict } = this.state;

    // Letters which end a symbol
    const stoppers = /(([^KkghQq]u)|[aeoAW])$/;

    // e.nativeEvent.data corresponds to the latest
    // chacter entered by the user
    const updatedQueue = queue.concat(e.nativeEvent.data);

    if (/[^a-zNKQHPCTZOKS2]/.test(e.nativeEvent.data)) {

      if (queue !== '') {

        const newFinalizedSymbols = finalizedSymbols
          .concat(dict[queue]).concat(e.nativeEvent.data);
        this.setState({
          finalizedSymbols: newFinalizedSymbols,
          [e.currentTarget.name]: newFinalizedSymbols, queue: ''
        })
      } else {
        this.setState({
          finalizedSymbols: e.target.value,
          [e.currentTarget.name]: e.target.value
        })
      }
    }
    else if (e.nativeEvent.inputType === "deleteContentBackward" ||
      e.nativeEvent.inputType === "insertLineBreak") {
      this.setState({
        [e.currentTarget.name]: e.target.value,
        finalizedSymbols: e.target.value,
        queue: ''
      })
    }
    // If, after inputing the newest letter, the queue has no match in the dictionary we return the last valid symbol
    // and begin a new queue with the new letter
    else if (typeof dict[updatedQueue] === "undefined") {
      this.setState({
        queue: e.nativeEvent.data, finalizedSymbols: finalizedSymbols.concat(dict[queue]),
        [e.currentTarget.name]: finalizedSymbols.concat(dict[queue].concat(dict[e.nativeEvent.data]))
      })
    }
    else if (stoppers.test(queue.concat(e.nativeEvent.data))) {

      const finalSymbol = dict[updatedQueue];

      this.setState({
        queue: '', finalizedSymbols: finalizedSymbols.concat(finalSymbol),
        [e.currentTarget.name]: finalizedSymbols.concat(finalSymbol)
      })
    }
    else if (updatedQueue.length === 1 || updatedQueue.length === 2
      || updatedQueue.length === 3) {
      this.setState({
        [e.currentTarget.name]: finalizedSymbols.concat(dict[updatedQueue]),
        queue: updatedQueue
      })
    }
  }

  async translate() {
    const { display, token, TigrinyaToEnglish } = this.state;
    const config = {
      headers: { 'Authorization': `bearer ${token}` }
    }

    const sourceLang = TigrinyaToEnglish ? "ti" : "en";
    const targetLang = TigrinyaToEnglish ? "en" : "ti";

    const response = await axios.post('http://localhost:8080/api/translate', {
      "source_lang": sourceLang,
      "target_lang": targetLang,
      "phrase": display
    }, config)

    const { translations } = await response.data;
    this.setState({ translation: translations[0].text.slice(0, -2) })
  }


  englishInput(e) {
    this.setState({ [e.target.name]: e.target.value });
  };

  improveTranslation() {
    const { improveTranslation, translation } = this.state;
    this.setState({
      improveTranslation: !improveTranslation,
      improvedTranslation: translation,
      finalizedSymbols: translation, readOnlyDisplay: true
    });
  }

  handleSubmit(e) {
    const { token } = this.state;
    e.preventDefault();
    const config = {
      headers: { 'Authorization': `bearer ${token}` }
    }
    const { display, translation, improvedTranslation } = this.state;
    axios.post('http://localhost:8080/api/report', {
      original: display,
      translation,
      improved: improvedTranslation
    }, config).then(
      this.setState({
        display: '', readOnlyDisplay: false, queue: '',
        translation: '', improvedTranslation: '',
        finalizedSymbols: '', improveTranslation: false
      })
    );
  }

  switchTranslations() {
    const { TigrinyaToEnglish } = this.state;
    this.setState({
      finalizedSymbols: '', TigrinyaToEnglish: !TigrinyaToEnglish,
      display: '', queue: '', translation: '', improvedTranslation: '',
      improveTranslation: false, readOnlyDisplay: false
    })
  }

  handleClick(e) {
    const { improveTranslation, shift } = this.state;
    if (typeof e.target.value !== 'undefined') {
      this.setState({
        show: false,
        queue: ''
      });

      const targetState = improveTranslation === false ? "display" : "improvedTranslation";
      const targetField = improveTranslation === false ? "input-field" : "correctionField";
      if (e.target.value.match(/^.{1}$/)) {
        this.setState({
          [targetState]: document.getElementById(targetField).value + e.target.value,
          finalizedSymbols: document.getElementById(targetField).value + e.target.value
        })
      } else if (e.target.value === "Clear") {
        this.setState({
          [targetState]: document.getElementById(targetField).value.slice(0, document.getElementById(targetField).value.length - 1),
          finalizedSymbols: document.getElementById(targetField).value.slice(0, document.getElementById(targetField).value.length - 1)
        })
      } else if (e.target.value === "123.,") {
        this.setState({
          keyboardSet: 1,
          [targetState]: document.getElementById(targetField).value
        })
      } else if (e.target.value === "#+=") {
        this.setState({
          keyboardSet: 2,
          [targetState]: document.getElementById(targetField).value
        })
      } else if (e.target.value === "abc") {
        this.setState({
          keyboardSet: 0,
          [targetState]: document.getElementById(targetField).value
        })
      } else if (e.target.value === "Shift") {
        this.setState({
          shift: shift === false,
          [targetState]: document.getElementById(targetField).value
        })
      } else if (e.target.value === "space") {
        this.setState({
          [targetState]: `${document.getElementById(targetField).value} `,
          finalizedSymbols: `${document.getElementById(targetField).value} `,
          queue: ''
        })
      } else if (e.target.value === "return") {
        this.setState({
          [targetState]: `${document.getElementById(targetField).value} \n`,
          finalizedSymbols: `${document.getElementById(targetField).value} \n`,
        })
      }
    };
  };

  handleClickTgr(e) {
    if (typeof e.target.value !== 'undefined') {
      if (e.target.value.match(/^.{1}$/)) {
        this.setState({
          queue: '',
          show: true,
          target: e.target.value
        })
      } else {
        this.handleClick(e);
      }
    };
  }

  handlePaste(e) {
    const { display } = this.state;
    this.setState({
      display: display.concat(e.clipboardData.getData('text')),
      finalizedSymbols: display.concat(e.clipboardData.getData('text')),
      queue: ''
    })
  }

  render() {

    const { display, readOnlyDisplay, translation, TigrinyaToEnglish, improveTranslation, improvedTranslation } = this.state;
    return (
      <Container>
        <Button color="secondary" size="sm" style={{ width: '70px', marginBottom: '5px' }} onClick={this.switchTranslations}><MdSwapHoriz /></Button>
        {TigrinyaToEnglish ?
          <Container style={{ margin: '0' }}>
            <p>Tigrinya to English</p>
            <Row>

              <Col xs={12} md={6}>

                <div>
                  <textarea type='text' id="input-field" className="input-field" name="display" value={display}
                    onChange={this.tigrinyaToEnglish}
                    onPaste={this.handlePaste}
                    readOnly={readOnlyDisplay}
                  />

                </div>
              </Col>

              <Col xs={12} md={6}>
                <div>
                  <textarea type="text" style={{ backgroundColor: 'white' }} id="output-field"
                    className="input-field" value={translation} readOnly />
                </div>
                <div>
                  {improveTranslation ?
                    <Form onSubmit={this.handleSubmit}>
                      <Row>
                        <Col xs={7} md={10}>
                          <Input type='text' name="improvedTranslation" id="correctionField"
                            placeholder="Type your corrections here..." value={improvedTranslation}
                            onChange={this.englishInput} />
                        </Col>
                        <Col xs={1} md={2}>
                          <Button type="submit">Submit</Button>
                        </Col>
                        <div>
                          <h6 style={{ marginTop: '20px' }}>The Sentence Society</h6>
                          <p style={{ fontSize: '14px' }}>By playing this game, you&apos;re helping us digitise Tigrinya and and helping your fellow Tigrinya speakers all over the world.</p>
                          <a href="https://www.thesentencesociety.org/index.html" id="game_button" color="secondary">PLAY GAME</a>
                        </div>
                      </Row>
                    </Form>
                    : <Button type="button" size="sm" onClick={this.improveTranslation}><MdFlag /> Improve translation</Button>}
                </div>
              </Col>
            </Row>
          </Container> :
          <Container style={{ margin: '0' }}>
            <p>English to Tigrinya</p>
            <Row>
              <Col xs={12} md={6}>

                <div>
                  <textarea type='text' name="display" className="input-field"
                    id="input-field" value={display}
                    onChange={this.englishInput} />
                </div>
              </Col>

              <Col xs={12} md={6}>
                <div>
                  <textarea type="text" className="input-field" style={{ backgroundColor: 'white' }} id="output-field" value={translation} disabled />
                </div>
                <div>
                  {improveTranslation ?
                    <Form onSubmit={this.handleSubmit}>
                      <Row>
                        <Col xs={7} md={10}>

                          <Input type='text' id="correctionField" placeholder="Type your corrections here..." value={improvedTranslation} name="improvedTranslation" onChange={this.tigrinyaToEnglish} />


                        </Col>
                        <Col xs={1} md={2}>
                          <Button type="submit">Submit</Button>
                        </Col>
                        <div>
                          <h6 style={{ marginTop: '20px' }}>The Sentence Society</h6>
                          <p style={{ fontSize: '14px' }}>By playing this game, you&apos;re helping us digitise Tigrinya and and helping your fellow Tigrinya speakers all over the world.</p>
                          <a href="https://www.thesentencesociety.org/index.html" id="game_button" color="secondary">PLAY GAME</a>
                        </div>
                      </Row>
                    </Form>
                    : <Button type="button" size="sm" onClick={this.improveTranslation}><MdFlag /> Improve translation</Button>}
                </div>
              </Col>
            </Row>
          </Container>}

        <Keyboard keyboard={this.state.keyboard}
          handleClick={this.handleClick}
          keyboardSet={this.state.keyboardSet}
          shift={this.state.shift}
          keyLang={this.state.keyLang}
          handleClickTgr={this.handleClickTgr}
          show={this.state.show}
          target={this.state.target} />

      </Container>

    );
  };
};
