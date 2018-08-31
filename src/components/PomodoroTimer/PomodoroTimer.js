import React from 'react';
import styles from './PomodoroTimer.css';
import 'font-awesome/css/font-awesome.css';
import './font.css';
import {Howl} from 'howler';
import {Power1, TweenMax} from 'gsap';
import {Drawer, Radio} from 'antd';

import {library} from '@fortawesome/fontawesome-svg-core';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCog, faVolumeOff, faVolumeUp} from '@fortawesome/free-solid-svg-icons';
import Responsive from 'react-responsive';

library.add(faVolumeUp, faVolumeOff, faCog);
const RadioGroup = Radio.Group;
const Mobile = props => <Responsive {...props} maxWidth={499} />;
const Default = props => <Responsive {...props} minWidth={500} />;

class PomodoroTimer extends React.Component {

  static defaultProps = {
    pixelWidth: 630,
    secondsWidth: 25,
    timeMultiplier: 1000 * 60,
    turnSoundDist: 25 / 2,
    tickSounds: [
      new Howl({src: ['./sound/tick/timer.mp3'], loop: true, volume: 0.5}),
      new Howl({src: ['./sound/tick/clock.mp3'], loop: true, volume: 0.5}),
    ],
    restSounds: [
      new Howl({src: ['./sound/rest/rest.mp3'], loop: true, volume: 0.8})
    ],
    turnSounds: [
      new Howl({src: ['./sound/pomodoro_turn.mp3'], volume: 1.0}),
    ],
    ringSounds: [
      new Howl({src: ['./sound/pomodoro_ring.mp3'], volume: 1.0}),
    ],
  };

  state = {
    isDragging: false,
    oldPosX: 0,
    pixelPos: 0,
    timePos: 0,
    isTickPlaying: false,
    lastTurnPos: 0,
    lastTick: Date.now(),
    isMute: false,
    showDrawer: false,
    fileList: [],
    isRest: false,
    tickSound: this.props.tickSounds[0],
    ringSound: this.props.ringSounds[0],
    turnSound: this.props.turnSounds[0],
    touchPageX: 0
  };

  tomatoMouseDown = (e) => {
    e.preventDefault();
    this.setState({isDragging: true})
  };

  renderTimerStyle = () => {
    return {
      'transform': `translateX(-${this.state.pixelPos}px)`
    }
  };

  handleMove(pageX) {
    const {secondsWidth, pixelWidth, timeMultiplier, turnSoundDist} = this.props;
    const {turnSound} = this.state;
    let {lastTurnPos, pixelPos, timePos, oldPosX} = this.state;


    if (this.state.isDragging) {
      let moveX = pageX - oldPosX;
      pixelPos -= moveX;
      pixelPos = Math.max(0, Math.min(pixelPos, pixelWidth));
      timePos = Math.ceil((pixelPos / pixelWidth) * (secondsWidth * timeMultiplier));

      if (moveX > 0) {
        lastTurnPos = pageX;
      }

      if (pageX - lastTurnPos < -turnSoundDist) {
        if (pixelPos < pixelWidth) {
          turnSound.play();
        }
        lastTurnPos = pageX;
      }
    } else {
      lastTurnPos = pageX;
    }
    oldPosX = pageX;

    this.setState({timePos, pixelPos, lastTurnPos, oldPosX});

  }

  onContainerMouseMove = (e) => {
    e.preventDefault();
    this.handleMove.bind(this)(e.pageX)
  };

  onContainerMouseUp = (e) => {
    e.preventDefault();
    this.setState({isDragging: false})
  };

  doTick = () => {

    const {secondsWidth, timeMultiplier, pixelWidth} = this.props;
    const {tickSound, ringSound} = this.state;
    let {lastTick, isDragging, timePos, isTickPlaying, pixelPos} = this.state;

    setTimeout(this.doTick, 10); //setTimeout so the timer will continue running even if in the background
    let tickDuration = Date.now() - lastTick;
    lastTick = Date.now();
    if (isDragging || timePos <= 0) {
      if (isTickPlaying) {
        tickSound.stop();
        this.setState({isTickPlaying: false, lastTick})
      }
      return;
    }
    if (!isTickPlaying) {
      tickSound.play();
      isTickPlaying = true
    }
    timePos -= tickDuration;
    timePos = Math.max(0, Math.min(timePos, secondsWidth * timeMultiplier));
    pixelPos = timePos / secondsWidth * pixelWidth / timeMultiplier;
    if (timePos === 0) {
      this.wiggle(this.mainRef.current);
      ringSound.stop().play();
    }
    this.setState({lastTick, isDragging, timePos, isTickPlaying, pixelPos})
  };

  wiggle = element => {

    /**************
     Rotation
     **************/
    TweenMax.fromTo(element, .07, {
      x: -4
    }, {
      x: 4,
      ease: Power1.easeInOut,
      yoyo: true,
      repeat: 21,
      onCompleteParams: [element],
      onComplete: this.resetWiggle
    });
  };

  resetWiggle = element => {
    TweenMax.to(element, .05, {
      x: 0,
      ease: Power1.easeInOut
    });
  };

  componentDidMount = () => {
    this.mainRef = React.createRef();
    this.doTick();
  };

  getIconName(){
    if (this.state.isMute) {
      return 'volume-off'
    }
    return 'volume-up'
  }

  muteOrOpen(){
    const {tickSound} = this.state;

    if (this.state.isMute) {
      tickSound.volume(0.5);
      this.setState({isMute: false})
    } else {
      tickSound.volume(0.0);
      this.setState({isMute: true})
    }

  }

  showDrawer() {
    this.setState({showDrawer: true})
  }

  onDrawerOpenChange() {
    console.log('--->', this.state.showDrawer);
    this.setState({showDrawer: !this.state.showDrawer})
  }

  onVolumeChange(volume){
    const {tickSound} = this.state;
    tickSound.volume(volume/100);
  }

  getOnTickSoundChange(e) {
    const value = e.target.value;
    const {tickSounds} = this.props;
    let {tickSound, isTickPlaying} = this.state;
    if (isTickPlaying) {
      tickSound.stop();
      tickSound = tickSounds[value];
      tickSound.play();
    } else {
      tickSound = tickSounds[value];
      tickSound.play();
      setInterval(()=>{
        tickSound.stop();
      }, 2100)
    }
    this.setState({tickSound});
  }

  shiftWork() {

    const {isTickPlaying, tickSound} = this.state;

    if (isTickPlaying) {
      tickSound.stop();
    }

    this.setState({
      isRest: false,
      tickSound: this.props.tickSounds[0],
      isDragging: false,
      oldPosX: 0,
      pixelPos: 0,
      timePos: 0,
      isTickPlaying: false,
      lastTurnPos: 0,
      lastTick: Date.now(),
    })

  }

  shiftRest() {

    const {isTickPlaying, tickSound} = this.state;

    if (isTickPlaying) {
      tickSound.stop();
    }

    this.setState({
      isRest: true,
      tickSound: this.props.restSounds[0],
      isDragging: false,
      oldPosX: 0,
      pixelPos: 0,
      timePos: 0,
      isTickPlaying: false,
      lastTurnPos: 0,
      lastTick: Date.now(),
    });
  }

  static handlePreventDefault(event) {
    // 判断默认行为是否可以被禁用
    if (event.cancelable) {
      // 判断默认行为是否已经被禁用
      if (!event.defaultPrevented) {
        event.preventDefault();
      }
    }
  }

  onTouchStart(e) {
    PomodoroTimer.handlePreventDefault(e);
    const pageX = e.touches[0].pageX;
    this.setState({
      isDragging: true,
      oldPosX: pageX,
      lastTurnPos: pageX,
    });
  }

  onTouchMove(e) {
    PomodoroTimer.handlePreventDefault(e);
    const pageX = e.touches[0].pageX;
    this.handleMove.bind(this)(pageX);
  }

  onTouchEnd(e) {
    PomodoroTimer.handlePreventDefault(e);
    this.setState({isDragging: false});
  }

  render() {

    const {tickSound} = this.state;

    const marks = {
      0: '0',
      50: '50',
      100: '100'
    };

    return (
      <div className={styles.container}
           onMouseMove={this.onContainerMouseMove.bind(this)}
           onMouseUp={this.onContainerMouseUp.bind(this)}
           onTouchMove={this.onTouchMove.bind(this)}
           onTouchEnd={this.onTouchEnd.bind(this)}
      >

        <FontAwesomeIcon className={styles.sound} icon="cog"
                         onClick={this.onDrawerOpenChange.bind(this)}
                         onTouchStart={this.onDrawerOpenChange.bind(this)}/>

        <Drawer
          title="设置"
          placement="left"
          closable={false}
          onClose={this.onDrawerOpenChange.bind(this)}
          visible={this.state.showDrawer}
        >
          {/*<Collapse>*/}
            {/*<Panel header="音量控制" key="1">*/}
              {/*<Slider marks={marks} value={tickSound.volume()*100} onChange={this.onVolumeChange.bind(this)}/>*/}
            {/*</Panel>*/}
            {/*<Panel header="声音：滴答声" key="2">*/}
              {/*<RadioGroup onChange={this.getOnTickSoundChange.bind(this)} defaultValue={0}>*/}
                {/*<Radio value={0}>计时器</Radio>*/}
                {/*<Radio value={1}>钟表（感谢叶开提供）</Radio>*/}
              {/*</RadioGroup>*/}
            {/*</Panel>*/}
          {/*</Collapse>*/}
          点击

        </Drawer>

        <svg style={{'display': 'none'}}>
          <defs>
            <path id="stempath"
                  d="M45.263 56.325c-4.153 2.877-8.688 3.997-13.684 2.947-6.75-1.42-12.658-.133-17.343 5.274-.444.513-1.154.795-1.945.841 8.279-12.713 19.369-20.347 35.181-19.185-1.142-4.912-2.697-9.386-8.229-10.989 8.393-2.329 14.908.648 20.39 6.482 4.967-3.077 7.65-6.526 12.7-16.222 2.45 6.292 1.399 11.899-3.969 20.682 3.378 1.556 6.882 2.05 10.168.448 3.099-1.51 5.857-3.72 9.176-5.891-1.793 6.643-5.919 10.74-11.471 13.709-5.747 3.074-11.571 1.879-16.764.42l-9.355 19.685c-4.165-4.978-4.672-11.17-4.276-17.6l.219-.991-.798.39z"/>
          </defs>
        </svg>

        <div className={this.state.isRest ? styles.rest_main : styles.main } ref={this.mainRef}>
          <FontAwesomeIcon className={styles.sound} icon={this.getIconName()}
                           onClick={this.muteOrOpen.bind(this)} onTouchStart={this.muteOrOpen.bind(this)}/>
          <svg className={styles.stem} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <use xlinkHref="#stempath"/>
          </svg>
          <div className={styles.tomato} onMouseDown={this.tomatoMouseDown.bind(this)} onTouchStart={this.onTouchStart.bind(this)}>
            <div className={styles.title}>番茄钟
              <div>
                <Mobile>Mobile</Mobile>
                <Default>Not mobile</Default>
              </div>
            </div>
            <div style={this.renderTimerStyle()} className={styles.timeline} />
          </div>
          <div className={styles.shifter}>
            <div className={styles.work} onClick={this.shiftWork.bind(this)} onTouchStart={this.shiftWork.bind(this)}/>
            <div className={styles.rest} onClick={this.shiftRest.bind(this)}  onTouchStart={this.shiftRest.bind(this)}/>
          </div>
        </div>

      </div>
    )
  }
}

PomodoroTimer.propTypes = {
};

export default PomodoroTimer;
