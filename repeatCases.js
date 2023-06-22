function getTicketsInPast60Days(firstName, lastName) {
    log('Checking repeat cases');
    const sheetId = '1tUAYtUY18tfl59dtzpvyT2vTHb0UyeYLAbPRRMYdDpI';
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Rolling 60 day repeat student issues');
  
    const data = sheet.getDataRange().getValues();
  
    let totalTickets = 0;
  
    for (const row of data) {
      const name = row[0].toLowerCase(); // Convert the name in the sheet to lowercase
      const numTickets = row[7]; // 8th column
  
      // Case-insensitive comparison
      if (name === `${firstName.toLowerCase()} ${lastName.toLowerCase()}`) {
        totalTickets += numTickets;
        log('Tickets found: ' + totalTickets);
      }
    }
  
    return totalTickets;
  }