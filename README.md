# Nifty Chat Monitor
**NOTE: This userscript DOES NOT currently work with the new Twitch Beta chat (url starts with https://go.twitch.tv)**

Userscript for Grease/Tampermonkey to reformat the default twitch chat for use on an non-interactive chat monitor. It removes all extraneous formatting to maximize screen real estate for the chat text and adds various hooks to each chat message so that they can be effectively targeted by CSS rules.

![smaple image](https://raw.githubusercontent.com/paul-lrr/nifty-chat-monitor/master/chat-monitor-sample.png)
*LEFT: default Dark mode twitch Chat -- RIGHT: Nifty Chat Monitor reformated chat*

### Features
- removes header
- removes text input field
- increases text size
- changes font Open Sans Condensed to maximize text density and legibility
- removes username colors
- adds zebra striping for legibility
- removes scrollbars
- optionally reverse chat direction
- optionally inlines linked images
- configurable highlighting

### Default Highlighting
- Channel Owner message highlighted in blue
- Moderator usernames are light blue
- LRRbot username in purple
- LRR sub welcome message is highlighted in purple
- LoadingReadyRun mentions highlighted in dark blue


## Installation
- Install the [Tampermonkey](https://tampermonkey.net/) extension for your browser
- Open the Tampermonkey dashboard and create a new userscript (the + button in the top right - beside Installed userscripts)
- Copy the contents of `chat-monitor.js` into the new Tampermonkey userscript
- Save userscript and make sure it is enabled in Tampermonkey

## Usage
To view the reformatted chat, go to `http://www.twitch.tv/<CHANNEL NAME>/chat?display`

You can also click on the Popout link in the twitch chat pane and then remove the `?popout=` from the url and add `?display` to the end

To access options click the settings wheel in the top right hand corner of the screen. Remember to save, and then refresh the page to apply the new options.

### Display Modes
A few extra functions can be accessed by adding to the query string of the chat window

`reverse` - Reverses the direction of the chat (so that new messages are on top)

`img` - attempts to inline image links (it looks for links that end in png, jpg or gif and turns them into `<img>` tags

*eg. http://www.twitch.tv/loadingreadyrun/chat?display&reverse&img would display the chat in reverse with inline images*

## Hooks
Every other message is given a `odd` class for accurate zebra striping

The root element of each message is given the following extra attributes:

`data-user` - contains the message author

`data-badges` - comma seperated list of author's badges

`data-message` - the full text of the message

See the `chat-monitor-highlights.css` file for examples of using these hooks to highlight chat messages

## Customizing
If you want to change the formatting or add new highlights, either copy the supplied chat-monitor.css and chat-monitor-highlights.css to your local system and modify the two @resource lines in the header block of the script to point to your files, or modify the CSS User Highlighting text area under the settings menu with whatever CSS you would like to add to the page.
