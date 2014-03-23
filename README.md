KaazingNodeMongo
================

In this example, I look at how real-time Web communications can work well with a non-blocking JavaScript back-end server and a NoSQL database. Our demo is a simple drawing app. If all you use is WebSocket with simple pub-sub messaging, you can already achieve pretty amazing things with drawing. For example, you can share a drawing board among multiple browser clients and while viewing each other’s drawings in real time.

If you add a server-side component to it, you can do some central coordination and processing. And if on top of that you use a persistent storage, you can record all your real-time interactions to the database, and if needed play it all back. Icing on the cake is the ability of setting the replay speed: speeding it up or slowing it down.

For more information check out the detailed post and videos in this post: http://blog.kaazing.com/2013/06/27/websocket-big-data-and-non-blocking-server-side-io-with-kaazing-mongodb-and-node-js/.
