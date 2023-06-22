function createCheckInEvent(student, parent, tst, helpTicketURL) {
    // Authenticate with the Google Calendar API
    //var calendarId = "c_a4925e3f1f6be8f5591194d8148321718bafd3c04b951d4e92d40d8ddf15c37f@group.calendar.google.com";
    var calendarId = "primary";
    var calendar = CalendarApp.getCalendarById(calendarId);
    
    var times = nextClass(student[0].day, student[0].time, studentSKU);
    var parentContactLink = getParentHubspotContactLink(parent[0].email); //pass email to hubspot function for querying
    var previousNotes = getPreviousNotes(student[0].id, student[0].first_name);  // Fetch previous notes
   
   // Get date and time in PT...then format it as 'MM/dd'
    var now = new Date();
    var pacificNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  
    var month = pacificNow.getMonth() + 1; // js starts from 0 for January, so increment by 1
    var date = pacificNow.getDate();
  
    var pacificDate = (month < 10 ? '' + month : month) + '/' + (date < 10 ? '0' + date : date);
  
  
    log("Making event in "+ calendar.getName());
    // Create a new event object
    
    // Again, check if student[0].sku is empty or undefined... if so, assign it "Play Demo"
      var studentSKU = student[0].sku ? student[0].sku : "Play Only";
  
    var event = calendar.createEvent(
      `Check in on ${student[0].first_name} - ${studentSKU}`, 
      new Date(times.start),
      new Date(times.end),
      {description: `${pacificDate}: \n${previousNotes}\n\n---\nParent's HubSpot: ${parentContactLink}\n\nHelp Ticket: ${helpTicketURL}\n\nCan't find student? Check OPS Portal: ${parent[0].email}\n\nInitiated by ${tst.name}`}
       //guests: tst.email } // Add tst member's email as an attendee
    );
    
    //log(`tstEmail passed: ${tst.email}`);
  
    event.setColor("11");
    var eventId = event.getId();
  
    log("Event created: " + eventId);
    
    updateSheetWithEventIdAndStatus(student, eventId, true);
  
    var calendarId = event.getOriginalCalendarId();
    log("Calendar ID: " + calendarId);
  
    var splitEventId = eventId.split('@');
  
    var event_VIEW_IN_CAL_URL = 'https://calendar.google.com/calendar/r/eventedit/' + Utilities.base64Encode(splitEventId[0] + ' ' + calendarId);
    
    log("Event URL: " + event_VIEW_IN_CAL_URL);
    
    return event_VIEW_IN_CAL_URL;
  }
  
  //function to grab check-in notes 
  function getPreviousNotes(studentId, studentName) {
    var sheet = SpreadsheetApp.openById('115XIuyWVFmqmbje8Gcb7P0DKpzv1APQH2QAWzWREpeo').getSheetByName('events');
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    var previousNotes = "";
    for (var i = 0; i < values.length; i++) {
      if (values[i][1] == studentId) {
        previousNotes = values[i][7]; // column 8
        break;
      }
    }
    if(previousNotes == ""){
      log("No previous check-in notes for " + studentName);
    } else {
      log("Found! Grabbing check-in notes for " + studentName)
      // Replace more than two consecutive <br>'s with a single <br> 
      previousNotes = previousNotes.replace(/(<br>){2,}/g, "<br>");
    }
    return previousNotes;
  }
  
  function idToEventURL (eventId) {
    var splitEventId = eventId.split('@');
    var eventURL = 'https://calendar.google.com/calendar/r/eventedit/' + Utilities.base64Encode(splitEventId[0] + ' ' + 'tech-support@synthesis.is');
    log(eventURL);
    return eventURL;
  } 
  
  // Finds next day from day enum and times from the recurrence time then creates an object of start and end time strings...added (5/28) a thrupass parameter - studentSKU - from createCheckInEvent above.
  function nextClass(dayIndex, time, studentSKU) {
      var date = new Date();
      var ptStart, ptEnd;
  
      // Check if day, time and SKU are not provided. If SKU is 'Play Demo' it's considered not provided.
      if (!dayIndex || !time || studentSKU === "Play Demo") {
          var daysUntilSaturday;
          if (date.getDay() === 6) { // Check if today is Saturday -> day 6 of the week
              daysUntilSaturday = 7; // If so, set the event for the next Saturday
          } else {
              daysUntilSaturday = (6 - date.getDay() + 7) % 7; // Calculate how many days until the next Saturday
          }
          date.setDate(date.getDate() + daysUntilSaturday);  // Set the date to be the next Saturday.
          date.setHours(8, 0, 0);  // Set the start time to be 8a PT.
          ptStart = Utilities.formatDate(date, "America/Los_Angeles", "yyyy-MM-dd'T'HH:mm:ss");
          date.setHours(8, 15, 0);  // Set the end time to be 8:15a PT.
          ptEnd = Utilities.formatDate(date ,"America/Los_Angeles", "yyyy-MM-dd'T'HH:mm:ss");
      } else {
          // Get the next class day and time as before.
          date.setDate(date.getDate() + (getWeek(dayIndex) - 1 - date.getDay() + 7) % 7 + 1);
          date.setHours(Number(time.slice(0,2)));
          date.setMinutes(minuteFormatter(Number(time.slice(3,5)), studentSKU));
          date.setSeconds(00);
  
          ptStart = Utilities.formatDate(date, "America/Los_Angeles", "yyyy-MM-dd'T'HH:mm:ss");
  
          if (date.getMinutes() === 30) {
              date.setMinutes(45);
          } else {
              date.setMinutes(minuteFormatter(date.getMinutes() + 15, studentSKU));
          }
          ptEnd = Utilities.formatDate(date ,"America/Los_Angeles", "yyyy-MM-dd'T'HH:mm:ss");
      }
  
      var times = {
        start: ptStart,
        end: ptEnd
      }
      return times;
  }
  
  
  
  
  // Check if event is at 00 minutes or 30 minutes returns 15 or 30 and if at 30 it returns 30 for cohorts starting at 30 minute mark. [Set to be archived - now handled by nextClass function]
  function minuteFormatter(time) {
    if (time == 00) {
      return 15;
    } else if (time == 15) {
      return 30;
    } else if (time == 30) {
      return 30;
    }
  
    return;
  }
  
  //Returns a number corresponding to the weekday name
  function getWeek(day) {
    // use a 'switch' statement to calculate the weekday name from the weekday number
    switch (day) {
    case "Sunday":
      return 0;
    case "Monday":
      return 1;
    case "Tuesday":
      return 2;
    case "Wednesday":
      return 3;
    case "Thursday":
      return 4;
    case "Friday":
      return 5;
    case "Saturday":
      return 6;
    }
  }
  
  function syncCalendarEvents() {
    var eventId;
    var status = "on calendar";
    var calendarId = "primary";
    var lastSync = getTimestampOfLastSync(); // Get timestamp of last sync from somewhere
  
    var params = {
      updatedMin: lastSync
    };
  
    //log(JSON.stringify(params));
    var events = Calendar.Events.list(calendarId, params);
    for (var i = 0; i < events.items.length; i++) {
      //log("FIRST DIVE: " + JSON.stringify(events.items[i]));
      var event = events.items[i];
      var updated = new Date(event.updated);
      //log(updated);
      var lastSyncDate = new Date(lastSync);
      if (updated > lastSyncDate) {
        //log("Grabbing event id");
        // Event has been updated since last sync, if green store event id, if deleted store cancelled
        //log("Current Status of event: " + events.items[0].status);
        if (event.status == "cancelled") {
          log("Setting status to cancelled in syncCalendarEvents");
          status = "cancelled";
        } 
        eventId = event.id;
      }
    }
  
    var date = new Date();
    var timeZone = Session.getScriptTimeZone();
    var formattedDate = Utilities.formatDate(date, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
  
    // Update timestamp of last sync
    setTimestampOfLastSync(formattedDate);
    return {
      eventId: eventId,
      status: status
    };
  }
  
  function getTimestampOfLastSync() {
    // Get timestamp of last sync from somewhere, such as a script property or user properties
    return PropertiesService.getScriptProperties().getProperty('lastSyncTimestamp');
  }
  
  function setTimestampOfLastSync(timestamp) {
    // Set timestamp of last sync, such as to a script property or user properties
    PropertiesService.getScriptProperties().setProperty('lastSyncTimestamp', timestamp);
  }