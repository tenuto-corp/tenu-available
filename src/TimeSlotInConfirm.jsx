import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import momentTimezone from 'moment-timezone';

import { MINUTE_IN_PIXELS } from './Constants';
import positionInDay from './positionInDay';
import styles from './TimeSlotInConfirm.css';

const BOTTOM_GAP = MINUTE_IN_PIXELS * 10;

export default class TimeSlotInConfirm extends PureComponent {
  constructor() {
    super();
    this.handleClick = ( e ) => {
    //    alert(this.props.start + " ID: " + this.props.schedule_id)
        this.props.timeslotHandleClick(this.props.schedule_id,this.props.start,this.props.end)
    };
  }

  componentDidMount() {
    this.creationTime = new Date().getTime();
  }

  formatTime(date) {
    const { timeConvention, timeZone, frozen } = this.props;
    const m = momentTimezone.tz(date, timeZone);
    if (timeConvention === '12h') {
      if (frozen && m.minute() === 0) {
        return m.format('ha');
      }
      return m.format('hh:mma');
    }
    if (frozen && m.minute() === 0) {
      return m.format('HH');
    }
    return m.format('HH:mm');
  }

  timespan() {
    const { start, end } = this.props;
    return [this.formatTime(start), '-', this.formatTime(end)].join('');
  }

  render() {
    const {
      active,
      date,
      start,
      end,
      frozen,
      width,
      offset,
      timeZone,
      title,
      touchToDelete,
      status,
    } = this.props;

    const top = positionInDay(date, start, timeZone);
    const bottom = positionInDay(date, end, timeZone);

    const height = Math.max(
      bottom - top - (frozen ? BOTTOM_GAP : 0),
      1,
    );
    
   
    const classes = [styles.component];
    const classes2 = [styles.component2];
    if (frozen) {
      classes.push(styles.frozen);
    }
    if (active) {
      classes.push(styles.active);
    }

    const style = {
      top,
      height,
    };

    if (typeof width !== 'undefined' && typeof offset !== 'undefined') {
      style.width = `calc(${width * 100}% - 5px)`;
      style.left = `${offset * 100}%`;
    }
    if(status==="EMPTY")
    {
      return (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions

        <div
            className={classes.join(' ')}
            style={style}
            onClick={ this.handleClick } 
        >
        
          <div
            className={styles.title}
            style={{
              textAlign:"center"
              // two lines of text in an hour
           //   lineHeight: `${(MINUTE_IN_PIXELS * 30) - (BOTTOM_GAP / 2)-2}px-`,
            }}
          >
         
            {this.timespan()}
          </div>
        </div>
      
      );
    }
    else
    {
      return (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
            className={classes2.join(' ')}
            style={style}
        >

          <div
            className={styles.title}
            style={{
              textAlign:"center"
              // two lines of text in an hour
            //  lineHeight: `${(MINUTE_IN_PIXELS * 30) - (BOTTOM_GAP / 2)-2}px-`,
            }}
          >
         
            {this.timespan()}
          </div>
        </div>
      
      );
    }
    
  }
}

TimeSlotInConfirm.propTypes = {
  touchToDelete: PropTypes.bool,
  timeConvention: PropTypes.oneOf(['12h', '24h']),
  timeZone: PropTypes.string.isRequired,

  active: PropTypes.bool, // Whether the time slot is being changed
  date: PropTypes.instanceOf(Date).isRequired, // The day in which the slot is displayed
  start: PropTypes.instanceOf(Date).isRequired,
  end: PropTypes.instanceOf(Date).isRequired,
  title: PropTypes.string,
  frozen: PropTypes.bool,

  onSizeChangeStart: PropTypes.func,
  onMoveStart: PropTypes.func,
  onDelete: PropTypes.func,

  // Props used to signal overlap
  width: PropTypes.number,
  offset: PropTypes.number,
};

TimeSlotInConfirm.defaultProps = {
  touchToDelete: false,
};
