# NoteApp

This application is an online video playing app with note taking capability which allows a user to add a video to their account, and share it with others. A user can add personal notes, like comments, as they play the video and later be able to view these notes while the video is being played back. The notes will be associated with the time they are taken at as the video is being played. The user can also look at their own private notes as well as public notes people may have for the same video. The user also has sharing and subscribing capabilities within the app. The application follows an MVC architecture for modularity.

## How to start the app

1. run 'npm install'
2. configure the env variables under name .env
3. run 'npm start'
4. Open a browser to http://localhost:3069 

## Features

### Authentication

Users can create individual accounts with user self sign ups located in the hamburger menu in the top left. The user signs up with a username and Password authentication. Session management is used so the user continues to stay signed in.

### Videos

Users have the ability to import a single video to their account using the link of the YouTube video. Users can import a YouTube playlist consisting of multiple videos into their account. The user must upload videos he wishes to youtube. The videos can then be added to the note taking application by logging in and navigating to the add video page. The user has the ability to edit some video information including the title, tags, and if it is public, after it has been added to the application by clicking the edit video button. The edit video button appears when the user is viewing their list of videos.

### Note Taking

Users can take private and public notes on the video page. When the user submits a note it is associated with a timestamp corresponding to the current time for the video. Users can see their previous notes displayed while watching the video. The user can toggle between the private notes or the public notes. Users can click on the timestamp of a note to navigate to its time in the video. Users can see new notes as they are created in real time. The notes that a user sees are always sorted by its video timestamp.

### Searching and Tagging

Users can add multiple tags to videos when they add the video to the application. The user has the ability to search for videos based on the title and the tags that are set to the video. Users are only able to search for videos that they are allowed to view.

### Sharing and subscribing

When the user adds a video to the application they have the ability to set the video to public or private. Users cannot see private videos unless the video is public or the owner of the video shares that video with the user. The user can subscribe to another user. When a user subscribes to another user the other user's videos of which the first user is allowed to view will appear in the dashboard page of the subscribing user.

## Tests

The tests that were implemented for the project are found in the test directory. The tests can be run using “npm run test”. The library that we used is Mocha. The type of tests that we implemented are database and functionality tests.The test suite tests the database helper functions to ensure proper functionality of the database and its structures. The tests ensure that most features work and function as required, the features being tested are related to user, videos, tags, sharing features.
