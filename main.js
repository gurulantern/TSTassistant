// Slack API verification handler moved to doPost - it's commented out. 

var HELP_PLAY = "C04JL8MGQLV"; // Add channel id
var HELP_BUTTON = "C03GTKXT40J"; // Add channel id
var ISSUE_REACTIONS = ["loud_sound","sound", "video_camera", "computer", "video_game", "signal_strength"];

const TEST_OBJ = [{first_name:"Test",last_name:"Wood",id:"3478fdc1-91b9-4d5b-b1aa-75ac2e37fe50",sku:"4793",start_datetime:"2022-04-08 09:00:00.0",email:"leroy.mwasaru@synthesis.is",day:"Friday",time:"02:00:00"},{first_name:"Juliette",last_name:"Wood",id:"3478fdc1-91b9-4d5b-b1aa-75ac2e37fe50",sku:"4793",start_datetime:"2022-04-08 09:00:00.0",email:"daniel.cisneros@synthesis.is",day:"Friday",time:"02:00:00"}];

//a small bank of bad median jokes
function getRandomJoke() {
  const jokes = [
    "...oddly, medians can't even.",
    "...median cows say, 'moo-dian.'",
    "...guess they're median't to be."
  ];

  const randomIndex = Math.floor(Math.random() * jokes.length);
  return jokes[randomIndex];
}

//Function to add ts of processed messages to properties to prevent extra firing
function isEventProcessed(eventIdentifier) {
  var scriptProperties = PropertiesService.getScriptProperties();
  var processedEvents = scriptProperties.getProperty("processedEvents");

  if (!processedEvents) {
    scriptProperties.setProperty("processedEvents", JSON.stringify([eventIdentifier]));
    return false;
  }

  processedEvents = JSON.parse(processedEvents);
  if (processedEvents.includes(eventIdentifier)) {
    return true;
  }

  processedEvents.push(eventIdentifier);
  scriptProperties.setProperty("processedEvents", JSON.stringify(processedEvents));
  return false;
}

//added a function to trigger at 1:30 AM PDT to clear properties
function clearProcessedEvents() {
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.deleteProperty("processedEvents");
}

function addEmailType(id, generalBool) {
  // Get the script properties
  var scriptProperties = PropertiesService.getScriptProperties();
  // Get the value of the "email" property
  var emailType = scriptProperties.getProperty("email");
  // Initialize the index to -1
  var index = -1;

  // If the "email" property doesn't exist, create it with a new array containing the student ID and general boolean
  if (!emailType) {
    log("Making new property for email");
    scriptProperties.setProperty("email", JSON.stringify([{student: id, general: generalBool}]));
    // Return false since no update was made
    return false;
  }

  // If the "email" property exists, parse the JSON string into an array of objects
  emailType = JSON.parse(emailType);
  log(JSON.stringify(emailType));

  // Loop through the array of objects to find the object with the matching student ID
  for (var i=0; i<emailType.length; i++) {
    if (emailType[i].student === id) {
      // If a matching object is found, update its "general" boolean value
      log("Setting new email bool");
      emailType[i].general = generalBool;
      index = i;
      // Exit the loop since the update has been made
      break;
    }
  } 

  // If no matching object is found, add a new object to the array with the student ID and general boolean
  if (index === -1) {
    emailType.push({student: id, general: generalBool});
  }
  
  // Update the "email" property with the updated array of objects
  scriptProperties.setProperty("email", JSON.stringify(emailType));
}


function checkEmailType(id) {
  var scriptProperties = PropertiesService.getScriptProperties();
  var emailType = JSON.parse(scriptProperties.getProperty("email"));

  for (i=0; i<emailType.length; i++) {
    if (emailType[i].student === id) {
      return emailType[i].general;
    }
  }

  return true;
}

//Added a function to trigger at 8:00 AM PDT to clear email
function clearEmail() {
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.deleteProperty("email");  
}

//sending help to the channel
function sendHelp(channelId, messageTs) {
  log("Preparing to send");
  var message = getUrgentHelpMessage();
  var ticketUrl = helpTicketURL(channelId,messageTs); //generate ticket url 
  postMessageToSlack(channelId, message, ticketUrl);
}

//get appropriate emoji for fps message
function getEmoji(fpsMedian) {
  if (fpsMedian >= 55) {
    return ":large_green_circle:"; // Green emoji
  } else if (fpsMedian >= 30 && fpsMedian <= 54) {
    return ":large_orange_circle:"; // Orange emoji
  } else {
    return ":red_circle:"; // Red emoji
  }
}

//if student is neurodivergent, then initiate extra message
    //LOVE THIS. This might be better placed outside of doPost(). - done
    let extraMessage = "";
    const neurodiverseStudents = [
    "021a5a4c-f4a3-4f88-9af8-2d1c0780588f", //Peter
    "recGJ88Mbct14RbiN", //Alexey
    "5ffb76aa-bdaa-4786-82ea-4896f1e5feac", //Raymond
    "8536c5cf-a7ad-4bf7-be33-52c5654fccd5" //Tristan
  ];

function doPost(e) {
  /*var messageTs = data.event.item.ts;
    if (processedMessages.indexOf(messageTs) !== -1) {
      return; // leroy's edit - If the message has already been processed, exit the function without doing anything
    }
  
   processedMessages.push(messageTs);
*/
var data = JSON.parse(e.postData.contents);

/*
// URL Verification
  if (data.type == "url_verification") {
    return ContentService.createTextOutput(data.challenge);
  }
  */
  
  //log(JSON.stringify(data));
/*
  // Fetch the replies of the message that the reaction was added to
  var replies = getReplies(data.event.item.channel, data.event.item.ts);

  // If the reaction was not added to a message in a thread, log and exit the function
  if (!replies) {
    //log("No replies found for this message.");
    return;
  }
  

  // Check if the reaction was added to a reply
  var reactionAddedToReply = replies.some(function (reply) {
    log("Reaction location check: " + reply.ts);
    return reply.ts === data.event.item.ts && reply.thread_ts !== reply.ts;
  });

  if (reactionAddedToReply) {
    log("Reaction on reply. Exiting function...");
    // If the reaction was on a reply, exit the function
    return;
  } else {
    log("Reaction on parent message. Proceeding...");
  }
*/
  if (data.event.type == "reaction_added" && (data.event.item.channel == HELP_BUTTON || data.event.item.channel == HELP_PLAY) && data.event.reaction == "email") {
    log("SENDING EMAIL COPY TO THREAD");
     
    var eventIdentifier = data.event.event_ts + data.event.user;
    if (isEventProcessed(eventIdentifier)) {
      log(eventIdentifier + " has already been processed");
      return; // If the event has already been processed, exit the function without doing anything
    }

    var dataArray = gatherData(data);
    var statusCheck = checkStatus(dataArray[0][0].id);

    if (statusCheck[0]) {
      log("Sending Follow Up")
      var checkinURL = idToEventURL(statusCheck[1]); 
      var blocks = followUp(dataArray[0], dataArray[1], dataArray[2], checkinURL);
      postToThread(data.event.item.channel, blocks, data.event.item.ts);
      addEmailType(dataArray[0].id, false);
    } else {
      log("Sending General")
      var checkinURL = createCheckInEvent(dataArray[0], dataArray[1], dataArray[2], dataArray[3]);
      var blocks = generalEmail(dataArray[0], dataArray[1], dataArray[2], checkinURL);
      postToThread(data.event.item.channel, blocks, data.event.item.ts);
      addEmailType(dataArray[0].id, true);
    }
    
  } else if (data.event.type == "reaction_added" && (data.event.item.channel == HELP_BUTTON || data.event.item.channel == HELP_PLAY) && data.event.reaction == "arrow_right") {
    log("EMAILING THROUGH API")

    var eventIdentifier = data.event.event_ts + data.event.user;
    if (isEventProcessed(eventIdentifier)) {
      log(eventIdentifier + " has already been processed");
      return; // If the event has already been processed, exit the function without doing anything
    }

    // Gathers all the data, checks the status of current check in and decides the proper email to send.
    var dataArray = gatherData(data);
    var statusCheck = checkStatus(dataArray[0][0].id);

    // Grabs the reactions so we can check for the email emoji
    var reactionArray = getReactions(data.event.item.channel, data.event.item.ts);
    var reactions = reactionArray.map(x => x.name);

    // Using checkEmailType to check if a general or follow up needs to be sent
    if (reactions.includes("email") && checkEmailType(dataArray[0][0].id)) {
      sendEmail(autoGeneralEmail(), dataArray[1][0].email, dataArray);
    } else if (reactions.includes("email")) {
      sendEmail(autoFollowupEmail(), dataArray[1][0].email, dataArray);
    }
  } else if (data.event.type == "reaction_added" && (data.event.item.channel == "C03GTKXT40J" || data.event.item.channel == "C04JL8MGQLV") && data.event.reaction == "test_tube") {
    log("LAUNCHING TEST");

    var eventIdentifier = data.event.event_ts + data.event.user;
    if (isEventProcessed(eventIdentifier)) {
      log(eventIdentifier + " has already been processed");
      return; // If the event has already been processed, exit the function without doing anything
    }

    var dataArray = gatherData(data);
    var statusCheck = checkStatus(dataArray[0][0].id);

    if (statusCheck[0]) {
      log("Sending Follow Up")
      var checkinURL = idToEventURL(statusCheck[1]); 
      var blocks = followUp(dataArray[0], dataArray[1], dataArray[2], checkinURL);
      postToThread(data.event.item.channel, blocks, data.event.item.ts);
    } else {
      log("Sending General")
      var checkinURL = createCheckInEvent(dataArray[0], dataArray[1], dataArray[2], dataArray[3]);
      var blocks = generalEmail(dataArray[0], dataArray[1], dataArray[2], checkinURL);
      postToThread(data.event.item.channel, blocks, data.event.item.ts);
    }

  } else if (data.event.type == "reaction_added" && data.event.item.channel == HELP_BUTTON && data.event.reaction == "slack_call") {
    log("SENDING HELP MESSAGE");
    var eventIdentifier = data.event.event_ts + data.event.user;
    if (isEventProcessed(eventIdentifier)) {
      log(eventIdentifier + " has already been processed");
      return;
    }
    //added logging for the slack_call reaction
    log(JSON.stringify(data.event));
    var tstId = data.event.user;
    var tstMember = tstObjMaker(tstId);
    log(JSON.stringify((tstMember)));

    sendHelp(data.event.item.channel, data.event.item.ts);
  } else if (data.event.type == "reaction_added" && (data.event.item.channel == HELP_BUTTON || data.event.item.channel == HELP_PLAY) && data.event.reaction == "eyes") {
    log("GETTING FPS MEDIAN");

    var eventIdentifier = data.event.event_ts + data.event.user;
    if (isEventProcessed(eventIdentifier)) {
      log(eventIdentifier + " has already been processed");
      return;
    }

    var dataArray = gatherData(data);
    var studentObj = dataArray[0];
    var ids = getIDs(findURL(getMessage(data.event.item.channel, data.event.item.ts).messages[0].blocks));
    var studentId = ids.student; // Use the correct student ID
    var messageTs = data.event.item.ts;

    log("Student ID: " + studentId); 

    // Get the student's first and last name
    const studentFirstName = studentObj[0].first_name;
    const studentLastName = studentObj[0].last_name;

    // playDemo message if SKU is empty (Play Trial)
    let playDemo = "";
    if (!studentObj[0].sku) {
      playDemo = `*Play Only student*: `;
    }

    // Fetch the number of ticket follow-ups for this student in the past 60 days
    const ticketsInfo = getTicketsInPast60Days(studentFirstName, studentLastName);
    

  if (neurodiverseStudents.includes(studentId)) {
    extraMessage = `\n\nHeads-up: ${studentFirstName} is neurodivergent - please be mindful & patient :pray:`;
  }

  // Add ticket information to the message if the student has any help ticket follow-ups
    let ticketMessage = "";
    if (ticketsInfo > 0) {
      ticketMessage = `\n\nAlso, we've sent ${ticketsInfo} follow-up${ticketsInfo > 1 ? 's' : ''} within the last 60 days :eyes:`;
    }

    log('Checking FPS & Network Data...');
    var fpsMedianData = getStudentFpsMedian({ student: studentId });
    var networkSpeedData = getStudentNetworkSpeed({ student: studentId });

 let fpsMedian, createdAtUTC, createdAtPacific, dateStr, timeStr, emoji, speedMessage = '';

if (fpsMedianData.length > 0) {
  log("fps: " + fpsMedianData[0].value); 
  fpsMedian = fpsMedianData[0].value;
  createdAtUTC = fpsMedianData[0].created_at;
  createdAtPacific = convertToPacificTime(createdAtUTC);
  dateStr = createdAtPacific.toLocaleDateString('en-US');
  timeStr = createdAtPacific.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  emoji = getEmoji(fpsMedian);
}

// Fix for error handling: Network speed message moved outside of the fpsMedianData length check...
if (networkSpeedData.length > 0) {
  log("netspeed: " + networkSpeedData[0].value);
  if (networkSpeedData[0].value <= 4) { //if 4 & below, then hard flag...
    speedMessage = ` - very low  :internet-problems: `;
  } else if (networkSpeedData[0].value <= 10) { //if 10 & below, then soft flag...
    speedMessage = ` - low :warning_: `;
  } else {
    speedMessage = ` :white_check_mark: `;
  }
}

//generate a possessive string for student's name...i (leroy) initially ignored it, but a good number of students' names end with an 's'
let studentPossessive = studentFirstName;
if (studentFirstName.toLowerCase().endsWith('s')) {
  studentPossessive += "'";
} else {
  studentPossessive += "'s";
}

if (fpsMedianData.length > 0) {
  postFpsMedian(data.event.item.channel, `${playDemo}${studentPossessive} latest fpsMedian score is ${fpsMedian} ${emoji}, tech-check speed at ${networkSpeedData[0].value} Mbps${speedMessage}\n\nData is from ${dateStr} at ${timeStr} PT. ${ticketMessage} ${extraMessage}`, messageTs);
} else {
  const joke = getRandomJoke();
  postFpsMedian(data.event.item.channel, `${playDemo}No fpsMedian data found for ${studentFirstName}, tech-check speed at ${networkSpeedData[0].value} Mbps${speedMessage} ${joke}${ticketMessage}${extraMessage}`, messageTs);
}

  }
}

/*
Returns a data array:
0 - student
1 - parent
2 - tst
3 - help ticket url
*/
function gatherData(data) {
    log(JSON.stringify(data.event));

    //Grab tst Slack Id
    var tstId = data.event.user;

    // Grab reactions and create the string for issues
    var reactionArray = getReactions(data.event.item.channel, data.event.item.ts);
    var reactions = reactionArray.map(x => x.name);
    var issueString = issueStringFormatter(reactions);
    
    // Make an object of the tst info
    var tstMember = tstObjMaker(tstId, issueString);
    log(JSON.stringify((tstMember)));

    // Grab helpticket URL and grab the help ticket itself to find the portal URL
    var helpTicket = helpTicketURL(data.event.item.channel, data.event.item.ts);
    var messageObject = getMessage(data.event.item.channel, data.event.item.ts);
    var portalURL = findURL(messageObject.messages[0].blocks);
    log(portalURL);

    // Use the portal URL to grab parent and student ids
    var ids = getIDs(portalURL);
    log('Student ID:'+ ids.student);
    log('Parent ID:' + ids.parent);

    // Create objects with all properties for the parent and student
    var parentObj = getParentInfo(ids);
    log('ParentOBJ:' + JSON.stringify(parentObj));
    var studentObj = getStudentInfo(ids);
    //log('Data from getStudentInfo(): ' + JSON.stringify(studentObj));
    studentObj[0].id = ids.student;
    log('StudentOBJ:' + JSON.stringify(studentObj));
    
    return [studentObj, parentObj, tstMember, helpTicket];
}

function tstObjMaker(tstId, issueString) {
  //LEROY CHANGE
  // Hardcoded Daniel's details; this part of the function would return an empty json.
  if (tstId === 'U02PW6QKTPT') {
    return {
      name: 'Daniel',
      email: 'daniel.cisneros@synthesis.is',
      slack: tstId,
      issues: issueString
    };
  }

  // For other users, fetch their details as normal
  var tstProf = getTstEmail(tstId);
  var tstEmail = tstProf.profile.email;
  var tstName = getTstName(tstEmail);
  log(JSON.stringify(tstName));
  var tstMember = {
    name: tstName[0].first_name,
    email: tstEmail,
    slack: tstId,
    issues: issueString
  };

  return tstMember;
}

function findURL(blocks) {
  for (i=0; i<blocks.length;i++) {
    if (Object.hasOwn(blocks[i], 'fields')) {
      for(j=0; j<blocks[i].fields.length; j++) {
        if (blocks[i].fields[j].text.includes(portal_prefix())) {
          return blocks[i].fields[j].text;
        }
      }
    }
  }
}

function issueStringFormatter(reactionArray) {
  var issues = [];
  var issueString = "";
  for (let i = 0; i < (reactionArray.length-1);i++) {
    if (ISSUE_REACTIONS.includes(reactionArray[i])) {
      issues.push(reactionArray[i]);
    }
  }
  log(JSON.stringify(issues));
  log("Crafting issue description...");
  
  if (issues.length == 0) {
    return "a technical issue";
  }

  // Return a string with just one word or a compound issue with no comma
  if (issues.length == 1) {
    var issue = issueSwitch(issues[0]);
    if (issue[0] == 'a') {
      issue = "an " + issue;
    } else {
      issue = "a " + issue;
    }
    return issue + " issue"
  } else if (issues.length == 2) {
    var issue1 = issueSwitch(issues[0]);
    var issue2 = issueSwitch(issues[1])
    return issue1 + " and " + issue2 + " issues";
  }

  // Return a string that adds commas and lists out 3 or 4 issues
  for (let i=0; i<issues.length; i++) {
    if (i != (issues.length - 1)) {
      issueString = issueString + issueSwitch(issues[i]) + ", "
    } else {
      issueString = issueString + "and " + issueSwitch(issues[i]) + " issues";
    }
  }

  return issueString;
}

function issueSwitch(issue) {
  // Depending on the reaction return the single descriptor for the email template.
  switch(issue) {
    case "loud_sound":
      return "audio-related";
    case "sound":
      return "audio-related";
    case "computer":
      return "device-related";
    case "video_game":
      return "gaming";
    case "signal_strength":
      return "network-connectivity";
    case "video_camera":
      return "video";
    default:
      return "technical";
  }
}