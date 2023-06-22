//Returns the hubspot logger spreadsheet for logging
function spreadsheets() {
    return {
      logs:SpreadsheetApp.openById('1xxxx') // Add Sheet id
    }
  }
  
  function portal_prefix() {
    return "*Student:*\n<https://portal.synthesis.is/parents/";
  }
  
  function log(message){
    spreadsheets().logs.getSheetByName('logs').appendRow([new Date(),message]);
  }
  
  function autoGeneralEmail() {
    return 111111; // Add code for email
  }
  
  function autoFollowupEmail() {
    return 111111; // Add code for email
  }