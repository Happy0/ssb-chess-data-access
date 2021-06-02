# Summary

We want to define an interface of all the 'data access' functions ssb-chess expects to be able to use to query data and publish messages.

There are changes with ssb-db2 which changes the interfaces a bit for accessing data and also makes it possible to run ssb apps in the browser. Defining an interface and then implementing it for 'ssb-client classic' will make it easier to move towards using these new functions and being able to make a browser app. It will also mean there is only one place to react to any future changes (such as multiple feeds / feed formats.) 