# Galax-O Software Engineering Interview Prep Guide

This guide contains project-specific interview questions designed to test your knowledge of frontend, backend, database, architecture, security, scalability, and real-time systems, strictly based on your **Galax-O** codebase.

---

## 1. Fundamentals (Level 1)

### Question 1: How does NestJS structure code into modules, and how is the relationship between the `UsersModule` and `AuthModule` handled in Galax-O?
* **File Reference:** [auth.module.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/auth/auth.module.ts#L8-L21) and [users.module.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/users/users.module.ts)
* **Ideal Answer:**
  NestJS uses a modular architecture where each module encapsulates a closely related set of capabilities (controllers, providers, and entities). In **Galax-O**, `UsersModule` provides services to find and create users, while `AuthModule` handles authentication (JWT generation, sign-in, etc.). 
  Because authentication requires checking user credentials (which uses `UsersService`), and user controllers might need guards (which use `AuthService` or `JwtService`), a circular dependency exists. In [auth.module.ts:L10](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/auth/auth.module.ts#L10), NestJS's `forwardRef()` is used to resolve this circular import by deferring the resolution of the module references until compile-time.
* **Why it is correct:**
  `forwardRef(() => UsersModule)` returns a wrapper that NestJS resolves once both modules are loaded, avoiding the "Cannot resolve dependency" crash that occurs when two files reference each other in a loop.
* **Common Mistakes Candidates Make:**
  * Confusing TypeScript circular imports with NestJS modular circular dependencies.
  * Failing to use `forwardRef()` in *both* the module decorators and the constructor injection points (if injecting services directly).
* **Possible Follow-up Questions:**
  * "How can we refactor the code to eliminate the circular dependency altogether without using `forwardRef`?" (e.g., by creating a `SharedAuthModule` or extracting the shared models/interfaces).
* **What a Strong Candidate Would Mention:**
  A strong candidate would note that circular dependencies are often a sign of high coupling. They would suggest moving the authentication guards to a separate core or common folder and injecting `JwtService` directly rather than depending on `AuthService`, thereby breaking the circular loop entirely.

---

### Question 2: Explain the database relationship defined between `User` and `Message` entities in your ORM layer.
* **File Reference:** [user.entity.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/users/entities/user.entity.ts#L18-L22) and [message.entity.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/messages/entities/message.entity.ts#L11-L15)
* **Ideal Answer:**
  The relationship is a **One-to-Many / Many-to-One** relationship. A `User` can send many messages and receive many messages. 
  * In [user.entity.ts:L18-22](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/users/entities/user.entity.ts#L18-L22), the `User` class defines `@OneToMany(() => Message, message => message.sender)` for `sentMessages` and `@OneToMany(() => Message, message => message.receiver)` for `receivedMessages`.
  * In [message.entity.ts:L11-15](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/messages/entities/message.entity.ts#L11-L15), the `Message` class defines two `@ManyToOne` decorators relating back to the `User` entity for the sender and receiver.
* **Why it is correct:**
  This maps to a relational schema with a foreign key column (`senderUserId` and `receiverUserId`) on the `message` table pointing to the primary key (`userId`) of the `user` table.
* **Common Mistakes Candidates Make:**
  * Forgetting that `@OneToMany` relations are only virtual side-mappings in TypeORM and do not create actual columns in the database table unless paired with `@ManyToOne` on the other side.
  * Inability to explain how to load these relations (e.g., forgetting they are lazy-loaded by default in TypeORM unless `eager: true` or `relations` is explicitly specified in queries).
* **Possible Follow-up Questions:**
  * "What happens to the messages in the database if a user is deleted?" (Currently, it throws a Foreign Key constraint error because no cascade delete or nullification is configured).
* **What a Strong Candidate Would Mention:**
  Mentioning the lack of `onDelete: 'CASCADE'` or `onDelete: 'SET NULL'` configurations on the `@ManyToOne` fields, explaining how this affects database integrity and delete operations in production.

---

## 2. Implementation and Design (Level 2)

### Question 3: In `Chat.jsx`, you are using React `useRef` to store state variables like `selectedUser` and `me` inside the Socket.io event listeners. Why is this necessary?
* **File Reference:** [Chat.jsx](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/frontend/src/pages/Chat.jsx#L20-L37)
* **Ideal Answer:**
  This is done to solve the **stale closure** problem in React. 
  The Socket.io listeners are set up inside a `useEffect` that runs only once (or when the authentication token changes). If the listener callback `handlePrivateMessage` referenced the React state variables `selectedUser` or `me` directly, it would close over their values at the time the effect ran (which are `null` and the initial empty user object). When a new message arrived, the event handler would read these stale values and fail to append the message to the active chat screen or update the unread count properly.
  By using `useRef` (e.g., `selectedUserRef` and `meRef`) and updating the ref on every render where the state changes, the socket listener can read the most up-to-date values using `ref.current` without needing to recreate the socket listeners on every render.
* **Why it is correct:**
  Refs in React maintain a stable object reference across renders. Mutating the `.current` property of a ref does not trigger a rerender, but it does allow asynchronous callbacks (like socket event handlers) to always access the latest value.
* **Common Mistakes Candidates Make:**
  * Suggesting that re-running the `useEffect` on every state change is a good solution (this would tear down and reconnect the WebSocket on every keystroke or message, causing major performance issues and connection thrashing).
  * Not understanding how JavaScript closures capture variable states at the time of definition.
* **Possible Follow-up Questions:**
  * "Are there alternative hooks in React to handle this, such as `useEvent` (experimental) or callback refs?"
* **What a Strong Candidate Would Mention:**
  A strong candidate would explain how recreating event listeners without proper cleanups causes **event listener leaks**, and would detail a clean abstraction (like custom hooks `useLatest` or context providers) to manage real-time event updates cleanly.

---

### Question 4: Walk through the authentication lifecycle of a HTTP request and a WebSocket connection in Galax-O.
* **File Reference:** [auth.guard.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/auth/auth.guard.ts), [axios.js](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/frontend/src/api/axios.js), and [chat.gateway.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/chat/chat.gateway.ts#L27-L36)
* **Ideal Answer:**
  * **HTTP Request:** The user logs in and receives a JWT token, which is stored in `sessionStorage` in the browser. Axios interceptors inject this token into the `Authorization: Bearer <token>` header of every outgoing HTTP request. On the backend, NestJS's custom `AuthGuard` extracts the token, verifies it asynchronously using `JwtService.verifyAsync()`, and mounts the payload (`req['user']`) on the request object.
  * **WebSocket Connection:** When the socket client initializes, the token is passed in the handshake options (`auth: { token }`). On connection, the NestJS `ChatGateway` interceptor in `handleConnection()` retrieves the token from `client.handshake.auth.token`, verifies it, and associates the WebSocket client ID with the authenticated user ID. If verification fails, `client.disconnect()` is called.
* **Why it is correct:**
  Unlike HTTP which is stateless and guards every request, WebSockets are stateful. The auth guard is run once during the initial connection handshake. Once established, subsequent messages over that connection do not require token parsing.
* **Common Mistakes Candidates Make:**
  * Assuming that NestJS HTTP Guards automatically protect WebSocket gateways (WebSockets use different decorators and gateways don't execute HTTP guards).
  * Forgetting that WebSocket authentication should happen at the handshake/connection level, not on every individual emit.
* **Possible Follow-up Questions:**
  * "What happens if a user's JWT expires during an active 3-hour WebSocket session?"
* **What a Strong Candidate Would Mention:**
  Explain how to handle token expiration for active connections (e.g., implementing a heartbeat that checks token validity periodically or emitting an auth-expired event from the backend to trigger a client-side disconnection and refresh token request).

---

## 3. Architecture and Trade-offs (Level 3)

### Question 5: In `AppModule`, the database ORM is configured with `synchronize: true`. Discuss the trade-offs of this decision and how you would handle schema updates in production.
* **File Reference:** [app.module.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/app.module.ts#L30)
* **Ideal Answer:**
  `synchronize: true` is convenient for local development because it automatically syncs database tables with TypeORM entities on server startup. However, **it must never be used in production**.
  * **Risks:** If an entity property is renamed or deleted, TypeORM might execute an `ALTER TABLE` or `DROP COLUMN` command, resulting in catastrophic data loss. Furthermore, it doesn't give developers fine-grained control over index creations or column constraints, and executing schema changes automatically on startup can cause deployment lockups and app crashes.
  * **Production Solution:** Disable `synchronize` and use **Database Migrations**. Migrations are SQL scripts that describe specific, incremental alterations to the database schema, with two methods: `up` (to apply changes) and `down` (to roll back changes).
* **Why it is correct:**
  Migrations provide an audit trail of schema changes, allow testing in staging databases, and can be reviewed before run, ensuring safe and predictable schema upgrades.
* **Common Mistakes Candidates Make:**
  * Saying `synchronize: true` is safe as long as the models don't change.
  * Not explaining *how* migrations work or how to write/run them using TypeORM CLI.
* **Possible Follow-up Questions:**
  * "How do you run migrations in a CI/CD pipeline?"
* **What a Strong Candidate Would Mention:**
  A strong candidate would talk about **zero-downtime deployments**. They would explain how to write schema migrations that are backwards-compatible (e.g., adding a nullable column first, copying data, and then making it non-nullable in a subsequent release) so that old application servers running concurrently with new servers during a rolling update don't break.

---

### Question 6: Look at `allhistory()` and `userhistory()` in the `MessagesService`. How are database queries executed, and how could they be optimized using async concurrency patterns?
* **File Reference:** [messages.service.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/messages/messages.service.ts#L94-L103)
* **Ideal Answer:**
  In `userhistory()`, we fetch two user entities sequentially:
  ```typescript
  const user1 = await this.userRepository.findOne({where:{userId:senderId}})
  const user2 = await this.userRepository.findOne({where:{username:receivername}})
  ```
  This is a sequential execution model where `user2` query does not start until `user1` finishes. This adds unnecessary latency (network round-trip times to the database are serial).
  We can optimize this by parallelizing the calls using `Promise.all`:
  ```typescript
  const [user1, user2] = await Promise.all([
    this.userRepository.findOne({ where: { userId: senderId } }),
    this.userRepository.findOne({ where: { username: receivername } })
  ]);
  ```
* **Why it is correct:**
  Node.js's asynchronous event loop can dispatch both database queries concurrently, reducing the overall execution time of the function to the duration of the slowest query instead of the sum of both queries.
* **Common Mistakes Candidates Make:**
  * Assuming that writing separate `await` statements runs them in parallel.
  * Using `Promise.all` on dependent queries (where query B needs the output of query A).
* **Possible Follow-up Questions:**
  * "What is the difference between `Promise.all` and `Promise.allSettled`?"
* **What a Strong Candidate Would Mention:**
  Point out that querying user details by ID/Username just to verify they exist before searching messages might be redundant. A single SQL query with join filters can fetch the messages directly, throwing an error if the result set is empty or verifying user existence in the same database transaction.

---

## 4. Debugging and "What If" Scenarios (Level 4)

### Question 7: In `UsersService`, the `remove()` method calls `this.userRepository.softDelete({userId:id})`. However, looking at `user.entity.ts`, there is a critical bug. What is the bug, what are its implications, and how do you fix it?
* **File Reference:** [users.service.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/users/users.service.ts#L46-L49) and [user.entity.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/users/entities/user.entity.ts)
* **Ideal Answer:**
  * **The Bug:** The `User` entity lacks a `@DeleteDateColumn` decorator.
  * **Implications:** In TypeORM, `softDelete` relies on a dedicated timestamp column (typically named `deletedAt`) annotated with `@DeleteDateColumn`. Without it, TypeORM's `softDelete()` method will fail or throw a runtime exception because it cannot find the column to record the deletion timestamp. The user will not actually be soft-deleted.
  * **Fix:** Add a `@DeleteDateColumn` column to [user.entity.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/users/entities/user.entity.ts):
    ```typescript
    @DeleteDateColumn()
    deletedAt?: Date;
    ```
* **Why it is correct:**
  TypeORM maps the `softDelete()` call to an `UPDATE` query setting this specific `@DeleteDateColumn` field to the current timestamp. Subsequent select queries using standard repository methods automatically filter out records where `deletedAt IS NOT NULL`.
* **Common Mistakes Candidates Make:**
  * Believing `softDelete` performs a standard `DELETE` query under the hood.
  * Not checking the entity file to verify the column decorators.
* **Possible Follow-up Questions:**
  * "If we implement soft delete, how do we write queries that *include* soft-deleted records when we need them?" (By using `.withDeleted()` in the query builder or find options).
* **What a Strong Candidate Would Mention:**
  Mention the database constraints: since the `username` column has a `unique: true` constraint, soft-deleting a user without renaming their username will prevent anyone else from registering with that username in the future, as the row still exists in the database. Detail solutions such as appending a timestamp to the username during deletion.

---

### Question 8: What happens in `handleConnection()` inside `ChatGateway` if a client tries to connect with an expired or invalid JWT? How would you make this code production-grade?
* **File Reference:** [chat.gateway.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/chat/chat.gateway.ts#L27-L52)
* **Ideal Answer:**
  * **The Bug:** `this.jwtService.verifyAsync(token)` is called without a `try-catch` block.
  * **Implications:** If a token is expired or invalid, `verifyAsync` throws an exception. This uncaught promise rejection bubbles up. In some runtime configurations, this could lead to memory leaks, unhandled warning logs, or connection leakage where the socket client is left in a half-open state instead of being closed cleanly.
  * **Fix:** Wrap the token verification in a `try-catch` block:
    ```typescript
    try {
      const payload = await this.jwtService.verifyAsync(token);
      // connection setup logic...
    } catch (err) {
      console.error("JWT Verification failed", err);
      client.disconnect(true); // pass true to close the underlying connection
    }
    ```
* **Why it is correct:**
  Handling errors locally prevents exceptions from throwing the asynchronous gateway setup off track and ensures that unauthorized connections are cleanly and immediately severed.
* **Common Mistakes Candidates Make:**
  * Thinking NestJS Global HTTP Filters or Exception Filters will catch exceptions thrown inside gateway connection hooks (they only catch exceptions thrown within active subscription handlers like `@SubscribeMessage`).
* **Possible Follow-up Questions:**
  * "What is the difference between `client.disconnect()` and `client.disconnect(true)` in Socket.io?"
* **What a Strong Candidate Would Mention:**
  Explain how to pass auth error messages back to the client using a connection error packet (e.g., calling `next(new Error("Unauthorized"))` in a Socket.io middleware) so that the frontend can react specifically (e.g. by logging the user out and redirecting) rather than guessing why the socket closed.

---

### Question 9: What happens if a user opens the Galax-O chat app in three browser tabs simultaneously? Analyze the race conditions and concurrency issues present in the gateway's state tracking.
* **File Reference:** [chat.gateway.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/chat/chat.gateway.ts#L23-L69)
* **Ideal Answer:**
  * **The Bug:** The gateway uses two main Maps:
    * `onlineUsers = new Map<string, string>(); // userId -> clientId`
    * `socketToUser = new Map<string, { userId, username }>(); // clientId -> userDetails`
  * **Race Condition:** 
    1. The user opens Tab 1: A socket connection is made, setting `onlineUsers.set(userId, client1.id)`.
    2. The user opens Tab 2: Another socket connection is made, setting `onlineUsers.set(userId, client2.id)` (overwriting Tab 1's socket ID in the map).
    3. The user closes Tab 1: `handleDisconnect()` is invoked for `client1.id`. It retrieves the user details, and calls `this.onlineUsers.delete(userconn.userId)`.
    4. **The Consequence:** The user is completely removed from the `onlineUsers` map, even though Tab 2 is still connected! Now, other users sending messages will see them as "offline", and private messages will fail to deliver in real-time to Tab 2.
* **Why it is correct:**
  Because the map maps a single `userId` to a single socket `clientId`, it fails to support 1-to-many mappings (one user, multiple active tabs).
* **Common Mistakes Candidates Make:**
  * Believing that Socket.io automatically manages multiple tabs under a single socket ID.
  * Suggesting to prevent users from opening multiple tabs instead of fixing the underlying data structure.
* **Possible Follow-up Questions:**
  * "How do you refactor the map to handle multiple active socket connections for a single user?"
* **What a Strong Candidate Would Mention:**
  Provide the code adjustment: store a list/set of socket IDs per user:
  ```typescript
  private onlineUsers = new Map<string, Set<string>>(); // userId -> Set of clientIds
  ```
  On connection, add the client ID to the set. On disconnection, remove only the disconnected client ID from the set. If the set is empty, delete the user ID from the map and trigger the "user-offline" broadcast.

---

## 5. Scalability, Security, Performance, and Production Readiness (Level 5)

### Question 10: In `MessagesService.unreadCount()`, you query the database for all unread messages of a user and process the grouping in application memory. Explain why this is a massive performance bottleneck and how to refactor it.
* **File Reference:** [messages.service.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/messages/messages.service.ts#L64-L79)
* **Ideal Answer:**
  * **The Problem:** The current code retrieves all unread messages for a user, fetches the related sender and receiver rows, transfers this entire payload over the network to the NestJS server, and maps them in memory to get a count:
    ```typescript
    const msgs = await this.messageRepository.find({ where: { receiver: { userId: loggedInUserId }, isRead: false }, relations: { sender: true } });
    const count = {};
    for (let msg of msgs) { ... }
    ```
    If a user has 50,000 unread messages, this fetches 50,000 full entity instances. This causes high CPU usage (JSON deserialization in single-threaded Node.js) and database-to-application network choke.
  * **The Fix:** Delegate the aggregation to the database using an SQL `GROUP BY` and `COUNT` query:
    ```typescript
    const counts = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoin('message.sender', 'sender')
      .select('sender.username', 'sender')
      .addSelect('COUNT(message.messageId)', 'count')
      .where('message.receiverUserId = :userId', { userId: loggedInUserId })
      .andWhere('message.isRead = :isRead', { isRead: false })
      .groupBy('sender.username')
      .getRawMany();
    ```
* **Why it is correct:**
  Database engines (like PostgreSQL) are highly optimized for indexing, grouping, and aggregating. By doing the work at the database level, we only transfer the final small result set (e.g. 5-10 rows representing each contact and their unread counts), saving CPU, memory, and network resources.
* **Common Mistakes Candidates Make:**
  * Not recognizing that doing data aggregation in NestJS memory is a scalability bottleneck.
  * Suggesting caching (e.g., Redis) as the first option instead of fixing the inefficient SQL query pattern.
* **Possible Follow-up Questions:**
  * "What database indexes are needed to make this aggregation query fast?" (A composite index on `(receiverUserId, isRead)`).
* **What a Strong Candidate Would Mention:**
  Mention the write performance side: if updates to `isRead` occur frequently, talk about how batching writes or keeping unread counts in a fast cache (like Redis hashes) can prevent heavy database writes.

---

### Question 11: How would you scale the Galax-O real-time WebSocket architecture horizontally to support millions of concurrent users?
* **File Reference:** [chat.gateway.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/chat/chat.gateway.ts)
* **Ideal Answer:**
  Currently, `ChatGateway` stores online users in-memory using `private onlineUsers = new Map<string, string>()`. If we scale the backend horizontally by running multiple service instances (behind a load balancer), these Maps will be isolated to individual server nodes. If User A connects to Node 1, and User B connects to Node 2, Node 1 will look up User B in its local map, conclude User B is offline, and fail to send the message in real-time.
  To scale horizontally:
  1. **Redis Adapter (Socket.io Redis Adapter):** Replace the default in-memory adapter with a Redis adapter. When a message is sent to User B, Node 1 publishes the event to Redis. All backend nodes subscribe to Redis. Node 2 receives the Redis event, notices that User B has an active socket connection on its instance, and forwards the message to User B.
  2. **Decouple Gateway and Database:** Separate the database write pipeline. Emit messages to a queue (like RabbitMQ or Kafka) for asynchronous persistence so the WebSocket servers can focus purely on real-time event distribution.
  3. **Load Balancer Sticky Sessions:** Configure sticky sessions (IP or cookie-based) on the load balancer (NGINX/AWS ALB). This is required because Socket.io starts with HTTP long-polling and upgrades to WebSockets, and both phases must reach the same server node.
* **Why it is correct:**
  This decouples connection state from individual servers, turning the socket layer into a stateless delivery mechanism coordinated by a fast message-broker (Redis/Kafka).
* **Common Mistakes Candidates Make:**
  * Suggesting using database polling to check if users are online.
  * Forgetting about the necessity of sticky sessions for Socket.io handshakes.
* **Possible Follow-up Questions:**
  * "How do we handle server crashes? What happens to the active connections and online user indicators?"
* **What a Strong Candidate Would Mention:**
  Discuss the trade-offs of using a Redis Cluster vs. Redis Pub/Sub vs. Kafka. A strong candidate would also mention how to implement a distributed heartbeat/presence service using Redis Sorted Sets (with TTLs) to keep track of user statuses across all nodes, instead of broadcasting "online-users" on every connection change, which creates $O(N^2)$ network chatter.

---

### Question 12: Critique the security implementations in your auth constants and users module. What are the severe risks, and how would you fix them?
* **File Reference:** [constants.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/auth/constants.ts), [users.controller.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/users/users.controller.ts#L30-L33), and [Chat.jsx](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/frontend/src/pages/Chat.jsx#L23)
* **Ideal Answer:**
  1. **Hardcoded JWT Secret:** In `constants.ts`, the secret key is hardcoded as `mySecretChat` and checked into source control. If this code is public, anyone can forge JWT tokens and gain administrative access to any user account.
     * **Fix:** Use NestJS `ConfigService` to read the secret from environment variables (`process.env.JWT_SECRET`) which are kept secure and ignored by git.
  2. **Unauthenticated Public Endpoint:** In `users.controller.ts`, the `findAll()` endpoint (`GET /users`) is completely exposed without an `@UseGuards(AuthGuard)`. Anyone on the internet can scrape the database and get a list of all user details (including user IDs and usernames).
     * **Fix:** Apply the `AuthGuard` to the `findAll()` route or class-level controller.
  3. **Local/Session Storage for Tokens:** In the frontend, the JWT is saved in `sessionStorage`. This makes the application highly vulnerable to Cross-Site Scripting (XSS) attacks. If an attacker injects a malicious script, they can read the session storage and steal the user's token.
     * **Fix:** Use secure, HTTPOnly, SameSite cookies to store JWT tokens, which are inaccessible to JavaScript.
* **Why it is correct:**
  These measures enforce the principle of least privilege, protect secrets, and mitigate common OWASP Top 10 vulnerabilities (like Sensitive Data Exposure and Broken Authentication).
* **Common Mistakes Candidates Make:**
  * Minimizing the severity of hardcoding secrets in git repositories.
  * Confusing XSS (Cross-Site Scripting) with CSRF (Cross-Site Request Forgery) protections.
* **Possible Follow-up Questions:**
  * "If we use HTTPOnly cookies, how does the frontend handle cross-origin requests (CORS)?" (Need to configure `credentials: true` and specify explicit origins instead of using `*`).
* **What a Strong Candidate Would Mention:**
  Mentioning the deployment of a **Content Security Policy (CSP)** to block inline scripts and restrict script sources, preventing XSS injection vectors from stealing sessionStorage keys in the first place.

---

## 6. Company-Style Follow-Up Questions (Level 6)

### Question 13 (Amazon/Atlassian Style): How would you optimize the system to support "Delivered" and "Read" message statuses efficiently without overloading the database with write locks?
* **File Reference:** [messages.service.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/messages/messages.service.ts#L104-L117)
* **Ideal Answer:**
  Currently, when a user opens a conversation, `userhistory()` is called. It fetches all messages, loops through them to set `isRead = true` and `isDelivered = true`, and then saves them using `this.messageRepository.save(msgs)`:
  ```typescript
  for(let msg of msgs) {
    if(msg.receiver.userId === senderId && msg.sender.username == receivername) {
      msg.isDelivered = true;
      msg.isRead = true;
    }
  }
  await this.messageRepository.save(msgs);
  ```
  This is highly inefficient. If there are 500 messages, TypeORM will generate 500 separate UPDATE statements or a massive batch query, putting row-level locks on the message table.
  * **Optimizations:**
    1. **Bulk Update Query:** Replace entity loops with a single raw update query.
       ```typescript
       await this.messageRepository.update(
         { receiver: { userId: senderId }, sender: { username: receivername }, isRead: false },
         { isRead: true, isDelivered: true }
       );
       ```
    2. **Write Buffering / Debouncing:** Instead of updating the database immediately on every single socket message read event, buffer the "read" receipts in memory (e.g. in Redis) and write them back to PostgreSQL in batches every few seconds.
* **Why it is correct:**
  Bulk updates run in a single transaction database execution block, drastically reducing transaction overhead and lock contention on database pages.
* **Common Mistakes Candidates Make:**
  * Neglecting the lock contention and connection pool exhaustion that occurs when firing hundreds of update queries sequentially.
* **Possible Follow-up Questions:**
  * "What index would optimize the bulk update statement?" (A composite index on `(receiverUserId, senderUserId, isRead)`).
* **What a Strong Candidate Would Mention:**
  A strong candidate would talk about UI optimistic updates: how the frontend should update the visual checkmarks immediately upon emitting/receiving the read event, handling sync errors gracefully in the background if the update fails.

---

### Question 14 (Google/Uber Style): Imagine a scenario where a user goes offline and returns online hours later. How would you design a synchronization protocol to sync missed messages without fetching the entire history?
* **File Reference:** [Chat.jsx](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/frontend/src/pages/Chat.jsx#L133-L150) and [messages.service.ts](file:///c:/Users/agarw/OneDrive/Desktop/LNSEL/galax-o/backend/src/messages/messages.service.ts)
* **Ideal Answer:**
  Instead of loading the entire chat window history when a user reconnects, we should implement a **Delta-Sync Protocol** based on high-watermark pagination or sequence IDs.
  1. **Sequence IDs / Timestamps:** Every message has an incremental `createdAt` timestamp (or a monotonic sequence ID).
  2. **Reconnection Handshake:** When the client reconnects via Socket.io, it passes the timestamp of the last message it successfully received in its local cache:
     ```javascript
     socket.emit("sync-request", { lastMessageTimestamp: "2026-07-02T12:00:00.000Z" });
     ```
  3. **Backend Query:** The backend queries the database for any messages sent to this user *after* the provided timestamp:
     ```typescript
     const missedMessages = await this.messageRepository.find({
       where: { receiver: { userId }, createdAt: MoreThan(lastMessageTimestamp) },
       order: { createdAt: 'ASC' }
     });
     ```
  4. **Merge and Render:** The backend emits these missed messages, and the client merges them into its local Redux/React state without reloading the page.
* **Why it is correct:**
  This minimizes the payload size, decreases DB query time, and avoids transferring duplicate messages that the client already has rendered locally.
* **Common Mistakes Candidates Make:**
  * Suggesting to clear the local client database/state and fetch all messages from scratch on every reconnection (this ruins user experience and scales horribly).
* **What a Strong Candidate Would Mention:**
  Mention the use of **vector clocks** or **UUID v7** (which are timestamp-sorted) to make queries efficient. Discuss how to handle network splits (e.g. using a cursor-based pagination model to fetch old historical messages on-demand as the user scrolls up, rather than eager loading).
