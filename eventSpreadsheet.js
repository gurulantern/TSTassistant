function onCalendarEventUpdated(e) {
    var eventObj = syncCalendarEvents();
    //log('Updated event ID: ' + eventObj.eventId);  
    log('Event Status: ' + eventObj.status);
    if (eventObj.status == "cancelled") {
      log("Event " + eventObj.eventId + " was deleted");
      checkAndUpdateSheet(eventObj.eventId, null);
    } else if (eventObj.status == "on calendar") {
      log("Event is on calendar. Checking if turned to green.");
      var event = CalendarApp.getEventById(eventObj.eventId);
      var color = event.getColor();
      if (color == 2 || color == 10 ) { // 2 and 10 are golor green
        log("Event " + event.getId() + " color is green");
        var description = event.getDescription();
        var descriptionNotes = description.split("---")[0].trim(); // get notes above ---
        checkAndUpdateSheet(eventObj.eventId, descriptionNotes);
      }  
    }
  }
  
  //This function updates the status of an event to be false
  function checkAndUpdateSheet(eventId, descriptionNotes) {
    var sheet = SpreadsheetApp.openById('115XIuyWVFmqmbje8Gcb7P0DKpzv1APQH2QAWzWREpeo').getSheetByName('events');
    
    // Find the row that matches the event ID
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    var rowIndex = -1;
    for (var i = 0; i < values.length; i++) {
      if (values[i][2] == (eventId + "@google.com")) {
        rowIndex = i + 1;
        break;
      }
    }
    
    // If the event ID is found, check if the event has been deleted or turned green
    if (rowIndex != -1) {
      var studentName = values[rowIndex - 1][0];  // grab studentName, then thrupass it to log
      log("Setting Event Status to FALSE");
      sheet.getRange(rowIndex, 4).setValue(false);
      if (descriptionNotes) { // Update column 8 with description notes
        sheet.getRange(rowIndex, 8).setValue(descriptionNotes);
        log("Updated row with " + studentName + "'s check-in notes.");
      }
    }
  }
  
  function getEmailType(studentId) {
    var sheet = SpreadsheetApp.openById('115XIuyWVFmqmbje8Gcb7P0DKpzv1APQH2QAWzWREpeo').getSheetByName('events');
    
    // Find the row that matches the STUDENT ID
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    var rowIndex = -1;
    var emailType;  
    for (var i = 0; i < values.length; i++) {
      if (values[i][1] == studentId) {
        rowIndex = i + 1;
        emailType = values[i][6];
        return emailType;
      }
    }
  }
  
  //This function takes the studentId to return an array with either true or false as 0 if the Student has a check in scheduled and studentID as 2
  function checkStatus(studentId) {
    var sheet = SpreadsheetApp.openById('115XIuyWVFmqmbje8Gcb7P0DKpzv1APQH2QAWzWREpeo').getSheetByName('events');
  
    // Find the row that matches the student ID
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    var rowIndex = -1;
    for (var i = 0; i < values.length; i++) {
      if (values[i][1] == studentId) {
        rowIndex = i + 1;
        break;
      }
    }
  
    // If the student ID is found, return the scheduled status
    if (rowIndex != -1) {
      log('Student is on event sheet')
      return [values[rowIndex - 1][3], values[rowIndex -1][2]];
    } else {
      log('Student is not on event sheet');
      return [false];
    }
  }
  
  //Adds a new student to the event sheet or adds the new event id and changes the status to true or false
  function updateSheetWithEventIdAndStatus(student, eventId, status) {
    var sheet = SpreadsheetApp.openById('115XIuyWVFmqmbje8Gcb7P0DKpzv1APQH2QAWzWREpeo').getSheetByName('events');
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    var studentIdFound = false;
    log("Checking for student in event sheet");
    for (var i = 1; i < values.length; i++) { // Start at i=1 to skip header row
      if (values[i][1] == student[0].id) { // Student ID found
        if (values[i][3]) {
          return;
        }
        sheet.getRange(i+1, 3).setValue(eventId); // Update event ID
        sheet.getRange(i+1, 4).setValue(status); // Update status
        sheet.getRange(i+1, 5).setValue(values[i][4] + 1); // Update counter
        studentIdFound = true;
        log("Student found. Updated event, status, and counter.");
        break;
      }
    }
    if (!studentIdFound) { // Student ID not found in sheet
      log("Adding a new student to event sheet");
      var newRow = [student[0].first_name + " " + student[0].last_name, student[0].id, eventId, status, 1];
      sheet.appendRow(newRow);
    }
  }