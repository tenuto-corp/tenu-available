import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

import { HOUR_IN_PIXELS, MINUTE_IN_PIXELS } from './Constants';
import TimeSlot from './TimeSlot';
import hasOverlap from './hasOverlap';
import inSameDay from './inSameDay';
import positionInDay from './positionInDay';
import styles from './DayInConfirm.css';
import toDate from './toDate';
import TimeSlotInConfirm from './TimeSlotInConfirm';

const ROUND_TO_NEAREST_MINS = 60;
const MINILENGTH_MINUTE = 60;

const bon_date= new Date();
function t() {

   
    bon_date.setDate(18)
    const first_date= new Date(bon_date);
    //alert(date1)
    const second_date= new Date(bon_date);
    const third_date= new Date(bon_date);
    const four_date= new Date(bon_date);
    //alert(date1)

    first_date.setHours(first_date.getHours()-14)
    second_date.setHours(second_date.getHours()-12)

    third_date.setHours(third_date.getHours()-9)
    four_date.setHours(four_date.getHours()-8)
      return ([ { start: first_date, end: second_date } , { start: third_date, end: four_date } ] )
}

export default class DayInConfirm extends PureComponent {
  constructor({ initialSelections }) {
    super();
    this.state = {
      index: undefined,
      selections: initialSelections,
 //     schedule_selections: [...initialSelections],
    };
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleSizeChangeStart = this.handleItemModification.bind(this, 'end');
    this.handleMoveStart = this.handleItemModification.bind(this, 'both');
    this.handleDelete = this.handleDelete.bind(this);
    this.getHeight = this.getHeight.bind(this);
     this.positionInDay  =(a ,b , c) => ( positionInDay(a,b,c))
    this.handleMouseTargetRef = (element) => {
      this.mouseTargetRef = element;
    };
  }

  findSelectionAt(date) {
    const { selections } = this.state;
    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      if (
        selection.start.getTime() <= date.getTime() &&
        selection.end.getTime() > date.getTime()
      ) {
        return true;
      }
    }
    return undefined;
  }

  relativeY(pageY, rounding = ROUND_TO_NEAREST_MINS) {
    const { top } = this.mouseTargetRef.getBoundingClientRect();
    let realY = pageY - top - (window.pageYOffset ||
      document.documentElement.scrollTop || document.body.scrollTop || 0);
    realY += this.props.hourLimits.top; // offset top blocker
    const snapTo = (rounding / 60) * HOUR_IN_PIXELS;
    return Math.floor(realY / snapTo) * snapTo;
  }


  handleDelete({ start, end }) {
    const { onChange, index } = this.props;

    this.setState(({ selections }) => {
      for (let i = 0; i < selections.length; i++) {
        if (selections[i].start === start && selections[i].end === end) {
          selections.splice(i, 1);
          onChange(index, selections);
          return { selections: selections.slice(0) };
        }
      }
      return {};
    });
  }

  handleItemModification(edge, { start, end }, { pageY, currentTarget }) {
    const position = this.relativeY(pageY);
    this.setState(({ selections }) => {
      for (let i = 0; i < selections.length; i++) {
        if (selections[i].start === start && selections[i].end === end) {
          return {
            edge,
            index: i,
            lastKnownPosition: position,
            minLengthInMinutes: MINILENGTH_MINUTE,
            target: currentTarget,
          };
        }
      }
      return {};
    });
  }

  handleTouchStart(e) {
    this.touch = {
      startY: e.touches[0].pageY,
      startX: e.touches[0].pageX,
    };
  }

  handleTouchMove(e) {
    this.touch.currentY = e.touches[0].pageY;
    this.touch.currentX = e.touches[0].pageX;
  }

  handleTouchEnd() {
    const { startY, currentY, startX, currentX } = this.touch;
    if (
      Math.abs(startX - (currentX || startX)) < 20 &&
      Math.abs(startY - (currentY || startY)) < 20
    ) {
      this.handleMouseDown({ pageY: startY });
      setTimeout(() => {
        this.handleMouseUp();
      });
    }
    this.touch = undefined;
  }

  handleMouseDown(e) {
    const { timeZone } = this.props;
    const position = this.relativeY(e.pageY,ROUND_TO_NEAREST_MINS );
    const dateAtPosition = toDate(this.props.date, position, timeZone);

    if (this.findSelectionAt(dateAtPosition)) {
      return;
    }

    let end = toDate(this.props.date, position + (MINILENGTH_MINUTE*MINUTE_IN_PIXELS), timeZone);
    end = hasOverlap(this.state.selections, dateAtPosition, end) || end;
 
    this.setState(({ selections }) => ({
      edge: 'end',
      index: selections.length,
      lastKnownPosition: position,
      minLengthInMinutes: MINILENGTH_MINUTE,
      selections: selections.concat([{
        start: dateAtPosition,
        end,
      }]),
    }));
  }

  // eslint-disable-next-line class-methods-use-this
  hasReachedTop({ offsetTop }) {
    const { hourLimits } = this.props;
    return offsetTop <= hourLimits.top;
  }

  hasReachedBottom({ offsetTop, offsetHeight }) {
    const { hourLimits } = this.props;
    return (offsetTop + offsetHeight) >= hourLimits.bottom;
  }
  handleMouseMove({ pageY }) {
    if (typeof this.state.index === 'undefined') {
      return;
    }
    const { date, timeZone } = this.props;
    const position = this.relativeY(pageY);
    this.setState(({ minLengthInMinutes, selections, edge, index, lastKnownPosition, target }) => {
      const selection = selections[index];
      let newMinLength = minLengthInMinutes;
      if (edge === 'both') {
        // move element
        const diff = toDate(date, position, timeZone).getTime() -
          toDate(date, lastKnownPosition, timeZone).getTime();
        let newStart = new Date(selection.start.getTime() + diff);
        let newEnd = new Date(selection.end.getTime() + diff);
        if (hasOverlap(selections, newStart, newEnd, index)) {
          return {};
        }
        if (this.hasReachedTop(target) && diff < 0) {
          // if has reached top blocker and it is going upwards, fix the newStart.
          newStart = selection.start;
        }

        if (this.hasReachedBottom(target) && diff > 0) {
          // if has reached bottom blocker and it is going downwards, fix.
          newEnd = selection.end;
        }

        selection.start = newStart;
        selection.end = newEnd;
      } else {
        // stretch element
        const startPos = positionInDay(date, selection.start, timeZone);
        const minPos = startPos + (minLengthInMinutes * MINUTE_IN_PIXELS);
        if (minPos < position) {
          // We've exceeded 60 mins now, allow smaller
          newMinLength = MINILENGTH_MINUTE;
        }
        const newEnd = toDate(date, Math.max(minPos, position), timeZone);
        if (hasOverlap(selections, selection.start, newEnd, index)) {
          // Collision! Let
          return {};
        }
        selection.end = newEnd;
      }
      return {
        lastKnownPosition: position,
        minLengthInMinutes: newMinLength,
        selections,
      };
    });
  }

  handleMouseUp() {
    if (typeof this.state.index === 'undefined') {
      return;
    }
    this.setState({
      edge: undefined,
      index: undefined,
      lastKnownPosition: undefined,
      minLengthInMinutes: undefined,
    });
    this.props.onChange(this.props.index, this.state.selections);
  }
  


  getHeight(start,end) {
 
    const { date,timeZone } = this.props;
    const m_start = positionInDay(date,start,timeZone);
    const m_end = positionInDay(date,end,timeZone);
   
    return (Math.max((m_end-m_start),1))
  }



  render() {
    const {
      available,
      availableWidth,
      date,
      events,
      timeConvention,
      timeZone,
      touchToDeleteSelection,
      hourLimits,
      initialSelections,
      timeslotHandleClick,
    } = this.props;

    const { selections, index } = this.state;
    const classes = [styles.component];
    const initialSelection = t();

    if (!available) {
      classes.push(styles.grayed);
    }

    if (inSameDay(date, new Date(), timeZone)) {
      classes.push(styles.today);
    }

    var start_block=new Date();
    start_block.setHours(0);
  

    return (
      <div
        className={classes.join(' ')}
        style={{
          height: HOUR_IN_PIXELS * 24,
          width: availableWidth,
        }}
      >



     
   


        {selections.map(({ start, end ,schedule_id,status}, i) => (

          <TimeSlotInConfirm
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            status={status}
            timeslotHandleClick={timeslotHandleClick}
            timeConvention={timeConvention}
            timeZone={timeZone}
            date={date}
            start={start}
            end={end}
            schedule_id={schedule_id}
            active={typeof index !== 'undefined'}
            onSizeChangeStart={this.handleSizeChangeStart}
            onMoveStart={this.handleMoveStart}
            onDelete={this.handleDelete}
            touchToDelete={touchToDeleteSelection}
          />

        ))}
      </div>
    );
  }
}

DayInConfirm.propTypes = {
  available: PropTypes.bool,
  availableWidth: PropTypes.number.isRequired,
  hourLimits: PropTypes.shape({
    top: PropTypes.number,
    bottom: PropTypes.number,
    bottomHeight: PropTypes.number,
    difference: PropTypes.number,
  }).isRequired,
  timeConvention: PropTypes.oneOf(['12h', '24h']),
  timeZone: PropTypes.string.isRequired,

  date: PropTypes.instanceOf(Date).isRequired,
  index: PropTypes.number.isRequired,
  initialSelections: PropTypes.arrayOf(PropTypes.shape({
    start: PropTypes.instanceOf(Date),
    end: PropTypes.instanceOf(Date),
  })),
  events: PropTypes.arrayOf(PropTypes.shape({
    start: PropTypes.instanceOf(Date),
    end: PropTypes.instanceOf(Date),
    title: PropTypes.string,
    width: PropTypes.number,
    offset: PropTypes.number,
  })),
  onChange: PropTypes.func.isRequired,
  touchToDeleteSelection: PropTypes.bool,
};

