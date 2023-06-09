# TST Assistant
An assistant app for the Tech Support Team at Synthesis

## Functionalities
- Schedules a Google calendar event to check in on students experiencing tech issues 
- Queries DB for relevant info to create a quick email copy for the TST member
- Queries DB for an FPS check for the student in question and posts to the help ticket
- Reached auto-email status with Hubspot API as well using a two-emoji confirmation process

## Processes
- Uses a calendar sync function to decide whether to send a follow-up email or an initial general email
- doPost carries most of the weight. Most functions have been refactored but doPost filters for the reactions to decide what to do
