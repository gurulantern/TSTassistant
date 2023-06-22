var GET_MESSAGE_ENDPOINT = "https://slack.com/api/conversations.history"
var USERS_ENDPOINT = "https://slack.com/api/users.list"
var USER_PROFILE_ENDPOINT = "https://slack.com/api/users.profile.get?user="
var VIEWS_OPEN = "https://slack.com/api/views.open"
var POST_MESSAGE = "https://slack.com/api/chat.postMessage"
var HELPER_WEBHOOK = "https://hooks.slack.com/services/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"
var HUBSPOT_AUTO = "https://hooks.slack.com/services/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"

//getting the send help message template & mention id
function getUrgentHelpMessage() {
  return "Urgent: <!subteam^S03Q8S12VKJ> on-call needs support for prompt ticket resolution. Off-shift? Please assist";
}

function getReactions(channelId, messageTs) {
  var url = "https://slack.com/api/reactions.get?channel=" + channelId + "&timestamp=" + messageTs;
  var options = {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + 'xoxb'
    },
  };
  var response = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(response.getContentText());
  if (data.ok) {
    return data.message.reactions;
  } else {
    log("Error: " + data.error);
    return;
  }
}

//helper function to check parent vs reply messages
function getReplies(channelId, messageTs) {
  var url = "https://slack.com/api/conversations.replies?channel=" + channelId + "&ts=" + messageTs;
  var options = {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + 'xoxb'
    },
  };
  var response = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(response.getContentText());
  if (data.ok) {
    return data.messages;
  } else {
    //log("Error: " + data.error);
    return;
  }
}

//test function to hopefully get the thread_ts and filter
function getPermalink(channelId, messageTs) {
  var url = "https://slack.com/api/chat.getPermalink?channel=" + channelId + "&message_ts=" + messageTs;
  var options = {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + 'xoxb'
    },
  };
  var response = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(response.getContentText());
  if (data.ok) {
    return data.permalink;
  } else {
    log("Error: " + data.error);
    return;
  }
}


// post fps median
function postFpsMedian(channelId, message, messageTs) {
  log("Posting FPS median message")
  var options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + 'xoxb'
    },
    payload: JSON.stringify({
      channel: channelId,
      text: message,
      link_names: true,
      thread_ts: messageTs
    })
  };

  UrlFetchApp.fetch("https://slack.com/api/chat.postMessage", options);
}

//LEROY ADDED
//Function sending Help Message + help ticket url
function postMessageToSlack(channelId, message, ticketUrl) {
  log("Posting help message")
  var options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + 'xoxb'
    },
    payload: JSON.stringify({
      channel: channelId,
      text: message,
      link_names: true,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: message
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "See Ticket"
            },
            url: ticketUrl
          }
        }
      ]
    })
  };

  UrlFetchApp.fetch("https://slack.com/api/chat.postMessage", options);
}

//Function that takes the blocks that include fetched data and sends to a channel and tags tst member
function messageTstUser(blocks) {
  log("Sending message");
  var payload = {
  "channel"     : "#tech-support-email-copy",
  "blocks"       : `${blocks}`  
  };

  var res = UrlFetchApp.fetch(
  POST_MESSAGE,
    {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        Authorization : 'Bearer ' + 'xoxb-',
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions : true,
  })
  return JSON.parse(res);
}

//Function that takes the blocks that include fetched data and sends to a channel and tags tst member
function postToThread(channelId, blocks, threadTs) {
  log("Sending message");
  var payload = {
    channel     : channelId,
    blocks      : blocks,
    thread_ts   : threadTs
  };

  var res = UrlFetchApp.fetch(
  POST_MESSAGE,
    {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        Authorization : 'Bearer ' + 'xoxb'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions : true,
  })
  log("Posted to thread");
  return JSON.parse(res);
}

//Takes the id of the help ticket and adds it to a url string to give a help ticket url
function helpTicketURL(channelId, messageTs) {
  var url_id = messageTs.replace(".","");
  var ticket_url = `https://synthesis-faculty.slack.com/archives/${channelId}/p${url_id}`;
  log(ticket_url);
  return ticket_url;
}

// Retrieve the text of a Slack message given its channel and timestamp
function getMessage(channelId,messageTs){
  var res = UrlFetchApp.fetch(
  GET_MESSAGE_ENDPOINT+`?channel=${channelId}&latest=${messageTs}&inclusive=true&limit=1`,
    {
      method             : 'get',
      contentType        : 'application/x-www-form-urlencoded',
      headers            : {
        Authorization : 'Bearer ' + 'xoxb'
      },
      muteHttpExceptions : true,
  })
  return JSON.parse(res);
}


//fetches the id of a TST member and grabs their email
function getTstEmail(id){
  var res = UrlFetchApp.fetch(
  USER_PROFILE_ENDPOINT+`${id}`,
    {
      method             : 'get',
      contentType        : 'application/x-www-form-urlencoded',
      headers            : {
        Authorization : 'Bearer ' + 'xoxb'
      },
      muteHttpExceptions : true,
  })
  return JSON.parse(res);
}



//Takes the portal link. Grabs the student id and parent id from the portal link and returns an object
function getIDs(url) {
  /*
  if (!url.startsWith('https://portal.synthesis.is/parents/')) {
    // URL is not in the expected format, return null or empty object
    return null;
  }
  */
  var parentArr = url.split("/");
  var studentArr = parentArr[6].split("|");

  var ids = {
    student: studentArr[0],
    parent: parentArr[4]
  }
  return ids;
}

function generalEmail(student, parent, tst, checkIn) {

   // check if the issues include 'device-related' or 'network-connectivity'
  let isDeviceRelated = tst.issues.includes("device-related");
  let isNetworkRelated = tst.issues.includes("network-connectivity");
  
  // define the device issue details string; will only be set if a device-related issue exists
  let deviceIssueDetails = isDeviceRelated 
    ? "These issues could be due to system lag, inadequate specifications, or other device-specific problems. " 
    : "";
  
  // define the net issue details string; will only be set if a device-related issue exists
  let networkIssueDetails = isNetworkRelated && !isDeviceRelated 
    ? "This might be caused by a weak WiFi signal, misconfigured internet settings, or an issue from your Internet Service Provider. " 
    : "";

  //check if device issue alone or w/network issue - default to device...if net is alone, show net message.
  let issueDetails = isDeviceRelated ? deviceIssueDetails : networkIssueDetails;

  //taken out ${issueDetails} - it feels too verbose & vague...need to rethink it. prob find a more useful variable
  
    var email = `Hi ${parent[0].first_name}, \n\nI’m ${tst.name} from the Synthesis Tech Support Team. Today during the session, ${student[0].first_name} experienced difficulties with ${tst.issues}.\n\nWe'd love to help you troubleshoot the issue. Please use <https://calendly.com/synthesis-tech-support/appointment|this link> to make an appointment with Synthesis’ Tech Support team so that we can get your device correctly configured before the next session.\n\nThank you!\n\nBest,`

    var teacherAddress;
if (student.length > 1 && student[0].email && student[1].email) {
  teacherAddress = student[0].email + ", " + student[1].email;
} else if (student.length > 0 && student[0].email) {
  teacherAddress = student[0].email;
} else {
  teacherAddress = "No teacher email(s) for this case."; //case handling for playDemo students.
}
    // Check if student[0].sku is empty or undefined, if so, assign it "Play Only"
    var studentSKU = student[0].sku ? student[0].sku : "Play Only";

    var blocks = 
    `
    [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "Email Info for ${student[0].first_name} - ${studentSKU}",
          "emoji": true
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Add notes to check-in event"
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Edit Event",
            "emoji": true
          },
          "value": "checkin_event",
          "url": "${checkIn}",
          "action_id": "go_to_checkin"
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "<@${tst.slack}>"
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "General Email"
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Parent Email:*"
        }
      },
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text": "${parent[0].email}",
          "emoji": true
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Teacher Email(s)*"
        }
      },
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text": "${teacherAddress}",
          "emoji": true
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "${email}"
        }
      }
    ]
    `
    return blocks;
  }

  function followUp (student, parent, tst, checkIn){
    if (!tst.issues || tst.issues === "") {
    tst.issues = "tech issue";
  }
    var email = `Hi ${parent[0].first_name}, \n\nWe are following up on ${tst.issues}.\n\n Please use <https://calendly.com/synthesis-tech-support/appointment|this link> to make an appointment so that we can make sure that ${student[0].first_name}'s device is correctly configured before the next session.\n\nThank you!`;
    var teacherAddress;
if (student.length > 1 && student[0].email && student[1].email) {
  teacherAddress = student[0].email + ", " + student[1].email;
} else if (student.length > 0 && student[0].email) {
  teacherAddress = student[0].email;
} else {
  teacherAddress = "No teacher email(s) for this case."; //case handling for playDemo students.
}

  // Check if student[0].sku is empty or undefined, if so, assign it "Play Only"
  var studentSKU = student[0].sku ? student[0].sku : "Play Only";

    var blocks = 
`
    [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "Email Info for ${student[0].first_name} - ${studentSKU}",
          "emoji": true
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Add context to check-in event"
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Edit Event",
            "emoji": true
          },
          "value": "checkin_event",
          "url": "${checkIn}",
          "action_id": "go_to_checkin"
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "<@${tst.slack}>"
        }
      },      
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Follow Up Email"
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Parent Email:*"
        }
      },
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text": "${parent[0].email}",
          "emoji": true
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Teacher Email(s)*"
        }
      },
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text": "${teacherAddress}",
          "emoji": true
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "${email}"
        }
      }
    ]
    `
    return blocks;
  }