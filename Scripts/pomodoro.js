///// GLOBAL VARIABLES /////
var hammerTime;
/// END GLOBAL VARIABLES //

function totalSeconds(date) {
    var total = date.getSeconds();
    total += date.getMinutes() * 60;
    total += date.getHours() * 60 * 60;

    return total;
}

/**
 * @param {JQuery} $button 
 * @param {JQuery} $target 
 * @param {Timer} timer
 */
function ChangeTimeButton($button, $target, timer) {
    this.$button = $button;
    this.$target = $target;
    this.symbol = $button.html();
    $button.click($.proxy(changeTarget, this));

    function changeTarget() {
        var targetValue = parseInt($target.html());
        if (targetValue > 1 && this.symbol === "-") {
            $target.html(targetValue - 1);
        }
        else if (this.symbol === "+") {
            $target.html(targetValue + 1);
        }
        else
            console.log("Error on ChangeTimeButton -> changeTarget");
        var purpose = $button.parent().parent().prop("id").split("-")[0].toUpperCase();
        if (timer.isSessionStarted === false && purpose === timer.curSession)
            timer.$digits.html($target.html());
    }
}

/**
 * @param {JQuery} $button 
 * @param {Timer} timer 
 */
function StrtStpResetBtns($button, timer) {
    this.$button = $button;
    this.timer = timer;

    $button.click($.proxy(this.action, this));
}

StrtStpResetBtns.prototype.action = function () {
    if (this.$button.prop("id") === "start") {
        if (this.timer.isSessionStarted)
            this.timer.continue();
        else {
            this.timer.setTimer();
        }
    }

    else if (this.$button.prop("id") === "reset" && this.timer.isSessionStarted === true)
        this.timer.reset();
    else {
        this.timer.stop();
    }
};

/**
 * @param {JQuery} $digits
 * @param {Number} breaktime
 * @param {Number} workTime
 * @param {JQuery} $anvil
 */
function Timer($digits, $breakTime, $workTime, $anvil, animFunc) {
    this.$digits = $digits;
    this.$breakTime = $breakTime;
    this.$workTime = $workTime;
    this.$anvil = $anvil;
    this.animFunc = animFunc;

    this.isSessionStarted = false;
    this.isRunning = false;
    this.curSession = "WORK";
    this.DateNow = null;
    this.DateGoal = null;
    this.origSecsToGoal = null;
    this.counter = null;
    this.hours = 0;
    this.min = 0;
    this.sec = 0;
}

Timer.prototype.getSessionLength = function () {
    if ($("#work-btns").css("display") === "none") {
        if (this.curSession === "WORK")
            return parseInt($("#mobile-work-time").html());
        else 
            return parseInt($("#mobile-break-time").html());
    }
    else {
        if (this.curSession === "WORK")
            return parseInt(this.$workTime.html());
        else
            return parseInt(this.$breakTime.html());
    }
};

Timer.prototype.setTimer = function () {
    clearInterval(this.counter);
    this.isSessionStarted = true;
    this.isRunning = true;
    this.DateNow = new Date();
    this.DateGoal = new Date();
    this.DateGoal.setMinutes(parseInt(this.DateGoal.getMinutes()) + this.getSessionLength());
    this.origSecsToGoal = totalSeconds(this.DateGoal) - totalSeconds(this.DateNow);
    this.counter = setInterval(this.tick.bind(this), 1000);
    this.animFunc();
    this.updateTimer();
    this.showTimeLeft();
};

Timer.prototype.stop = function () {
    clearTimeout(hammerTime);
    $("#hammer").prop("class", "hammer-down");
    clearInterval(this.counter);
    this.counter = setInterval(function () {
        this.DateNow.setSeconds(parseInt(this.DateNow.getSeconds()) + 1);
        this.DateGoal.setSeconds(parseInt(this.DateGoal.getSeconds()) + 1);
    }.bind(this), 1000);
};

Timer.prototype.continue = function () {
    this.animFunc();
    clearInterval(this.counter);
    this.counter = setInterval(this.tick.bind(this), 1000);
};

Timer.prototype.reset = function () {
    clearTimeout(hammerTime);
    $("#hammer").prop("class", "hammer-down");
    clearInterval(this.counter);
    this.isSessionStarted = false;
    this.$digits.html(this.getSessionLength());
};

Timer.prototype.updateTimer = function () {
    this.DateNow.setSeconds(parseInt(this.DateNow.getSeconds()) + 1);

    var diff = this.DateGoal.getTime() - this.DateNow.getTime();

    this.hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    this.min = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    this.sec = Math.floor((diff % (1000 * 60)) / 1000);
};

Timer.prototype.tick = function () {
    this.updateTimer();
    this.showTimeLeft();


    $(this.$anvil).css("background-position-y", Math.abs(
        (totalSeconds(this.DateGoal) - totalSeconds(this.DateNow)) -
        this.origSecsToGoal) / this.origSecsToGoal * 100 / 0.875);

    if (this.hours + this.min + this.sec <= 0) {
        this.sessionStarted = false;
        this.curSession = this.curSession === "WORK" ? "BREAK" : "WORK";
        $("#session").html(this.curSession);
        this.setTimer();
    }
};

Timer.prototype.getTimeLeft = function () {
    var h = this.hours === 0 ? "" : this.hours <= 9 ? "0" + this.hours + ":" : this.hours + ":";
    var m = this.min <= 9 ? "0" + this.min : this.min;
    var s = this.sec <= 9 ? "0" + this.sec : this.sec;

    return h + m + ":" + s;
};

Timer.prototype.showTimeLeft = function () {
    this.$digits.html(this.getTimeLeft());
};

$(function () {
    var $hammer = $("#clock #hammer");
    var intervalTime = 100;
    var timer = new Timer($("#time"), $("#break-time"),
        $("#work-time"), $("#anvil"), startHammerAnim);

    ///// MOBILE STUFF /////
    var $mobileTog = $("#mobile-toggle");
    var $mobileMenu = $("#mobile-menu");
    var $toggleUp = $("#toggle-up");
    var $mobContain = $(".mobile-btns-container");

    $mobileTog.click(function () {
        $mobileMenu.animate({
            height: $("#start-stop-buttons").offset().top - $(window).scrollTop()
        }, function () {
            $($mobContain).animate({
                opacity: 1
            }, 200).css("pointer-events", "visible");
        });
    });

    $toggleUp.click(function () {
        $($mobContain).animate({
            opacity: 0
        }, 100).css("pointer-events", "none");
        $mobileMenu.animate({
            height: 0
        });
    });
    /// END MOBILE STUFF ///

    INIT();

    function INIT() {
        initTimerChangers();
        new StrtStpResetBtns($("#start"), timer);
        new StrtStpResetBtns($("#stop"), timer);
        new StrtStpResetBtns($("#reset"), timer);
    }

    function initTimerChangers() {
        $("#break-btns button, #work-btns button, #break-mobile-btns button, #work-mobile-btns button").each(function () {
            new ChangeTimeButton($(this), $(this).parent().find("span"), timer);
        });
    }

    function startHammerAnim() {
        $hammer.removeClass("hammer-up");
        $hammer.addClass("hammer-down");
        intervalTime = 900;
        hammerTime = setTimeout(hammerAnim, intervalTime);
    }

    function hammerAnim() {
        $hammer.toggleClass("hammer-down hammer-up");
        clearTimeout(hammerTime);
        hammerTime = setTimeout(hammerAnim, intervalTime);
        intervalTime = intervalTime === 100 ? 900 : 100;
    }

});

$(window).on("load", function () {
    $("#loading-screen img").delay(3000).animate({
        opacity: 0
    }, 600, function () {
        $(this).parent().animate({
            opacity: 0
        }, 600, function () {
            $(this).hide();
        });
    });
});