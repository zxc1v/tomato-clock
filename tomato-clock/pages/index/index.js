const util = require('../../utils/util.js')
const defaultLogName = {
  work: '工作',
  rest: '休息'
}
const actionName = {
  stop: '停止',
  start: '开始'
}
/*倒计时圆圈初始角度 */
const initDeg = {
  left: 45,
  right: -45,
}

Page({

  data: {
    remainTimeText: '',
    timerType: 'work',
    log: {},/*日志记录*/
    completed: false,
    isRuning: false,
    leftDeg: initDeg.left,
    rightDeg: initDeg.right
  },
  /*切入主页后显示的界面*/
  onShow: function() {
    if (this.data.isRuning) return
    /*获取workrime和resttime的值*/
    let workTime = util.formatTime(wx.getStorageSync('workTime'), 'HH')
    let restTime = util.formatTime(wx.getStorageSync('restTime'), 'HH')
    /*this.setdata来修改data数据*/
    this.setData({
      workTime: workTime,
      restTime: restTime,
      remainTimeText: workTime + ':00'/*剩余时间形如“25：00”*/
    })
  },
  /*设置“工作中/休息中”的闪烁动画*/
  startTimer: function(e) {
    let startTime = Date.now()/*获取当前日期*/
    let isRuning = this.data.isRuning/*获取页面data对象的数据*/
    let timerType = e.target.dataset.type
    /*e.target.dataset是指获取当前点击dom的值，确定是执行工作还是休息*/
    let showTime = this.data[timerType + 'Time']
    let keepTime = showTime * 60 * 1000
    /*获取任务名，若无任务名，则为执行的任务对应的类型——工作或休息*/
    let logName = this.logName || defaultLogName[timerType]

    if (!isRuning) {
      /*定时函数*/
      this.timer = setInterval((function() {
        this.updateTimer()
        this.startNameAnimation()
      }).bind(this), 1000)
    } else {
      this.stopTimer()
    }
    /*this.setdata来修改data数据*/
    this.setData({
      isRuning: !isRuning,
      completed: false,
      timerType: timerType,
      remainTimeText: showTime + ':00',
      taskName: logName
    })

    this.data.log = {
      name: logName,
      /*起始时间*/
      startTime: Date.now(),
      /*执行时间*/
      keepTime: keepTime,
      /*结束时间*/
      endTime: keepTime + startTime,
      action: actionName[isRuning ? 'stop' : 'start'],
      type: timerType
    }
    /*保存日志 */
    this.saveLog(this.data.log)
  },

  startNameAnimation: function() {
    let animation = wx.createAnimation({
      duration: 450/*动画持续时间 */
    })
    /*执行结果，"工作中"闪烁*/
    animation.opacity(0.2).step()/*设置透明度 */
    animation.opacity(1).step()/*设置透明度*/
    this.setData({
      nameAnimation: animation.export()
      /*导出动画队列。export 方法每次调用后会清掉之前的动画操作。*/
    })
  },
/*计时结束*/
  stopTimer: function() {
    // reset circle progress
    this.setData({
      leftDeg: initDeg.left,
      rightDeg: initDeg.right
    })

    // clear timer
    this.timer && clearInterval(this.timer)
    /* clearInterval取消定时器*/
  },

  updateTimer: function() {
    let log = this.data.log
    let now = Date.now()
    /*Math.round()把给定的值四舍五入为最接近的整数*/
    let remainingTime = Math.round((log.endTime - now) / 1000)
    /*Math.floor返回小于或等于其数值参数的最大整数。 */
    let H = util.formatTime(Math.floor(remainingTime / (60 * 60)) % 24, 'HH')/*小时*/
    let M = util.formatTime(Math.floor(remainingTime / (60)) % 60, 'MM')
    let S = util.formatTime(Math.floor(remainingTime) % 60, 'SS')
    let halfTime

    // update text
    if (remainingTime > 0) {
      let remainTimeText = (H === "00" ? "" : (H + ":")) + M + ":" + S
      this.setData({
        remainTimeText: remainTimeText
      })
    } else if (remainingTime == 0) {
      this.setData({
        completed: true
      })
      this.stopTimer()
      return
    }

    // update circle progress
    halfTime = log.keepTime / 2
    if ((remainingTime * 1000) > halfTime) {
      this.setData({
        leftDeg: initDeg.left - (180 * (now - log.startTime) / halfTime)
      })
    } else {
      this.setData({
        leftDeg: -135
      })
      this.setData({
        rightDeg: initDeg.right - (180 * (now - (log.startTime + halfTime)) / halfTime)
      })
    }
  },

  changeLogName: function(e) {
    this.logName = e.detail.value
  },
/*保存记录 */
  saveLog: function(log) {
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(log)
    wx.setStorageSync('logs', logs)
  }
})
